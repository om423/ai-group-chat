import { MCPClient } from "@mastra/mcp";

// Configure MCPClient to connect to your server(s)
export const mcp = new MCPClient({
  servers: {
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/ompatel/Documents/HackGT",
      ],
    },
    // Add more MCP servers as needed
    // weather: {
    //   url: new URL("http://localhost:3002/api/weather"),
    // },
  },
});
