const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

export async function setTeacherPresent(roomId: string, on: boolean) {
  const res = await fetch(`${AGENT_BASE}/rooms/${roomId}/context`, {
    method: "POST", 
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ teacherPresent: on })
  });
  const data = await res.json(); 
  if (!data.ok) throw new Error("ctx update failed"); 
  return data.room;
}

export async function resetTraces() {
  const r = await fetch(`${AGENT_BASE}/traces/reset`, { method: "POST" });
  return r.ok;
}

export async function resetMessages() {
  const r = await fetch(`${AGENT_BASE}/messages/reset`, { method: "POST" });
  return r.ok;
}

