const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

export async function listThreads(roomId: string) {
  const r = await fetch(`${AGENT_BASE}/rooms/${roomId}/threads`);
  const j = await r.json(); if (!j.ok) throw new Error("threads"); return j.threads;
}

export type ThreadMetadata = {
  name?: string;
  originMessageId?: string;
  originAuthorId?: string;
  originAuthorType?: string;
  originSnippet?: string;
};

export async function createThread(roomId: string, visibility: "public"|"private", asRole: string, metadata: ThreadMetadata = {}) {
  // Use the tool endpoint to keep policy hooks (headers matter)
  const res = await fetch(`${AGENT_BASE}/tools/create-thread`, {
    method: "POST",
    headers: {
      "content-type":"application/json",
      ...(asRole === "Agent"
        ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
        : { "x-principal-type":"User","x-user-id": `u-${asRole.toLowerCase()}`, "x-roles": asRole, "x-org-id":"org-1" })
    },
    body: JSON.stringify({ roomId, visibility, ...metadata })
  });
  const j = await res.json(); if (!j.ok) throw new Error(j.error || "create-thread");
  return j.result; // { threadId, ... }
}

export async function fetchThreadHistory(threadId: string, limit = 50) {
  const r = await fetch(`${AGENT_BASE}/threads/${threadId}/history?limit=${limit}`);
  const j = await r.json(); if (!j.ok) throw new Error("thread-history"); return j.messages;
}

export async function sendThreadMessage(threadId: string, text: string, asRole: string) {
  const res = await fetch(`${AGENT_BASE}/threads/${threadId}/send`, {
    method: "POST",
    headers: {
      "content-type":"application/json",
      ...(asRole === "Agent"
        ? { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" }
        : { "x-principal-type":"User","x-user-id": `u-${asRole.toLowerCase()}`, "x-roles": asRole, "x-org-id":"org-1" })
    },
    body: JSON.stringify({ text })
  });
  const j = await res.json(); if (!j.ok) throw new Error(j.error || "thread-send");
  return j.message;
}
