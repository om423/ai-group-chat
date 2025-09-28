import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { Server as IOServer } from "socket.io";

import { connectMongo } from "./db/mongo";
import { MessageModel, RoomModel, ThreadModel, ThreadMessageModel } from "./db/models";

// Connect to MongoDB
connectMongo().then(() => console.log("[agent] Mongo connected"));

import { validateCreateThread, execCreateThread, createThreadImpl } from "./tools/createThread";
import { validateSummarizeWindow, execSummarizeWindow, summarizeImpl } from "./tools/summarizeWindow";
import { getPrincipalFromReq } from "./auth/principal";

import { FileStore } from "./services/files";
import { validateAnalyzeFile, execAnalyzeFile, analyzeFileImpl } from "./tools/analyzeFile";
import { validateLabelMessage, execLabelMessage, labelMessageImpl } from "./tools/labelMessage";
import { Tracer } from "./telemetry/tracer";
import { setIO } from "./ws/emit";
import { execPostAsAgent, postAsAgentImpl, validatePostAsAgent } from "./tools/postAsAgent";
import { Rooms } from "./state/rooms";
import { AgentMessages } from "./state/messages";
import { ChatState, ChatMsg } from "./state/chat";
import { startFacilitator } from "./agents/facilitator";
import { startFacilitatorMastra } from "./agents/facilitator_mastra";
import { startDocAnalyst } from "./agents/docAnalyst";
import { startDocAnalystMastra } from "./agents/docAnalyst_mastra";
import { startSummarizer } from "./agents/summarizer";
import { startSummarizerMastra } from "./agents/summarizer_mastra";
import { emit } from "./bus/events";
import { registerActionHandlers } from "./socket/actions";
import { mastra } from "./mastra";

const PORT = 4111;
const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: "*" } });
setIO(io);

// Register action handlers
registerActionHandlers(io);

app.use(cors({ origin: "*" }));
app.use(express.json());

const upload = multer({ dest: path.join(process.cwd(), "uploads") });
if (!fs.existsSync(path.join(process.cwd(), "uploads"))) fs.mkdirSync(path.join(process.cwd(), "uploads"));

io.on("connection", (socket) => {
  console.log("[agent] socket client connected", socket.id);
  
  // Join socket to rooms
  socket.on("room:join", (roomId: string) => {
    socket.join(roomId);
    console.log(`[agent] socket ${socket.id} joined room ${roomId}`);
  });
});

// Health & traces
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/traces", (_req, res) => res.json({ ok: true, traces: Tracer.all() }));

function emitTrace(trace: Parameters<typeof Tracer.push>[0]) {
  Tracer.push(trace);
  io.emit("agent:trace", trace);
}

// ---- Upload (local temp storage) ----
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file!;
  const { roomId = "r1", orgId = "org-1", classification = "internal" } = req.body;
  const fileId = `f_${Math.random().toString(36).slice(2)}`;
  FileStore.put({
    id: fileId,
    roomId, orgId,
    filename: file.originalname,
    mime: file.mimetype,
    classification,
    path: file.path
  });
  res.json({ ok: true, fileId });
});

// Helper: wrap tool execution with emitTrace
async function runTool({
  req,
  input,
  action,
  resourceBuilder,
  context,
  exec
}: {
  req: express.Request;
  input: any;
  action: string;
  resourceBuilder: () => any;
  context?: any;
  exec: () => Promise<any>;
}) {
  const principal = getPrincipalFromReq(req);
  const resource = resourceBuilder();
  const correlationId = Math.random().toString(36).slice(2);
  const start = Date.now();

  emitTrace({ ts: start, principal, action, resource, context, phase: "requested", correlationId });

  try {
    // PDP decision happens inside execWithPolicy (Task 4).
    // To capture the decision, we'll bubble up errors and emit phases around the call.
    const result = await exec();

    emitTrace({
      ts: Date.now(), principal, action, resource, context,
      phase: "success", correlationId, durationMs: Date.now() - start, decision: "Allow"
    });
    return { ok: true, result };
  } catch (e: any) {
    emitTrace({
      ts: Date.now(), principal, action, resource, context,
      phase: "denied", correlationId, durationMs: Date.now() - start, decision: "Deny", reason: e?.message
    });
    return { ok: false, error: e?.message || "Denied" };
  }
}

