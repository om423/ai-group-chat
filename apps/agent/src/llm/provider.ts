import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY || "sk-test-key";
  return new OpenAI({ apiKey });
}
