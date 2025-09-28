import { runAgenticAction } from "@/cedar/actionAdapter";

export function actOpenFork(roomId: string, visibility: "public" | "private" = "public") {
  return runAgenticAction({ type: "openFork", roomId, visibility });
}

export function actTagMessage(roomId: string, messageId: string, label: string = "open-question") {
  return runAgenticAction({ type: "tagMessage", roomId, messageId, label });
}

export function actPostSummary(roomId: string, text: string, threadId?: string | null) {
  return runAgenticAction({ type: "postSummary", roomId, text, threadId: threadId ?? null });
}

export function actSummarizeWindow(roomId: string, k: number = 30) {
  return runAgenticAction({ type: "summarizeWindow", roomId, kMessages: k });
}

export function actAnalyzeFile(roomId: string, fileKey: string) {
  return runAgenticAction({ type: "analyzeFile", roomId, fileKey });
}

export function actAskAI(roomId: string, prompt: string) {
  return runAgenticAction({ type: "askAI", roomId, prompt });
}

export function actAssignMessage(roomId: string, messageId: string, assignedTo: string, dueAt?: string | null) {
  return runAgenticAction({ type: "assignMessage", roomId, messageId, assignedTo, dueAt: dueAt ?? null });
}

export function actToggleTaskDone(roomId: string, messageId: string, done: boolean) {
  return runAgenticAction({ type: "toggleTaskDone", roomId, messageId, done });
}

export function actListMyTasks(roomId: string, userId: string, includeDone = false) {
  return runAgenticAction({ type: "listMyTasks", roomId, userId, includeDone });
}
