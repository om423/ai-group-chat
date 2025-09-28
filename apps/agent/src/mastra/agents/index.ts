import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { postAsAgent, summarizeWindow, createThread, analyzeFile } from "../tools";
import { AgentConfig } from "../../state/agents";

// Facilitator Agent - handles chat interactions and decision making
export const facilitatorAgent = new Agent({
  name: "FacilitatorAgent",
  description: "A concise, helpful assistant embedded in multi-user group chat that handles user interactions and decides when to respond",
  instructions: `You are a concise, helpful assistant embedded in a multi-user group chat.
Only answer when asked or clearly helpful. Prefer short, correct answers with concrete steps/examples.
If uncertain, say what's missing and propose a next step.

You can:
- Post messages as an agent when users ask questions or need help
- Create threads for focused discussions
- Generate summaries when conversations get long
- Analyze files when users upload documents

Always be helpful but concise. Use tools only when necessary.`,
  model: openai(AgentConfig.facilitator.model, {
    apiKey: process.env.OPENAI_API_KEY || "sk-test-key",
  }),
  tools: {
    postAsAgent,
    createThread,
    summarizeWindow,
  },
});

// Summarizer Agent - handles automatic summarization
export const summarizerAgent = new Agent({
  name: "SummarizerAgent", 
  description: "An agent that automatically generates summaries for chat rooms, welcome briefs, and thread summaries",
  instructions: `You are a summarizer agent that helps keep conversations organized by generating summaries.

You can:
- Generate rolling summaries when conversations get long
- Create welcome briefs for new users joining rooms
- Summarize threads for focused discussions

Always provide clear, concise summaries that capture the key points and decisions made in conversations.`,
  model: openai(AgentConfig.summarizer.model, {
    apiKey: process.env.OPENAI_API_KEY || "sk-test-key",
  }),
  tools: {
    postAsAgent,
    summarizeWindow,
  },
});

// Document Analyst Agent - handles file analysis
export const docAnalystAgent = new Agent({
  name: "DocAnalystAgent",
  description: "An agent that analyzes uploaded documents and provides insights, summaries, and actionable recommendations",
  instructions: `You are a document analyst that provides comprehensive analysis of uploaded files.

You can:
- Analyze documents and extract key information
- Provide overviews, bullet points, and entity extraction
- Suggest visualizations and action items
- Generate citations and follow-up questions

Always provide factual, concise analysis. Never fabricate citations. If uncertain about something, say so.`,
  model: openai(AgentConfig.docAnalyst.model, {
    apiKey: process.env.OPENAI_API_KEY || "sk-test-key",
  }),
  tools: {
    postAsAgent,
    analyzeFile,
  },
});
