import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { postAsAgentImpl } from "../../tools/postAsAgent";
import { summarizeImpl } from "../../tools/summarizeWindow";
import { createThreadImpl } from "../../tools/createThread";
import { analyzeFileImpl } from "../../tools/analyzeFile";

// Post as Agent tool
export const postAsAgent = createTool({
  id: "PostAsAgent",
  inputSchema: z.object({
    roomId: z.string(),
    text: z.string(),
  }),
  description: "Post a message as an agent in a chat room",
  execute: async ({ context: { roomId, text } }) => {
    return await postAsAgentImpl(roomId, text);
  },
});

// Summarize Window tool
export const summarizeWindow = createTool({
  id: "SummarizeWindow",
  inputSchema: z.object({
    roomId: z.string(),
    k: z.number().optional().default(30),
  }),
  description: "Generate a summary of recent messages in a chat room",
  execute: async ({ context: { roomId, k } }) => {
    return await summarizeImpl(roomId, k);
  },
});

// Create Thread tool
export const createThread = createTool({
  id: "CreateThread",
  inputSchema: z.object({
    roomId: z.string(),
    visibility: z.enum(["public", "private"]).optional().default("public"),
  }),
  description: "Create a new thread in a chat room",
  execute: async ({ context: { roomId, visibility } }) => {
    return await createThreadImpl({ roomId, visibility });
  },
});

// Analyze File tool
export const analyzeFile = createTool({
  id: "AnalyzeFile",
  inputSchema: z.object({
    fileId: z.string(),
    roomId: z.string(),
  }),
  description: "Analyze an uploaded file and provide insights",
  execute: async ({ context: { fileId, roomId } }) => {
    return await analyzeFileImpl({ fileId, roomId });
  },
});
