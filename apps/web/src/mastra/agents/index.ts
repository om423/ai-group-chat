import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { weatherInfo, fileSearch, codeAnalysis } from "../tools";
import { mcp } from "../mcp";

// Create a general helper agent with static tools
export const generalHelper = new Agent({
  name: "General Helper",
  description: "A helpful assistant that can provide weather information, search files, and analyze code",
  instructions: `You are a helpful assistant that can:
- Provide current weather information for any city
- Search for files in the project directory
- Analyze code for issues and provide suggestions

Always be helpful and provide detailed responses. When using tools, explain what you're doing and what the results mean.`,
  model: openai("gpt-4o-mini"),
  tools: {
    weatherInfo,
    fileSearch,
    codeAnalysis,
  },
});

// Create an agent with MCP tools (dynamic)
export const mcpAgent = new Agent({
  name: "MCP Agent",
  description: "An agent that can use tools from connected MCP servers",
  instructions: `You are an agent that can access tools from MCP servers. You can:
- Access filesystem operations through MCP
- Use any tools provided by connected MCP servers
- Help users with file operations and system tasks

Always explain what tools you're using and provide clear feedback about the results.`,
  model: openai("gpt-4o-mini"),
  tools: async () => {
    // Tools resolve when needed, not during initialization
    return await mcp.getTools();
  },
});

// Create a specialized coding assistant
export const codingAssistant = new Agent({
  name: "Coding Assistant",
  description: "A specialized assistant for code analysis and development tasks",
  instructions: `You are a coding assistant that helps with:
- Code analysis and review
- Performance optimization suggestions
- Best practices recommendations
- Debugging assistance

When analyzing code, provide specific, actionable feedback. Focus on readability, performance, and maintainability.`,
  model: openai("gpt-4o-mini"),
  tools: {
    codeAnalysis,
    fileSearch,
  },
});

// Create a weather specialist
export const weatherSpecialist = new Agent({
  name: "Weather Specialist",
  description: "A specialized assistant for weather information and forecasts",
  instructions: `You are a weather specialist that provides:
- Current weather conditions
- Weather forecasts
- Weather-related advice and recommendations

Always provide accurate, helpful weather information and explain any technical terms in simple language.`,
  model: openai("gpt-4o-mini"),
  tools: {
    weatherInfo,
  },
});
