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

export function spellToAction(
  spell: { id: string },
  ctx: { roomId: string; threadId?: string | null; targetMessageId?: string | null }
): AgenticAction | null {
  switch (spell.id) {
    case "openFork":
      return { type: "openFork", roomId: ctx.roomId, visibility: "public" };
    case "tagMessage":
      if (!ctx.targetMessageId) return null;
      return { type: "tagMessage", roomId: ctx.roomId, messageId: ctx.targetMessageId, label: "open-question" };
    case "postSummary":
      return { type: "postSummary", roomId: ctx.roomId, text: "Summary pending…", threadId: ctx.threadId ?? null };
    case "inviteUser":
      return { type: "inviteUser", roomId: ctx.roomId, userId: "demo-user-id" };
    case "analyzeFile":
      return { type: "analyzeFile", roomId: ctx.roomId, fileKey: "latest-upload" };
    case "summarizeWindow":
      return { type: "summarizeWindow", roomId: ctx.roomId, kMessages: 30 };
    case "askAI":
      return { type: "askAI", roomId: ctx.roomId, prompt: "" };
    case "welcomeBrief":
      return { type: "welcomeBrief", roomId: ctx.roomId, userId: "demo-user", kMessages: 40 };
    default:
      return null;
  }
}
