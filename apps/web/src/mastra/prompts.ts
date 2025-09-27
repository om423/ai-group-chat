import { mcp } from "./mcp";

// Get prompts from all connected MCP servers
export const getMCPPrompts = async () => {
  try {
    const prompts = await mcp.prompts.list();
    return prompts;
  } catch (error) {
    console.error("Error getting MCP prompts:", error);
    return {};
  }
};

// Access prompts from a specific server
export const getWeatherPrompts = async () => {
  try {
    const prompts = await mcp.prompts.list();
    if (prompts.weather) {
      return prompts.weather.map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        version: prompt.version,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error getting weather prompts:", error);
    return [];
  }
};

// Retrieve a specific prompt and its messages
export const getPromptMessages = async (serverName: string, promptName: string) => {
  try {
    const { prompt, messages } = await mcp.prompts.get({ 
      serverName, 
      name: promptName 
    });
    return { prompt, messages };
  } catch (error) {
    console.error(`Error getting prompt ${promptName} from ${serverName}:`, error);
    return { prompt: null, messages: [] };
  }
};

// Example usage
export const listAvailablePrompts = async () => {
  const prompts = await getMCPPrompts();
  console.log("Available MCP Prompts:");
  
  Object.entries(prompts).forEach(([serverName, serverPrompts]) => {
    console.log(`\n${serverName} server:`);
    serverPrompts.forEach(prompt => {
      console.log(`  - ${prompt.name}: ${prompt.description}`);
      if (prompt.version) {
        console.log(`    Version: ${prompt.version}`);
      }
    });
  });
  
  return prompts;
};

// Create a custom prompt for the AI Chat application
export const createCustomPrompt = async (name: string, description: string, messages: any[]) => {
  // This would typically be done through an MCP server that supports prompt creation
  // For now, we'll return a mock implementation
  return {
    name,
    description,
    messages,
    version: "1.0.0",
  };
};
