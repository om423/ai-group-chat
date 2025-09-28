import { cedar } from "../client";

/**
 * A "spell" is a named, typed action the agent (or user) can trigger.
 * Each spell calls your agent REST tool and returns a typed result.
 */
export const spells = {
  createThread: {
    name: "Create Thread",
    run: async (args: { roomId: string; visibility: "public"|"private"; as: string }) => {
      const res = await fetch(`${cedar.config.transport.baseUrl}/tools/create-thread`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(args.as === "Agent"
            ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
            : { "x-principal-type":"User","x-user-id": `u-${args.as.toLowerCase()}`, "x-roles": args.as, "x-org-id":"org-1" })
        },
        body: JSON.stringify({ roomId: args.roomId, visibility: args.visibility })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "create-thread failed");
      return data.result;
    }
  },

  summarizeWindow: {
    name: "Summarize Window",
    run: async (args: { roomId: string; k: number; as: string }) => {
      const res = await fetch(`${cedar.config.transport.baseUrl}/tools/summarize-window`, {
        method: "POST",
        headers: {
          "content-type":"application/json",
          ...(args.as === "Agent"
            ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
            : { "x-principal-type":"User","x-user-id": `u-${args.as.toLowerCase()}`, "x-roles": args.as, "x-org-id":"org-1" })
        },
        body: JSON.stringify({ roomId: args.roomId, k: args.k })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "summarize failed");
      return data.result;
    }
  },

  analyzeFile: {
    name: "Analyze File",
    run: async (args: { fileId: string; roomId: string; as: string }) => {
      const res = await fetch(`${cedar.config.transport.baseUrl}/tools/analyze-file`, {
        method: "POST",
        headers: {
          "content-type":"application/json",
          ...(args.as === "Agent"
            ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
            : { "x-principal-type":"User","x-user-id": `u-${args.as.toLowerCase()}`, "x-roles": args.as, "x-org-id":"org-1" })
        },
        body: JSON.stringify({ fileId: args.fileId, roomId: args.roomId })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "analyze-file failed");
      return data.result;
    }
  },

  labelMessage: {
    name: "Label Message",
    run: async (args: { messageId: string; label: string; classification: "public"|"internal"|"restricted"; as: string }) => {
      const res = await fetch(`${cedar.config.transport.baseUrl}/tools/label-message`, {
        method: "POST",
        headers: {
          "content-type":"application/json",
          ...(args.as === "Agent"
            ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
            : { "x-principal-type":"User","x-user-id": `u-${args.as.toLowerCase()}`, "x-roles": args.as, "x-org-id":"org-1" })
        },
        body: JSON.stringify(args)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "label-message failed");
      return data.result;
    }
  },

  postAsAgent: {
    name: "Post As Agent",
    run: async (args: { roomId: string; text: string }) => {
      // For demo, always agent principal
      const res = await fetch(`${cedar.config.transport.baseUrl}/events/user-joined`, {
        method: "POST",
        headers: { "content-type":"application/json", "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" },
        body: JSON.stringify({ roomId: args.roomId }) // uses summarize + post in your agent
      });
      return await res.json();
    }
  }
};
