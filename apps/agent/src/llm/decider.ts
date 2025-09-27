import { getOpenAI } from "./provider";

/**
 * Cheap classifier to decide if the AI should reply.
 * Returns boolean + a short rationale. Keep prompt tight for speed.
 */
export async function shouldAIReplyImplicit(message: string, recent: string[]) {
  // Heuristic short-circuit first (fast path)
  const lower = message.trim().toLowerCase();
  const looksQuestion =
    /[?]$/.test(lower) ||
    /^(how|what|why|when|where|can|could|would|should|does|is|are|do|did)\b/.test(lower);
  const mentionsUser = /@[\w-]+/.test(message); // likely directed to a person
  if (looksQuestion && !mentionsUser) return { should: true, reason: "heuristic: question-like" };

  // Fallback to LLM classifier (very short prompt)
  const openai = getOpenAI();
  const prompt = `Decide if the last user message is asking the AI assistant for help (not another human).
Return ONLY "YES" or "NO".
Recent context (most recent last):
${recent.map((s, i) => `${i+1}. ${s}`).join("\n")}

User message:
${message}
`;
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });
  const text = (resp.choices[0]?.message?.content || "").trim().toUpperCase();
  const should = text.startsWith("Y");
  return { should, reason: `llm:${text || "unknown"}` };
}

export async function answerQuestion(roomId: string, message: string, recentPairs: {role:"user"|"assistant", content:string}[]) {
  const openai = getOpenAI();
  const sys = "You are a concise, helpful assistant in a group chat. Answer only if asked or relevant.";
  const msgs = [{ role: "system", content: sys }, ...recentPairs, { role: "user", content: message }];
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: msgs,
    temperature: 0.3
  });
  return resp.choices[0]?.message?.content ?? "I'm not sure yet.";
}

