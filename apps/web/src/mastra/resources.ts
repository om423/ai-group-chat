import { mcp } from "./mcp";

// Get resources from all connected MCP servers
export const getMCPResources = async () => {
  try {
    const resources = await mcp.getResources();
    return resources;
  } catch (error) {
    console.error("Error getting MCP resources:", error);
    return {};
  }
};

// Access resources from a specific server
export const getFilesystemResources = async () => {
  try {
    const resources = await mcp.getResources();
    if (resources.filesystem) {
      return resources.filesystem.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error getting filesystem resources:", error);
    return [];
  }
};

// Example usage
export const listAvailableResources = async () => {
  const resources = await getMCPResources();
  console.log("Available MCP Resources:");
  
  Object.entries(resources).forEach(([serverName, serverResources]) => {
    console.log(`\n${serverName} server:`);
    serverResources.forEach(resource => {
      console.log(`  - ${resource.name}: ${resource.description}`);
      console.log(`    URI: ${resource.uri}`);
      console.log(`    MIME Type: ${resource.mimeType}`);
    });
  });
  
  return resources;
};

