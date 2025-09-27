const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

function principalHeaders(role: string) {
  if (role === "Agent") {
    return { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" };
  }
  return {
    "x-principal-type":"User",
    "x-user-id": `u-${role.toLowerCase()}`,
    "x-org-id":"org-1",
    "x-roles": role
  };
}

export async function sendChatMessage(roomId: string, text: string, asRole: string) {
  const res = await fetch(`${AGENT_BASE}/chat/send`, {
    method: "POST",
    headers: { "content-type": "application/json", ...principalHeaders(asRole) },
    body: JSON.stringify({ roomId, text })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "send failed");
  return data.message;
}

