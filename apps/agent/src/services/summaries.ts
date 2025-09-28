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
    return { 
      roomId, 
      k, 
      summary: text,
      kMessages: k,
      generatedAt: new Date().toISOString()
    };
  }

  async generateWelcomeBrief(roomId: string, userId: string, kMessages: number = 40) {
    const openai = getOpenAI();
    const prompt = `Generate a personalized welcome brief for user ${userId} in room ${roomId}.

This should be a short, scannable overview covering:
• What changed since they were last here
• Key topics and open questions
• Suggested next actions
• Keep it friendly and concise (5 bullets max)

Format as bullet points with emojis for visual appeal.`;
    
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    
    const brief = resp.choices[0]?.message?.content ?? "Welcome back! Ready to continue the conversation.";
    
    // Generate a mock message ID for now
    const messageId = `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      brief,
      messageId,
      kMessages,
      generatedAt: new Date().toISOString()
    };
  }
}

