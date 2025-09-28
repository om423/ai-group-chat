// Agent flags and configuration
export const AgentFlags = {
  facilitator: process.env.FACILITATOR_ENABLED !== "false", // Default enabled
  moderator: process.env.MODERATOR_ENABLED === "true", // Default disabled
  analyst: process.env.ANALYST_ENABLED === "true", // Default disabled
  docAnalyst: process.env.DOC_ANALYST_ENABLED !== "false", // Default enabled
  summarizer: process.env.SUMMARIZER_ENABLED !== "false", // Default enabled
};

// Agent configuration
export const AgentConfig = {
  facilitator: {
    cooldownMs: Number(process.env.FACILITATOR_COOLDOWN_MS || 20000),
    recapThreshold: Number(process.env.FACILITATOR_RECAP_THRESHOLD || 25),
    model: process.env.FACILITATOR_MODEL || "gpt-4o-mini",
    classifierModel: process.env.FACILITATOR_CLASSIFIER_MODEL || "gpt-4o-mini",
    maxContext: Number(process.env.FACILITATOR_MAX_CONTEXT || 10),
    maxTokens: Number(process.env.FACILITATOR_MAX_TOKENS || 500),
  },
  moderator: {
    cooldownMs: Number(process.env.MODERATOR_COOLDOWN_MS || 30000),
    model: process.env.MODERATOR_MODEL || "gpt-4o-mini",
  },
  analyst: {
    cooldownMs: Number(process.env.ANALYST_COOLDOWN_MS || 60000),
    model: process.env.ANALYST_MODEL || "gpt-4o-mini",
  },
  docAnalyst: {
    maxChars: Number(process.env.DOC_MAX_CHARS || 10000),
    model: process.env.DOC_MODEL || "gpt-4o-mini",
    postTo: process.env.DOC_POST_TO || "room",
    includeVisuals: process.env.DOC_INCLUDE_VISUALS !== "false",
    includeCitations: process.env.DOC_INCLUDE_CITATIONS !== "false",
  },
  summarizer: {
    threshold: Number(process.env.SUMMARIZER_THRESHOLD || 25),
    cooldownMs: Number(process.env.SUMMARIZER_COOLDOWN_MS || 60000),
    window: Number(process.env.SUMMARIZER_WINDOW || 40),
    model: process.env.SUMMARIZER_MODEL || "gpt-4o-mini",
  },
};
