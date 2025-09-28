import { on } from "../bus/events";
import { executeWithPolicy } from "../auth/pdp";
import { ChatState } from "../state/chat";
import { ioEmit } from "../ws/emit";
import { AgentFlags, AgentConfig } from "../state/agents";
import { noteUserMessage, shouldTriggerSummary, markSummary, getRollingConfig } from "../observe/rolling_summary";
import { summarizerAgent } from "../mastra/agents";

// Policy-gated executors
const execSumm = executeWithPolicy(
  "Summarize", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true }),
  (args: { k: number }) => ({ windowSize: args.k })
);

const execPost = executeWithPolicy(
  "PostAsAgent", 
  (args: { roomId: string }) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);

// Configuration
const WINDOW_SIZE = Number(process.env.SUMMARIZER_WINDOW || 40);

export function startSummarizerMastra() {
  if (!AgentFlags.summarizer) {
    console.log("SummarizerAgentMastra disabled");
    return;
  }

  const config = getRollingConfig();
  console.log("Starting SummarizerAgentMastra with interval:", config.interval, "cooldown:", config.minMs);

  // Rolling summaries - trigger when message count exceeds threshold
  on("message.created", async (m: any) => {
    if (m.authorType !== "User") return;
    
    // Count user messages and check if we should trigger a summary
    noteUserMessage(m.roomId);
    
    if (shouldTriggerSummary(m.roomId)) {
      console.log(`SummarizerAgentMastra: Triggering rolling summary for room ${m.roomId} (${config.interval} user messages since last summary)`);
      await doSummary(m.roomId, "rolling");
      markSummary(m.roomId);
    }
  });

  // Welcome brief - trigger when user joins room
  on("room.user.joined", async ({ roomId, userId }: { roomId: string; userId: string }) => {
    console.log(`SummarizerAgentMastra: Triggering welcome brief for room ${roomId}, user ${userId}`);
    await doSummary(roomId, "welcome");
  });

  // Thread summaries - optional trigger when thread is created
  on("thread.created", async ({ roomId, threadId }: { roomId: string; threadId: string }) => {
    console.log(`SummarizerAgentMastra: Triggering thread summary for room ${roomId}, thread ${threadId}`);
    await doSummary(roomId, "thread", threadId);
  });
}

async function doSummary(roomId: string, type: "welcome" | "rolling" | "thread", threadId?: string) {
  const start = Date.now();
  const correlationId = `sum-${roomId}-${type}-${start}`;
  
  ioEmit("agent:trace", { 
    ts: start, 
    phase: "requested", 
    action: "Summarize", 
    principal: { type: "Agent", id: "summarizer" }, 
    resource: { type: "Room", id: roomId }, 
    correlationId 
  });

  try {
    // Generate summary using Mastra agent
    const summaryResult = await execSumm(
      { type: "Agent", id: "summarizer", name: "SummarizerAgent", orgId: "org-1" },
      () => summarizerAgent.tools.summarizeWindow.execute({ context: { roomId, k: WINDOW_SIZE } })
    );

    if (!summaryResult || !summaryResult.summary) {
      throw new Error("No summary generated");
    }

    // Use Mastra agent to enhance the summary based on type
    const enhancedSummary = await summarizerAgent.generate({
      messages: [
        {
          role: "user",
          content: `Please enhance this ${type} summary to be more helpful and contextual:\n\n${summaryResult.summary}\n\nType: ${type}${threadId ? `\nThread ID: ${threadId}` : ''}`
        }
      ],
      maxTokens: 1000,
      temperature: 0.3,
    });

    // Create appropriate message based on type
    let messageText = "";
    let icon = "📝";
    
    switch (type) {
      case "welcome":
        icon = "📋";
        messageText = `**Welcome Brief:**\n${enhancedSummary.text || summaryResult.summary}`;
        break;
      case "rolling":
        icon = "📝";
        messageText = `**Rolling Recap:**\n${enhancedSummary.text || summaryResult.summary}`;
        break;
      case "thread":
        icon = "🧵";
        messageText = `**Thread Summary:**\n${enhancedSummary.text || summaryResult.summary}`;
        break;
    }

    // Post the summary as an agent message using Mastra
    await execPost(
      { type: "Agent", id: "summarizer", name: "SummarizerAgent", orgId: "org-1" },
      () => summarizerAgent.tools.postAsAgent.execute({ context: { roomId, text: `${icon} ${messageText}` } })
    );

    // Optional: Save to MongoDB for analytics
    try {
      const { RoomSummaryModel } = await import("../db/models");
      await RoomSummaryModel.create({
        roomId,
        threadId,
        type,
        ts: Date.now(),
        text: enhancedSummary.text || summaryResult.summary,
        generatedBy: "SummarizerAgentMastra"
      });
    } catch (dbError) {
      console.warn("Failed to save summary to database:", dbError);
    }

    ioEmit("agent:trace", { 
      ts: Date.now(), 
      phase: "success", 
      action: "Summarize", 
      principal: { type: "Agent", id: "summarizer" }, 
      resource: { type: "Room", id: roomId }, 
      decision: "Allow", 
      durationMs: Date.now() - start,
      correlationId 
    });

    console.log(`SummarizerAgentMastra: Successfully generated ${type} summary for room ${roomId}`);

  } catch (e: any) {
    ioEmit("agent:trace", { 
      ts: Date.now(), 
      phase: "denied", 
      action: "Summarize", 
      principal: { type: "Agent", id: "summarizer" }, 
      resource: { type: "Room", id: roomId }, 
      decision: "Deny", 
      reason: e?.message,
      durationMs: Date.now() - start,
      correlationId 
    });

    console.error(`SummarizerAgentMastra: Failed to generate ${type} summary for room ${roomId}:`, e);
  }
}

// Manual trigger function for UI
export async function triggerSummaryMastra(roomId: string, type: "welcome" | "rolling" | "thread" = "rolling") {
  if (!AgentFlags.summarizer) {
    throw new Error("SummarizerAgentMastra is disabled");
  }
  
  await doSummary(roomId, type);
  markSummary(roomId);
}