// ---- Tools (policy-gated) ----
app.post("/tools/create-thread", async (req, res) => {
  const principal = getPrincipalFromReq(req);
  const augmented = {
    ...req.body,
    createdBy:
      principal.type === "User"
        ? principal.id
        : principal.name || principal.id || "facilitator",
  };
  const body = validateCreateThread(augmented);
  const out = await runTool({
    req,
    input: body,
    action: "CreateThread",
    resourceBuilder: () => {
      const rc = Rooms.get(body.roomId);
      return { type: "Room", id: body.roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent };
    },
    context: { visibility: body.visibility },
    exec: async () => execCreateThread(principal, createThreadImpl, body)
  });
  res.status(out.ok ? 200 : 403).json(out);
});

app.post("/tools/summarize-window", async (req, res) => {
  const body = validateSummarizeWindow(req.body);
  const out = await runTool({
    req,
    input: body,
    action: "Summarize",
    resourceBuilder: () => {
      const rc = Rooms.get(body.roomId);
      return { type: "Room", id: body.roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent };
    },
    context: { windowSize: body.k },
    exec: async () => {
      const principal = getPrincipalFromReq(req);
      return execSummarizeWindow(principal, summarizeImpl, body);
    }
  });
  res.status(out.ok ? 200 : 403).json(out);
});

app.post("/tools/analyze-file", async (req, res) => {
  const body = validateAnalyzeFile(req.body);
  const file = FileStore.get(body.fileId);
  const out = await runTool({
    req,
    input: body,
    action: "AnalyzeFile",
    resourceBuilder: () => ({ type: "File", id: body.fileId, roomId: file?.roomId, orgId: file?.orgId, classification: file?.classification }),
    context: { roomMember: true },
    exec: async () => {
      const principal = getPrincipalFromReq(req);
      return execAnalyzeFile(principal, analyzeFileImpl, body);
    }
  });
  res.status(out.ok ? 200 : 403).json(out);
});

app.post("/tools/label-message", async (req, res) => {
  const body = validateLabelMessage(req.body);
  const out = await runTool({
    req,
    input: body,
    action: "LabelMessage",
    resourceBuilder: () => ({ type: "Message", id: body.messageId }),
    context: { classification: body.classification },
    exec: async () => {
      const principal = getPrincipalFromReq(req);
      return execLabelMessage(principal, labelMessageImpl, body);
    }
  });
  res.status(out.ok ? 200 : 403).json(out);
});

// Demo "user joined" event: summarize + post welcome (policy-gated)
app.post("/events/user-joined", async (req, res) => {
  const { roomId = "r1", as = "Agent" } = req.body || {};
  const rc = Rooms.get(roomId);
  
  // 1) Summarize
  const summarizeBody = { roomId, k: 30 };
  const summarizeOut = await runTool({
    req,
    input: summarizeBody,
    action: "Summarize",
    resourceBuilder: () => ({ type: "Room", id: roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent }),
    context: { windowSize: 30 },
    exec: async () => {
      const principal = getPrincipalFromReq(req);
      return execSummarizeWindow(principal, summarizeImpl, summarizeBody);
    }
  });

  // 2) PostAsAgent
  if (summarizeOut.ok) {
    const briefText = `Welcome! Here's the latest:\n${summarizeOut.result.summary}`;
    const postBody = { roomId, text: briefText };
    const postOut = await runTool({
      req,
      input: postBody,
      action: "PostAsAgent",
      resourceBuilder: () => ({ type: "Room", id: roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent }),
      exec: async () => {
        const principal = getPrincipalFromReq(req);
        return execPostAsAgent(principal, postAsAgentImpl, postBody);
      }
    });
    return res.status(200).json({ ok: true, summarize: summarizeOut, post: postOut });
  }

  return res.status(200).json({ ok: false, summarize: summarizeOut });
});

// ---- Room Context Management ----
// Get all rooms/ctx (for UI)
app.get("/rooms", (_req, res) => res.json({ ok: true, rooms: Rooms.all() }));

// Toggle teacherPresent for a room
app.post("/rooms/:id/context", (req, res) => {
  const { teacherPresent } = req.body || {};
  const room = Rooms.setTeacherPresent(req.params.id, Boolean(teacherPresent));
  res.json({ ok: true, room });
});

// ---- Reset Endpoints ----
// Read & reset traces/messages
app.get("/messages", (_req, res) => res.json({ ok: true, messages: AgentMessages.all() }));
app.post("/traces/reset", (_req, res) => { Tracer.reset(); res.json({ ok: true }); });
app.post("/messages/reset", (_req, res) => { 
  AgentMessages.reset(); 
  io.emit("agent:message:reset", {}); 
  res.json({ ok: true }); 
});

// ---- Chat Endpoints ----
function emitChatMessage(msg: ChatMsg) {
  io.emit("chat:message", msg);
}

