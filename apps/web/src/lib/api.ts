const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

export async function fetchRooms() {
  const r = await fetch(`${AGENT_BASE}/rooms`); 
  const j = await r.json(); 
  if (!j.ok) throw new Error("rooms"); 
  return j.rooms;
}

export async function fetchHistory(roomId: string, limit = 50) {
  const r = await fetch(`${AGENT_BASE}/chat/${roomId}/history?limit=${limit}`); 
  const j = await r.json(); 
  if (!j.ok) throw new Error("history"); 
  return j.messages;
}

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

