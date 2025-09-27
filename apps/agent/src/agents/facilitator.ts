import { ChatState } from "../state/chat";
import { shouldAIReplyImplicit, answerQuestion } from "../llm/decider";
import { ioEmit } from "../ws/emit";
import { executeWithPolicy } from "../auth/pdp";
import { postAsAgentImpl } from "../tools/postAsAgent";
import { summarizeImpl } from "../tools/summarizeWindow";
import { getPrincipalFromMsg } from "./principalFromMsg";
import { Rooms } from "../state/rooms";
import { MessageModel } from "../db/models";

const COOLDOWN_MS = 20_000; // simple debounce to avoid spam

// Policy-gated executors we already have:
const execPostAsAgent = executeWithPolicy(
  "PostAsAgent",
  (args: { roomId: string }) => {
    const rc = Rooms.get(args.roomId);
    return { type: "Room", id: args.roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent };
  }
);
const execSummarize = executeWithPolicy(
  "Summarize",
  (args: { roomId: string, k: number }) => {
    const rc = Rooms.get(args.roomId);
    return { type: "Room", id: args.roomId, orgId: rc.orgId, teacherPresent: rc.teacherPresent };
  },
  (args) => ({ windowSize: args.k })
);

// Decide & respond if needed
export async function maybeRespondToUserMessage(msg: { roomId: string; authorId: string; text: string }) {
  const now = Date.now();
  const last = ChatState.lastAIPost(msg.roomId);
  if (now - last < COOLDOWN_MS) return; // cool down

  // explicit trigger?
  const trimmed = msg.text.trim();
  const explicit = /^(@ai|\/ai)\b/i.test(trimmed);
  const cleaned = explicit ? trimmed.replace(/^(@ai|\/ai)\s*/i, "") : trimmed;

  // Get recent messages from MongoDB
  const recentMessages = await MessageModel.find({ roomId: msg.roomId })
    .sort({ ts: -1 })
    .limit(12);
  
  const recent = recentMessages.reverse().map(m => `${m.authorType}:${m.text}`);
  const recentPairs = recentMessages.slice(-8).reverse().map(m => ({
    role: m.authorType === "Agent" ? "assistant" : "user",
    content: m.text
  }));

  let should = false;
  let reason = "none";
  if (explicit) {
    should = true;
    reason = "explicit";
  } else {
    const dec = await shouldAIReplyImplicit(cleaned, recent);
    should = dec.should;
    reason = dec.reason;
  }

  if (!should) return;

  // Produce answer
  const answer = await answerQuestion(msg.roomId, cleaned, recentPairs);

  // Build a principal for the agent (least-privileged)
  const principal = getPrincipalFromMsg({ type: "Agent", id: "facilitator", orgId: "org-1", name: "FacilitatorAgent" });

  // Optionally summarize if conversation is long (demo: > 15 msgs)
  const totalMessages = await MessageModel.countDocuments({ roomId: msg.roomId });
  if (totalMessages > 15) {
    try {
      await execSummarize(principal, summarizeImpl, { roomId: msg.roomId, k: 30 });
    } catch { /* ignore summarizes denied */ }
  }

  // Post the agent reply (policy-gated)
  try {
    await execPostAsAgent(principal, postAsAgentImpl, { roomId: msg.roomId, text: answer });
    ChatState.markAIPost(msg.roomId);
    ioEmit("agent:trace", {
      ts: Date.now(),
      phase: "success",
      action: "FacilitatorReply",
      principal: { type: "Agent", id: "facilitator" },
      resource: { type: "Room", id: msg.roomId },
      decision: "Allow",
      reason
    });
  } catch (e: any) {
    ioEmit("agent:trace", {
      ts: Date.now(),
      phase: "denied",
      action: "FacilitatorReply",
      principal: { type: "Agent", id: "facilitator" },
      resource: { type: "Room", id: msg.roomId },
      decision: "Deny",
      reason: e?.message || "Denied"
    });
  }
}
