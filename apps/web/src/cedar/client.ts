const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

export const cedar = {
  config: {
    transport: {
      baseUrl: AGENT_BASE
    }
  }
};
