import { getOpenAI } from "../llm/provider";

export class SummaryService {
  // For demo we don't fetch real messages; we call LLM with a stub prompt.
  async summarizeWindow(roomId: string, k: number) {
    const openai = getOpenAI();
    const prompt = `Summarize the last ${k} messages in room ${roomId}.
Return 3 bullets and 1 crisp next-step.`;
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    const text = resp.choices[0]?.message?.content ?? "No summary.";
    return { roomId, k, summary: text };
  }
}