app.post("/chat/send", async (req, res) => {
  const { roomId = "r1", text = "" } = req.body || {};
  const principal = getPrincipalFromReq(req);

  // ensure room exists (seed default org)
  await RoomModel.updateOne(
    { roomId }, 
    { $setOnInsert: { roomId, name: `Room ${roomId}`, orgId: "org-1" }}, 
    { upsert: true }
  );

  const msg = await MessageModel.create({
    roomId,
    authorType: principal.type,
    authorId: principal.type === "User" ? principal.id : (principal.name || "Agent"),
    text: String(text),
    ts: Date.now()
  });

  io.emit("chat:message", msg.toObject());

  // Trigger agent responses for user messages
  if (principal.type === "User") {
    // Emit event to trigger agent processing
    emit("message.created", { 
      roomId, 
      authorType: "User",
      authorId: principal.id!, 
      text, 
      ts: Date.now() 
    });
  }

  res.json({ ok: true, message: msg });
});

// ---- Thread Endpoints ----
app.get("/rooms/:roomId/threads", async (req, res) => {
  try {
    const rows = await ThreadModel.find({ roomId: req.params.roomId }).sort({ updatedAt: -1 });
    res.json({
      ok: true,
      threads: rows.map((row) => ({
        threadId: row.threadId,
        roomId: row.roomId,
        name: row.name,
        visibility: row.visibility,
        createdBy: row.createdBy,
        originMessageId: row.originMessageId,
        originAuthorId: row.originAuthorId,
        originAuthorType: row.originAuthorType,
        originSnippet: row.originSnippet,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || "Failed to load threads" });
  }
});

app.get("/threads/:threadId/history", async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit ?? "50"), 10);
    const rows = await ThreadMessageModel.find({ threadId: req.params.threadId })
      .sort({ ts: 1 })
      .limit(limit);
    res.json({ ok: true, messages: rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || "Failed to load thread history" });
  }
});

app.post("/threads/:threadId/send", async (req, res) => {
  try {
    const { text = "" } = req.body || {};
    const thread = await ThreadModel.findOne({ threadId: req.params.threadId });
    if (!thread) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }

    const principal = getPrincipalFromReq(req);
    const authorType = principal.type;
    const authorId = principal.type === "User" ? principal.id : principal.name || principal.id || "Agent";

    const msg = await ThreadMessageModel.create({
      threadId: req.params.threadId,
      roomId: thread.roomId,
      authorType,
      authorId,
      text: String(text),
      ts: Date.now(),
    });

    io.emit("thread:message", msg.toObject());

    res.json({ ok: true, message: msg });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || "Failed to send thread message" });
  }
});

// Last N messages for a room
app.get("/chat/:roomId/history", async (req, res) => {
  const n = parseInt(String(req.query.limit || "50"), 10);
  const rows = await MessageModel.find({ roomId: req.params.roomId }).sort({ ts: 1 }).limit(n);
  res.json({ ok: true, messages: rows });
});

// Your rooms (simple)
app.get("/rooms", async (_req, res) => {
  const rooms = await RoomModel.find().sort({ updatedAt: -1 }).limit(20);
  res.json({ ok: true, rooms });
});

// Create room
app.post("/rooms", async (req, res) => {
  const { roomId, name } = req.body;
  const doc = await RoomModel.create({ roomId, name, orgId: "org-1" });
  res.json({ ok: true, room: doc });
});

// Add endpoint to get file analysis
app.get("/files/:fileId/analysis", async (req, res) => {
  try {
    const { DocAnalysisModel } = await import("./db/models");
    const analysis = await DocAnalysisModel.findOne({ fileId: req.params.fileId });
    
    if (!analysis) {
      return res.status(404).json({ ok: false, error: "Analysis not found" });
    }
    
    res.json({ ok: true, analysis: analysis.analysis });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Add endpoint to trigger manual summary
app.post("/summarize/:roomId", async (req, res) => {
  try {
    const { triggerSummary } = await import("./agents/summarizer");
    const { type = "rolling" } = req.body;
    
    await triggerSummary(req.params.roomId, type);
    res.json({ ok: true, message: "Summary triggered" });
  } catch (error: any) {
    console.error("Error triggering summary:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Start the agents
// Start Mastra-based agents (new implementation)
startFacilitatorMastra();
startDocAnalystMastra();
startSummarizerMastra();

// Keep original agents as fallback (commented out for now)
// startFacilitator();
// startDocAnalyst();
// startSummarizer();

// Initialize Mastra server
try {
  // Mastra server is already integrated with Express, no need to start separately
  console.log('[mastra] Mastra configuration loaded successfully');
} catch (error) {
  console.error('[mastra] Failed to load Mastra configuration:', error);
}

server.listen(PORT, () => console.log(`[agent] listening on :${PORT}`));
