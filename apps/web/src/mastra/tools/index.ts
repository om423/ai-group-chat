import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherInfo = createTool({
  id: "Get Weather Information",
  inputSchema: z.object({
    city: z.string(),
  }),
  description: `Fetches the current weather information for a given city`,
  execute: async ({ context: { city } }) => {
    // Tool logic here (e.g., API call)
    console.log("Using tool to fetch weather information for", city);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      temperature: Math.floor(Math.random() * 30) + 10, 
      conditions: ["Sunny", "Cloudy", "Rainy", "Snowy"][Math.floor(Math.random() * 4)],
      city: city
    };
  },
});

export const fileSearch = createTool({
  id: "Search Files",
  inputSchema: z.object({
    query: z.string(),
    path: z.string().optional(),
  }),
  description: `Searches for files in the specified directory`,
  execute: async ({ context: { query, path = "/Users/ompatel/Documents/HackGT" } }) => {
    console.log("Searching for files with query:", query, "in path:", path);
    
    // Simulate file search
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      results: [
        { name: `${query}_example.txt`, path: `${path}/examples/`, size: "1.2KB" },
        { name: `${query}_config.json`, path: `${path}/config/`, size: "0.8KB" },
        { name: `${query}_data.csv`, path: `${path}/data/`, size: "5.1KB" },
      ],
      total: 3
    };
  },
});

export const codeAnalysis = createTool({
  id: "Analyze Code",
  inputSchema: z.object({
    code: z.string(),
    language: z.string().optional(),
  }),
  description: `Analyzes code for potential issues, performance, and best practices`,
  execute: async ({ context: { code, language = "javascript" } }) => {
    console.log("Analyzing code in language:", language);
    
    // Simulate code analysis
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      issues: [
        { type: "warning", message: "Consider using const instead of let", line: 5 },
        { type: "info", message: "Function could be optimized", line: 12 },
      ],
      metrics: {
        complexity: Math.floor(Math.random() * 10) + 1,
        lines: code.split('\n').length,
        functions: (code.match(/function/g) || []).length,
      },
      suggestions: [
        "Consider adding error handling",
        "Use more descriptive variable names",
        "Add JSDoc comments for better documentation"
      ]
    };
  },
});
