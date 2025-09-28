const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

// Helper to send principal headers for demo (mock session)
function principalHeaders(role: "Teacher" | "Student" | "Analyst" | "Researcher" | "AgentTeacher" | "Agent") {
  // For AgentTeacher you could still use a User principal w/ Teacher role.
  if (role === "Agent" || role === "AgentTeacher") {
    return {
      "x-principal-type": "Agent",
      "x-agent-id": "facilitator",
      "x-agent-name": "FacilitatorAgent",
      "x-org-id": "org-1"
    };
  }
  const roles = role; // single role for now
  return {
    "x-principal-type": "User",
    "x-user-id": `u-${role.toLowerCase()}`,
    "x-org-id": "org-1",
    "x-roles": roles
  };
}

export const createThread = async ({ roomId, visibility, as, metadata }: { roomId: string; visibility: "public" | "private"; as: string; metadata?: Partial<{ name: string; originMessageId: string; originAuthorId: string; originAuthorType: "User" | "Agent"; originSnippet: string; }> }) => {
  const res = await fetch(`${AGENT_BASE}/tools/create-thread`, {
    method: "POST",
    headers: { "content-type": "application/json", ...principalHeaders(as as any) },
    body: JSON.stringify({ roomId, visibility, ...(metadata ?? {}) })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
  return data.result;
};

export const summarizeWindow = async ({ roomId, k, as }: { roomId: string; k: number; as: string }) => {
  const res = await fetch(`${AGENT_BASE}/tools/summarize-window`, {
    method: "POST",
    headers: { "content-type": "application/json", ...principalHeaders(as as any) },
    body: JSON.stringify({ roomId, k })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
  return data.result;
};

export const uploadFile = async ({ file, roomId, classification }: { file: File; roomId: string; classification: string }) => {
  const form = new FormData();
  form.append("file", file);
  form.append("roomId", roomId);
  form.append("orgId", "org-1");
  form.append("classification", classification);
  const res = await fetch(`${AGENT_BASE}/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "upload failed");
  return data.fileId as string;
};

export const analyzeFile = async ({ fileId, roomId, as }: { fileId: string; roomId: string; as: string }) => {
  const res = await fetch(`${AGENT_BASE}/tools/analyze-file`, {
    method: "POST",
    headers: { "content-type": "application/json", ...principalHeaders(as) },
    body: JSON.stringify({ fileId, roomId })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
  return data.result;
};

export const labelMessage = async ({ messageId, label, classification, as }: { messageId: string; label: string; classification: string; as: string }) => {
  const res = await fetch(`${AGENT_BASE}/tools/label-message`, {
    method: "POST",
    headers: { "content-type": "application/json", ...principalHeaders(as) },
    body: JSON.stringify({ messageId, label, classification })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
  return data.result;
};
