export type Role = "Teacher" | "Student" | "Researcher" | "Analyst";
export type Visibility = "public" | "private";

export type AgentAction =
  | { type: "createThread"; roomId: string; visibility: Visibility }
  | { type: "summarizeWindow"; roomId: string; k: number }
  | { type: "inviteUser"; roomId: string; userId: string }
  | { type: "labelMessage"; messageId: string; label: string }
  | { type: "analyzeFile"; s3Key: string }
  | { type: "welcomeBrief"; roomId: string; userId: string; kMessages?: number };

export const ACTION = {
  CreateThread: "CreateThread",
  Invite: "Invite",
  Summarize: "Summarize",
  LabelMessage: "LabelMessage",
  AnalyzeFile: "AnalyzeFile",
  PostAsAgent: "PostAsAgent"
} as const;

export type ActionKey = keyof typeof ACTION;


