import { on } from "../bus/events";
import { AgentFlags, AgentConfig } from "../state/agents";
import { FileStore } from "../services/files";
import { extractFile, StoredFile } from "../extractors";
import { executeWithPolicy } from "../auth/pdp";
import { ioEmit } from "../ws/emit";
import { DocAnalysisModel } from "../db/models";
import { docAnalystAgent } from "../mastra/agents";

// DocAnalysis type definition
export type DocAnalysis = {
  fileId: string;
  roomId: string;
  title?: string;
  source: { mime: string; bytes?: number; pageCount?: number; slideCount?: number };
  overview: string;                     // 2–3 sentences
  bullets: string[];                    // 3–7 bullets
  entities?: { people?: string[]; orgs?: string[]; tech?: string[]; topics?: string[] };
  citations?: Array<{ kind: "page" | "slide" | "line" | "section"; ref: string; snippet?: string }>;
  suggestedVisuals?: string[];          // "timeline w/ milestones", "bar chart of …", etc.
  slidesOutline?: string[];             // 4–6 items
  actions?: string[];                   // "follow up with X", "compare Y vs Z"
  risks?: string[];                     // optional
  qaSuggestions?: string[];             // good prompts users can ask next
};

const execPost = executeWithPolicy(
  "PostAsAgent", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);

export function startDocAnalystMastra() {
  on("file.uploaded", async ({ fileId, roomId }: { fileId: string; roomId: string }) => {
    if (!AgentFlags.docAnalyst) return;

    const sf = FileStore.get(fileId);
    if (!sf) {
      console.warn(`DocAnalystMastra: File ${fileId} not found in FileStore`);
      return;
    }

    const start = Date.now();
    ioEmit("agent:trace", { 
      ts: start, 
      phase: "requested", 
      action: "DocAnalyze", 
      principal: { type: "Agent", id: "doc-analyst" }, 
      resource: { type: "File", id: fileId, roomId }, 
      correlationId: fileId 
    });

    try {
      // Extract content from file
      const extract = await extractFile(sf);
      const clipped = extract.text.slice(0, 10000); // Limit to 10k chars

      if (!clipped.trim()) {
        throw new Error("No text content extracted from file");
      }

      // Use Mastra agent to analyze the document
      const analysis = await docAnalystAgent.generate({
        messages: [
          {
            role: "user",
            content: buildDocPrompt(sf.mime, extract, clipped)
          }
        ],
        maxTokens: 2000,
        temperature: 0.2,
      });

      // Parse the analysis response
      const analysisData = safeParseJSON(analysis.text);
      const normalizedAnalysis = normalizeAnalysis(fileId, roomId, sf, extract, analysisData);

      // Persist analysis to MongoDB
      await DocAnalysisModel.create({
        fileId,
        roomId,
        analysis: normalizedAnalysis
      });

      // Compose a compact agent post
      const text = makeAgentPost(normalizedAnalysis);
      await execPost(
        { type: "Agent", id: "doc-analyst", name: "DocAnalystAgent", orgId: "org-1" },
        () => docAnalystAgent.tools.postAsAgent.execute({ context: { roomId, text } })
      );

      ioEmit("agent:trace", { 
        ts: Date.now(), 
        phase: "success", 
        action: "DocAnalyze", 
        principal: { type: "Agent", id: "doc-analyst" }, 
        resource: { type: "File", id: fileId, roomId }, 
        decision: "Allow", 
        durationMs: Date.now() - start, 
        correlationId: fileId 
      });

      console.log(`DocAnalystMastra: Successfully analyzed ${sf.filename} (${fileId})`);
      
    } catch (e: any) {
      ioEmit("agent:trace", { 
        ts: Date.now(), 
        phase: "denied", 
        action: "DocAnalyze", 
        principal: { type: "Agent", id: "doc-analyst" }, 
        resource: { type: "File", id: fileId, roomId }, 
        decision: "Deny", 
        reason: e?.message, 
        durationMs: Date.now() - start, 
        correlationId: fileId 
      });

      console.error(`DocAnalystMastra: Failed to analyze ${sf.filename} (${fileId}):`, e);
      
      // Post a failure message
      try {
        await execPost(
          { type: "Agent", id: "doc-analyst", name: "DocAnalystAgent", orgId: "org-1" },
          () => docAnalystAgent.tools.postAsAgent.execute({ context: { roomId, text: `❌ Failed to analyze ${sf.filename}: ${e.message}` } })
        );
      } catch (postError) {
        console.error("DocAnalystMastra: Failed to post error message:", postError);
      }
    }
  });
}

// Helper functions
function buildDocPrompt(mime: string, extract: any, clipped: string): string {
  const meta = extract.meta || {};
  const pageCount = meta.pages || meta.slides || 1;
  
  return `You are DocAnalystAgent. Read the provided EXTRACTED TEXT and produce a factual, concise analysis.
Return short, high-signal results. Cite page/slide/line numbers if available.
Never fabricate citations. If uncertain, say "uncertain".

FILE META:
- mime: ${mime}
- pages/slides: ${pageCount}
- size: ${meta.size || 'unknown'} bytes

EXTRACT (truncated to ~10k chars):
${clipped}

TASK:
1) 2–3 sentence overview
2) 3–7 bullets of key points
3) entities: people/orgs/tech/topics if any
4) citations: list the most relevant (page/slide/line IDs with short snippet)
5) suggested visuals (3)
6) slides outline (4–6 bullet titles)
7) actions (3)
8) risks (0–3, optional)
9) 3 follow-up Qs users can ask

Return JSON only matching this TS type:

type Out = {
  overview: string;
  bullets: string[];
  entities?: { people?: string[]; orgs?: string[]; tech?: string[]; topics?: string[] };
  citations?: Array<{ kind: "page"|"slide"|"line"|"section"; ref: string; snippet?: string }>;
  suggestedVisuals?: string[];
  slidesOutline?: string[];
  actions?: string[];
  risks?: string[];
  qaSuggestions?: string[];
};

No extra commentary. JSON only.`;
}

function safeParseJSON(s?: string): any {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

function normalizeAnalysis(fileId: string, roomId: string, sf: StoredFile, extract: any, json: any): DocAnalysis {
  const meta = extract.meta || {};
  
  return {
    fileId,
    roomId,
    title: sf.filename,
    source: {
      mime: sf.mime,
      bytes: meta.size,
      pageCount: meta.pages,
      slideCount: meta.slides
    },
    overview: json.overview || "Document analysis completed.",
    bullets: json.bullets || [],
    entities: json.entities || {},
    citations: json.citations || [],
    suggestedVisuals: json.suggestedVisuals || [],
    slidesOutline: json.slidesOutline || [],
    actions: json.actions || [],
    risks: json.risks || [],
    qaSuggestions: json.qaSuggestions || []
  };
}

function makeAgentPost(a: DocAnalysis): string {
  const bullets = (a.bullets || []).slice(0, 4).map(b => `• ${b}`).join("\n");
  const cite = (a.citations?.slice(0, 3) || []).map(c => `${c.kind} ${c.ref}`).join(", ");
  const visuals = (a.suggestedVisuals || []).slice(0, 2).join("; ");
  const actions = (a.actions || []).slice(0, 2).join("; ");
  
  return `🗂️ **Analysis of ${sfName(a)}**

${a.overview}

${bullets}

**Citations:** ${cite || "—"}
**Visuals:** ${visuals || "—"}
**Actions:** ${actions || "—"}

*(Use "AnalyzeFile" spell for full details.)`;
}

function sfName(a: DocAnalysis): string {
  return a.title || a.fileId;
}
