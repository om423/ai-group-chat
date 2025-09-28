import { Mastra } from '@mastra/core/mastra';
import { chatWorkflow } from './workflows/chatWorkflow';
import { apiRoutes } from './apiRegistry';
import { facilitatorAgent, summarizerAgent, docAnalystAgent } from './agents';
import { storage } from './memory';

/**
 * Main Mastra configuration for ai-chat
 *
 * This configures your agents, workflows, storage, and API routes.
 * The ai-chat app includes:
 * - Facilitator agent for chat interactions
 * - Summarizer agent for automatic summarization  
 * - Document analyst agent for file analysis
 * - Chat workflow for handling conversations
 * - In-memory storage (can be replaced with database)
 * - API routes for the frontend to communicate with
 */

export const mastra = new Mastra({
  agents: { 
    facilitatorAgent, 
    summarizerAgent, 
    docAnalystAgent 
  },
  workflows: { chatWorkflow },
  storage,
  telemetry: {
    enabled: true,
  },
  server: {
    apiRoutes,
  },
});
