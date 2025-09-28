import { Agent } from "@mastra/core/agent";
import { MCPServer } from "@mastra/mcp";
import { openai } from "@ai-sdk/openai";
import { weatherInfo, fileSearch, codeAnalysis } from "../tools";
import { generalHelper, codingAssistant, weatherSpecialist } from "../agents";

// Create MCP server that exposes agents as tools
export const mcpServer = new MCPServer({
  name: "AI Chat MCP Server",
  version: "1.0.0",
  description: "MCP server for AI Chat application with various tools and agents",
  tools: {
    weatherInfo,
    fileSearch,
    codeAnalysis,
  },
  agents: { 
    generalHelper,     // Exposes 'ask_generalHelper' tool
    codingAssistant,   // Exposes 'ask_codingAssistant' tool
    weatherSpecialist, // Exposes 'ask_weatherSpecialist' tool
  },
});

// Self-referencing agent that can use tools from the MCP server
export const selfReferencingAgent = new Agent({
  name: "Self-Referencing Agent",
  description: "An agent that can use tools from the local MCP server",
  instructions: `You are an agent that can use tools from the local MCP server. You can:
- Ask other agents for help with specific tasks
- Use file operations and weather tools
- Coordinate between different specialized agents

When you need specialized help, delegate to the appropriate agent using the ask_* tools.`,
  model: openai("gpt-4o-mini", {
    apiKey: process.env.OPENAI_API_KEY || "sk-test-key",
  }),
  tools: async () => {
    // Tools resolve when needed, not during initialization
    const mcpClient = new (await import("@mastra/mcp")).MCPClient({
      servers: {
        localServer: {
          url: new URL("http://localhost:3001/api/mcp"),
        },
      },
    });
    return await mcpClient.getTools();
  },
});

