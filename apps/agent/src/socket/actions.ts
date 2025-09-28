import type { Server, Socket } from "socket.io";
import { pdpDecide } from "../auth/pdp";
import {
  createThreadImpl,
  labelMessageImpl,
  summarizeImpl,
  analyzeFileImpl,
  postAsAgentImpl,
  welcomeBriefImpl,
  assignMessageImpl,
  toggleTaskDoneImpl,
  listMyTasksImpl,
} from "../tools";

export type AgenticAction =
  | { type: "openFork"; roomId: string; visibility?: "public" | "private" }
  | { type: "tagMessage"; roomId: string; messageId: string; label: string }
  | { type: "postSummary"; roomId: string; text: string; threadId?: string | null }
  | { type: "inviteUser"; roomId: string; userId: string }
  | { type: "analyzeFile"; roomId: string; fileKey: string }
  | { type: "summarizeWindow"; roomId: string; kMessages?: number }
  | { type: "askAI"; roomId: string; prompt?: string }
  | { type: "welcomeBrief"; roomId: string; userId: string; kMessages?: number }
  | { type: "assignMessage"; roomId: string; messageId: string; assignedTo: string; dueAt?: string | null }
  | { type: "toggleTaskDone"; roomId: string; messageId: string; done: boolean }
  | { type: "listMyTasks"; roomId: string; userId: string; includeDone?: boolean };

export type AgenticResult = {
  ok: boolean;
  action: AgenticAction;
  data?: any;
  error?: string;
  pdp?: { decision: "ALLOW" | "DENY"; explanation?: string };
};

export function registerActionHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("action:run", async (action: AgenticAction) => {
      const res: AgenticResult = { ok: false, action };

      try {
        // PDP (permissive): always ALLOW but add explanation for trace
        const pdp = await pdpDecide({ action, subject: socket.data?.user, resource: { roomId: action.roomId } });

        // Execute tool
        let data: any = null;
        switch (action.type) {
          case "openFork":
            data = await createThreadImpl({ roomId: action.roomId, visibility: action.visibility ?? "public" });
            break;
          case "tagMessage":
            data = await labelMessageImpl({ messageId: action.messageId, roomId: action.roomId, label: action.label, classification: "internal" });
            break;
          case "postSummary":
            data = await postAsAgentImpl({ roomId: action.roomId, text: action.text });
            break;
          case "inviteUser":
            // TODO: implement invite user
            data = { invited: action.userId };
            break;
          case "analyzeFile":
            data = await analyzeFileImpl({ fileId: action.fileKey, roomId: action.roomId });
            break;
          case "summarizeWindow":
            data = await summarizeImpl({ roomId: action.roomId, k: action.kMessages ?? 30 });
            break;
          case "askAI":
            // TODO: route to facilitator direct-answer
            data = { prompt: action.prompt ?? "" };
            break;
          case "welcomeBrief":
            data = await welcomeBriefImpl({ roomId: action.roomId, userId: action.userId, kMessages: action.kMessages ?? 40 });
            break;
          case "assignMessage":
            data = await assignMessageImpl({ roomId: action.roomId, messageId: action.messageId, assignedTo: action.assignedTo, dueAt: action.dueAt ?? null });
            break;
          case "toggleTaskDone":
            data = await toggleTaskDoneImpl({ roomId: action.roomId, messageId: action.messageId, done: action.done });
            break;
          case "listMyTasks":
            data = await listMyTasksImpl({ roomId: action.roomId, userId: action.userId, includeDone: !!action.includeDone });
            break;
        }

        res.ok = true;
        res.data = data;
        res.pdp = pdp;

        // Broadcast result to everyone in room
        io.to(action.roomId).emit("action:result", res);
      } catch (err: any) {
        res.ok = false;
        res.error = err?.message ?? "Unknown error";
        io.to(action.roomId).emit("action:result", res);
      }
    });
  });
}
