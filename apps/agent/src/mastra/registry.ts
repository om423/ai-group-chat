import { facilitatorAgent, summarizerAgent, docAnalystAgent } from "./agents";

// Mastra Agent Registry
// All agents are now properly configured with Mastra
export const agents = {
  facilitator: facilitatorAgent,
  summarizer: summarizerAgent,
  docAnalyst: docAnalystAgent,
};

// Export individual agents for direct access
export { facilitatorAgent, summarizerAgent, docAnalystAgent };
