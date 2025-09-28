import { SummaryService } from "../services/summaries";

export async function welcomeBriefImpl({ roomId, userId, kMessages = 40 }: { roomId: string; userId: string; kMessages?: number }) {
  // For now, we'll use the existing SummaryService to generate a welcome brief
  // In a real implementation, you'd load recent messages and user profile data
  const summaryService = new SummaryService();
  
  // Generate a personalized welcome brief
  const result = await summaryService.generateWelcomeBrief(roomId, userId, kMessages);
  
  return {
    brief: result.brief,
    messageId: result.messageId,
    kMessages,
    generatedAt: new Date().toISOString()
  };
}

export function validateWelcomeBrief(action: any): { roomId: string; userId: string; kMessages?: number } {
  if (!action.roomId || typeof action.roomId !== 'string') {
    throw new Error('roomId is required and must be a string');
  }
  if (!action.userId || typeof action.userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  if (action.kMessages !== undefined && (typeof action.kMessages !== 'number' || action.kMessages < 1)) {
    throw new Error('kMessages must be a positive number');
  }
  return { roomId: action.roomId, userId: action.userId, kMessages: action.kMessages };
}

export async function execWelcomeBrief(action: any) {
  const validated = validateWelcomeBrief(action);
  return await welcomeBriefImpl(validated);
}
