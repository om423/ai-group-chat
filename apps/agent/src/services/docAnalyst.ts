import fs from "node:fs";
import { getOpenAI } from "../llm/provider";

export class DocAnalystService {
  async analyzeLocalFile(path: string) {
    const openai = getOpenAI();
    const text = fs.readFileSync(path, "utf8").slice(0, 8000); // naive; fine for demo
    const prompt = `You're an analyst. Read the following doc text and return:
1) Short overview (2-3 sentences)
2) 3-5 key bullets
3) Slides outline (4 items)

--- DOC START ---
${text}
--- DOC END ---`;
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    const out = resp.choices[0]?.message?.content ?? "No analysis.";
    // Keep previous shape so UI doesn't change:
    return {
      title: "Auto Notes",
      sections: [
        { heading: "Overview", bullets: [out] }
      ],
      slidesOutline: ["Slide 1", "Slide 2", "Slide 3", "Slide 4"]
    };
  }
}
