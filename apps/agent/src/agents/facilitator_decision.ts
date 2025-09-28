import { getOpenAI } from "../llm/provider";

export type Decision = 
  | { mode: "SILENT" } 
  | { mode: "SPEAK", reason: string } 
  | { mode: "ACT", action: "summarize"|"createThread", args: any, reason: string };

/**
 * Hard filters that return BLOCK for messages that should never trigger the facilitator
 */
export function prefilters(msg: string): "BLOCK" | "PASS" {
  // Message authored by Agent (don't self-reply)
  if (msg.startsWith("Agent:")) return "BLOCK";
  
  // Message mentions a human @username (likely human-directed)
  if (/@\w+/.test(msg)) return "BLOCK";
  
  // Message length < 2 and not a command
  if (msg.length < 2 && !msg.startsWith("/")) return "BLOCK";
  
  return "PASS";
}

/**
 * Heuristic quick win detection for obvious questions
 */
export function heuristicShouldSpeak(msg: string, hasHumanMention: boolean): boolean {
  // Don't respond if there's a human mention
  if (hasHumanMention) return false;
  
  // Ends with ?
  if (msg.trim().endsWith("?")) return true;
  
  // Starts with question words
  const questionWords = /^(how|what|why|when|where|can|could|would|should|does|is|are|do|did)\b/i;
  if (questionWords.test(msg.trim())) return true;
  
  return false;
}

/**
 * LLM classifier for ambiguous cases
 */
export async function llmShouldSpeak(msg: string, recent: string[]): Promise<boolean> {
  try {
    const openai = getOpenAI();
    
    const recentLines = recent.slice(-8).map((line, i) => `${i + 1}. ${line}`).join("\n");
    
    const prompt = `Determine if the last user message in a multi-user chat is asking the AI assistant (not another human) for help.

Context (most recent last):
${recentLines}

User message:
${msg}

Return ONLY YES or NO.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10
    });

    const result = response.choices[0]?.message?.content?.trim().toUpperCase();
    return result === "YES";
  } catch (error) {
    console.error("LLM classifier failed:", error);
    return false; // Defensive: treat as NO on error
  }
}

/**
 * Choose action based on message content and context
 */
export function chooseAction(msg: string, recentCount: number): Decision {
  const lowerMsg = msg.toLowerCase();
  
  // Parse intent phrases for actions
  if (lowerMsg.includes("summarize") || lowerMsg.includes("recap") || lowerMsg.includes("tl;dr")) {
    return { 
      mode: "ACT", 
      action: "summarize", 
      args: { k: Math.min(40, recentCount) },
      reason: "user-requested-summary"
    };
  }
  
  if (lowerMsg.includes("fork") || lowerMsg.includes("thread") || lowerMsg.includes("move this to")) {
    return { 
      mode: "ACT", 
      action: "createThread", 
      args: { visibility: lowerMsg.includes("private") ? "private" : "public" },
      reason: "user-requested-thread"
    };
  }
  
  // If room got noisy and question implies recap
  if (recentCount >= 25 && (lowerMsg.includes("what") || lowerMsg.includes("recap"))) {
    return { 
      mode: "ACT", 
      action: "summarize", 
      args: { k: Math.min(40, recentCount) },
      reason: "noisy-room-recap"
    };
  }
  
  // Default to speaking
  return { mode: "SPEAK", reason: "general-question" };
}
