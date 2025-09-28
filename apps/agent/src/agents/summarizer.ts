import { on } from "../bus/events";
import { executeWithPolicy } from "../auth/pdp";
import { summarizeImpl } from "../tools/summarizeWindow";
import { postAsAgentImpl } from "../tools/postAsAgent";
import { ChatState } from "../state/chat";
import { ioEmit } from "../ws/emit";
import { AgentFlags, AgentConfig } from "../state/agents";

// Policy-gated executors
const execSumm = executeWithPolicy(
  "Summarize", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true }),
  (args: { k: number }) => ({ windowSize: args.k })
);

const execPost = executeWithPolicy(
  "PostAsAgent", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);

// Configuration
const MSG_THRESHOLD = Number(process.env.SUMMARIZER_THRESHOLD || 25);
const ROLLING_COOLDOWN = Number(process.env.SUMMARIZER_COOLDOWN_MS || 60000);
const WINDOW_SIZE = Number(process.env.SUMMARIZER_WINDOW || 40);

// Track last recap times per room
let lastRecap: Record<string, number> = {};

export function startSummarizer() {
  if (!AgentFlags.summarizer) {
    console.log("SummarizerAgent disabled");
    return;
  }

  console.log("Starting SummarizerAgent with threshold:", MSG_THRESHOLD, "cooldown:", ROLLING_COOLDOWN);

  // Rolling summaries - trigger when message count exceeds threshold
  on("message.created", async (m: any) => {
    if (m.authorType !== "User") return;
    
    const recentCount = ChatState.countSinceLastSummary(m.roomId);
    const now = Date.now();
    
    // Check if we should trigger a rolling summary
    if (recentCount > MSG_THRESHOLD && (now - (lastRecap[m.roomId] || 0) > ROLLING_COOLDOWN)) {
      console.log(`SummarizerAgent: Triggering rolling summary for room ${m.roomId} (${recentCount} messages since last summary)`);
      await doSummary(m.roomId, "rolling");
      lastRecap[m.roomId] = now;
      ChatState.markSummary(m.roomId);
    }
  });

  // Welcome brief - trigger when user joins room
  on("room.user.joined", async ({ roomId, userId }: { roomId: string; userId: string }) => {
    console.log(`SummarizerAgent: Triggering welcome brief for room ${roomId}, user ${userId}`);
    await doSummary(roomId, "welcome");
  });

  // Thread summaries - optional trigger when thread is created
  on("thread.created", async ({ roomId, threadId }: { roomId: string; threadId: string }) => {
    console.log(`SummarizerAgent: Triggering thread summary for room ${roomId}, thread ${threadId}`);
    await doSummary(roomId, "thread", threadId);
  });
}

async function doSummary(roomId: string, type: "welcome" | "rolling" | "thread", threadId?: string) {
  const start = Date.now();
  const correlationId = `sum-${roomId}-${type}-${start}`;
  
  ioEmit("agent:trace", { 
    ts: start, 
    phase: "requested", 
    action: "Summarize", 
    principal: { type: "Agent", id: "summarizer" }, 
    resource: { type: "Room", id: roomId }, 
    correlationId 
  });

  try {
    // Generate summary using existing SummarizeWindow tool
    const res = await execSumm(
      { type: "Agent", id: "summarizer", name: "SummarizerAgent", orgId: "org-1" },
      () => summarizeImpl(roomId, WINDOW_SIZE)
    );

    if (!res || !res.summary) {
      throw new Error("No summary generated");
    }

    // Create appropriate message based on type
    let messageText = "";
    let icon = "📝";
    
    switch (type) {
      case "welcome":
        icon = "📋";
        messageText = `**Welcome Brief:**\n${res.summary}`;
        break;
      case "rolling":
        icon = "📝";
        messageText = `**Rolling Recap:**\n${res.summary}`;
        break;
      case "thread":
        icon = "🧵";
        messageText = `**Thread Summary:**\n${res.summary}`;
        break;
    }

    // Post the summary as an agent message
    await execPost(
      { type: "Agent", id: "summarizer", name: "SummarizerAgent", orgId: "org-1" },
      () => postAsAgentImpl(roomId, `${icon} ${messageText}`)
    );

    // Optional: Save to MongoDB for analytics
    try {
      const { RoomSummaryModel } = await import("../db/models");
      await RoomSummaryModel.create({
        roomId,
        threadId,
        type,
        ts: Date.now(),
        text: res.summary,
        generatedBy: "SummarizerAgent"
      });
    } catch (dbError) {
      console.warn("Failed to save summary to database:", dbError);
    }

    ioEmit("agent:trace", { 
      ts: Date.now(), 
      phase: "success", 
      action: "Summarize", 
      principal: { type: "Agent", id: "summarizer" }, 
      resource: { type: "Room", id: roomId }, 
      decision: "Allow", 
      durationMs: Date.now() - start,
      correlationId 
    });

    console.log(`SummarizerAgent: Successfully generated ${type} summary for room ${roomId}`);

  } catch (e: any) {
    ioEmit("agent:trace", { 
      ts: Date.now(), 
      phase: "denied", 
      action: "Summarize", 
      principal: { type: "Agent", id: "summarizer" }, 
      resource: { type: "Room", id: roomId }, 
      decision: "Deny", 
      reason: e?.message,
      durationMs: Date.now() - start,
      correlationId 
    });

    console.error(`SummarizerAgent: Failed to generate ${type} summary for room ${roomId}:`, e);
  }
}

// Manual trigger function for UI
export async function triggerSummary(roomId: string, type: "welcome" | "rolling" | "thread" = "rolling") {
  if (!AgentFlags.summarizer) {
    throw new Error("SummarizerAgent is disabled");
  }
  
  await doSummary(roomId, type);
  lastRecap[roomId] = Date.now();
  ChatState.markSummary(roomId);
}
