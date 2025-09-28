// Export all MCP functionality
export { mcp } from "./mcp";
export { mcpServer, selfReferencingAgent } from "./mcpServer";
export { generalHelper, mcpAgent, codingAssistant, weatherSpecialist } from "./agents";
export { weatherInfo, fileSearch, codeAnalysis } from "./tools";
export { getMCPResources, getFilesystemResources, listAvailableResources } from "./resources";
export { getMCPPrompts, getWeatherPrompts, getPromptMessages, listAvailablePrompts } from "./prompts";

// Re-export MCP types for convenience
export type { MCPClient, MCPServer } from "@mastra/mcp";
export type { Agent } from "@mastra/core/agent";
export type { Tool } from "@mastra/core/tools";

