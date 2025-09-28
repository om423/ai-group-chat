import { on, emit, MessageCreatedEvent } from "../bus/events";
import { Decision, prefilters, heuristicShouldSpeak, llmShouldSpeak, chooseAction } from "./facilitator_decision";
import { executeWithPolicy } from "../auth/pdp";
import { postAsAgentImpl } from "../tools/postAsAgent";
import { summarizeImpl } from "../tools/summarizeWindow";
import { createThreadImpl } from "../tools/createThread";
import { getOpenAI } from "../llm/provider";
import { ChatState } from "../state/chat";
import { AgentFlags, AgentConfig } from "../state/agents";
import { ioEmit } from "../ws/emit";
import { MessageModel } from "../db/models";

const COOLDOWN_MS = AgentConfig.facilitator.cooldownMs;
const RECAP_THRESHOLD = AgentConfig.facilitator.recapThreshold;

// Policy-gated executors for facilitator actions
const execPost = executeWithPolicy(
  "PostAsAgent", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);

const execSumm = executeWithPolicy(
  "Summarize", 
  (args: { roomId: string, k: number }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true }),
  (args) => ({ windowSize: args.k })
);

const execThread = executeWithPolicy(
  "CreateThread", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);

// Facilitator Agent System Prompt
const FACILITATOR_SYSTEM_PROMPT = `You are a concise, helpful assistant embedded in a multi-user group chat.
Only answer when asked or clearly helpful. Prefer short, correct answers with concrete steps/examples.
If uncertain, say what's missing and propose a next step.`;

export function startFacilitator() {
  on("message.created", async (m: MessageCreatedEvent) => {
    if (!AgentFlags.facilitator) return;
    if (m.authorType !== "User") return;

    const now = Date.now();
    if (now - ChatState.lastAIPost(m.roomId) < COOLDOWN_MS) return;

    // Get recent messages from MongoDB
    const recentMessages = await MessageModel.find({ roomId: m.roomId })
      .sort({ ts: -1 })
      .limit(AgentConfig.facilitator.maxContext);

    const recent = recentMessages.reverse();
    const lines = recent.map(x => `${x.authorType}:${x.text}`);
    const hasHumanMention = /@\w+/.test(m.text);

    // Apply prefilters
    if (prefilters(m.text) === "BLOCK") return;

    let speak = false;
    let reason = "";

    // Explicit trigger
    if (/^(@ai|\/ai)\b/i.test(m.text)) {
      speak = true;
      reason = "explicit";
    }
    // Heuristic quick win
    else if (heuristicShouldSpeak(m.text, hasHumanMention)) {
      speak = true;
      reason = "heuristic";
    }
    // LLM classifier fallback
    else {
      speak = await llmShouldSpeak(m.text, lines);
      reason = "llm";
    }

    if (!speak) return;

    // Choose action
    const decision: Decision = chooseAction(m.text, recent.length);
    
    try {
      if (decision.mode === "SPEAK") {
        const openai = getOpenAI();
        const msgPairs = recent.slice(-8).map(x => ({
          role: x.authorType === "Agent" ? "assistant" : "user",
          content: x.text
        }));
        
        const response = await openai.chat.completions.create({
          model: AgentConfig.facilitator.model,
          temperature: 0.3,
          messages: [
            { role: "system", content: FACILITATOR_SYSTEM_PROMPT },
            ...msgPairs,
            { role: "user", content: m.text.replace(/^(@ai|\/ai)\s*/i, "") }
          ],
          max_tokens: AgentConfig.facilitator.maxTokens
        });

        const text = response.choices[0]?.message?.content ?? "I'm not sure yet.";
        
        await execPost(
          { type: "Agent", id: "facilitator", name: "FacilitatorAgent", orgId: "org-1" },
          () => postAsAgentImpl(m.roomId, text)
        );
      } 
      else if (decision.mode === "ACT" && decision.action === "summarize") {
        await execSumm(
          { type: "Agent", id: "facilitator", name: "FacilitatorAgent", orgId: "org-1" },
          () => summarizeImpl(m.roomId, decision.args.k)
        );
      } 
      else if (decision.mode === "ACT" && decision.action === "createThread") {
        await execThread(
          { type: "Agent", id: "facilitator", name: "FacilitatorAgent", orgId: "org-1" },
          () => createThreadImpl(m.roomId, decision.args.visibility)
        );
      }

      ChatState.markAIPost(m.roomId);
      
      // Emit telemetry
      ioEmit("agent:trace", {
        ts: Date.now(),
        phase: "success",
        action: "Facilitator",
        principal: { type: "Agent", id: "facilitator" },
        resource: { type: "Room", id: m.roomId },
        decision: "Allow",
        reason: `${decision.mode}-${reason}`
      });

      // Structured logging
      console.log(`facilitator.decide: { roomId: ${m.roomId}, explicit: ${reason === "explicit"}, heuristic: ${reason === "heuristic"}, llm: ${reason === "llm"}, decision: ${decision.mode} }`);
      
    } catch (e: any) {
      // Fallback to simple assistant reply on error
      try {
        await execPost(
          { type: "Agent", id: "facilitator", name: "FacilitatorAgent", orgId: "org-1" },
          () => postAsAgentImpl(m.roomId, "I'm having trouble processing that right now. Could you try rephrasing your question?")
        );
      } catch (fallbackError) {
        console.error("Facilitator fallback also failed:", fallbackError);
      }

      ioEmit("agent:trace", {
        ts: Date.now(),
        phase: "denied",
        action: "Facilitator",
        principal: { type: "Agent", id: "facilitator" },
        resource: { type: "Room", id: m.roomId },
        decision: "Deny",
        reason: e?.message || "unknown-error"
      });

      console.error("Facilitator error:", e);
    }
  });
}

// Legacy function for backward compatibility
export async function maybeRespondToUserMessage(msg: { roomId: string; authorId: string; text: string }) {
  // Emit event to trigger the new facilitator
  emit("message.created", {
    roomId: msg.roomId,
    authorType: "User",
    authorId: msg.authorId,
    text: msg.text,
    ts: Date.now()
  });
}