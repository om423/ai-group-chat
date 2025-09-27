"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createThread, summarizeWindow, uploadFile, analyzeFile, labelMessage } from "@/agentic/actions";
import { setTeacherPresent, resetTraces, resetMessages, fetchRooms, fetchHistory } from "@/lib/api";
import { sendChatMessage } from "@/lib/chat";
import ChatRoom from "@/components/ChatRoom";
import LoginForm from "@/components/LoginForm";

const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

function principalHeaders(role: string) {
  if (role === "Agent") {
    return {
      "x-principal-type": "Agent",
      "x-agent-id": "facilitator",
      "x-agent-name": "FacilitatorAgent",
      "x-org-id": "org-1"
    };
  }
  return {
    "x-principal-type": "User",
    "x-user-id": `u-${role.toLowerCase()}`,
    "x-org-id": "org-1",
    "x-roles": role
  };
}

type Trace = {
  ts: number;
  phase: string;
  action: string;
  principal: any;
  resource: any;
  decision?: string;
  reason?: string;
  durationMs?: number;
};

type ChatMsg = { 
  id: string; 
  roomId: string; 
  authorType: "User" | "Agent"; 
  authorId: string; 
  text: string; 
  ts: number;
  _id?: string;
};

export default function Page() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [k, setK] = useState(50);
  const [asRole, setAsRole] = useState("Student");
  const [log, setLog] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  const [fileId, setFileId] = useState<string | null>(null);
  const [classification, setClassification] = useState("internal");

  const [traces, setTraces] = useState<Trace[]>([]);
  const [agentMsgs, setAgentMsgs] = useState<{ roomId: string; text: string; ts: number }[]>([]);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);

  // socket
  useEffect(() => {
    if (socketRef.current) return;
    const socket = io(AGENT_BASE, { transports: ["websocket"] });
    socketRef.current = socket;

    const addMsg = (m: ChatMsg) => {
      if (seenIdsRef.current.has(m._id || m.id)) return;
      seenIdsRef.current.add(m._id || m.id);
      setChat(prev => [...prev, m]);
    };

    socket.on("chat:message", addMsg);

    socket.on("agent:message", (m: any) => {
      const msg: ChatMsg = {
        id: `a_${m.ts}_${Math.random().toString(36).slice(2)}`,
        roomId: m.roomId,
        authorType: "Agent",
        authorId: "AI Assistant",
        text: m.text,
        ts: m.ts
      };
      addMsg(msg);
    });

    socket.on("agent:message:reset", () => setAgentMsgs([]));
    socket.on("agent:trace", (t: any) => setTraces(prev => [t, ...prev].slice(0, 200)));

    return () => { 
      socket.disconnect(); 
      socketRef.current = null; 
    };
  }, []);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms().then(setRooms).catch(() => {});
  }, []);

  // Load history when room changes
  useEffect(() => {
    if (roomId) {
      fetchHistory(roomId, 50).then((msgs) => {
        setChat(msgs);
        seenIdsRef.current = new Set(msgs.map((m: any) => m._id || m.id));
      }).catch(() => {});
    }
  }, [roomId]);

  async function runCreate() {
    try {
      const result = await createThread({ roomId: roomId || "demo", visibility, as: asRole });
      setLog(l => [`ALLOW createThread → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY createThread → ${e.message}`, ...l]);
    }
  }

  async function runSummarize() {
    try {
      const result = await summarizeWindow({ roomId: roomId || "demo", k, as: asRole });
      setLog(l => [`ALLOW summarizeWindow → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY summarizeWindow → ${e.message}`, ...l]);
    }
  }

  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const id = await uploadFile({ file: f, roomId: roomId || "demo", classification });
      setFileId(id);
      setLog(l => [`UPLOAD ok → fileId=${id}, class=${classification}`, ...l]);
    } catch (e: any) {
      setLog(l => [`UPLOAD fail → ${e.message}`, ...l]);
    }
  }

  async function runAnalyze() {
    if (!fileId) return setLog(l => [`No file uploaded`, ...l]);
    try {
      const result = await analyzeFile({ fileId, roomId: roomId || "demo", as: asRole });
      setLog(l => [`ALLOW analyzeFile → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY analyzeFile → ${e.message}`, ...l]);
    }
  }

  async function runLabelRestricted() {
    try {
      const result = await labelMessage({ roomId: roomId || "demo", classification: "restricted", as: asRole });
      setLog(l => [`ALLOW labelMessage (restricted) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage (restricted) → ${e.message}`, ...l]);
    }
  }

  async function runLabelInternal() {
    try {
      const result = await labelMessage({ roomId: roomId || "demo", classification: "internal", as: asRole });
      setLog(l => [`ALLOW labelMessage (internal) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage (internal) → ${e.message}`, ...l]);
    }
  }

  function logLine(s: string) {
    setLog(l => [s, ...l]);
  }

  async function sendWelcomeBrief() {
    try {
      const res = await fetch(`${AGENT_BASE}/events/user-joined`, {
        method: "POST",
        headers: { "content-type": "application/json", ...principalHeaders(asRole) },
        body: JSON.stringify({ roomId })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
      setLog(l => [`WELCOME ok → posted`, ...l]);
    } catch (e: any) {
      setLog(l => [`WELCOME denied → ${e.message}`, ...l]);
    }
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    try {
      await sendChatMessage(roomId || "r1", text, asRole);
      setInput("");
    } finally {
      sendingRef.current = false;
    }
  }

  const handleLogin = (loginData: { roomId: string; role: string }) => {
    setRoomId(loginData.roomId);
    setAsRole(loginData.role);
  };

  const handleLogout = () => {
    setRoomId(null);
  };

  if (roomId) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">AI Chat Demo</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDemo(!showDemo)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {showDemo ? "Hide" : "Show"} Policy Demo
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
            <aside style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
              <h3>Rooms</h3>
              <ul>
                {rooms.map((r: any) => (
                  <li key={r.roomId}>
                    <button
                      onClick={() => setRoomId(r.roomId)}
                      style={{
                        fontWeight: r.roomId === roomId ? 700 : 400,
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "4px 8px",
                        margin: "2px 0",
                        border: "none",
                        background: r.roomId === roomId ? "#e3f2fd" : "transparent",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {r.name || r.roomId}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section>
              {/* Chat Panel */}
              <div style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat</h3>
                <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid #eee", padding: 8, backgroundColor: "#f9f9f9" }}>
                  {chat.map(m => (
                    <div key={m._id || m.id} style={{ marginBottom: 6 }}>
                      <strong className={m.authorType === "Agent" ? "text-blue-600" : "text-gray-800"}>
                        {m.authorType === "Agent" ? "AI" : m.authorId}
                      </strong>
                      <span style={{ color: "#999", marginLeft: 8 }}>{new Date(m.ts).toLocaleTimeString()}</span>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>{m.text}</div>
                    </div>
                  ))}
                  {chat.length === 0 && (
                    <div className="text-gray-500 italic">No messages yet. Try asking a question!</div>
                  )}
                </div>
                <form onSubmit={onSend} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder='Type here… (try a question or "@ai summarize the last 5 messages")'
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px" }}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </form>
                <small className="text-gray-600 mt-2 block">
                  Tip: use <code className="bg-gray-100 px-1 rounded">@ai</code> or <code className="bg-gray-100 px-1 rounded">/ai</code> to force a response; otherwise the AI decides if it should reply.
                </small>
              </div>

              {/* Policy Demo Section */}
              {showDemo && (
                <div className="space-y-8 mt-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Policy-Gated Actions Demo</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                          <input
                            value={roomId || ""}
                            onChange={e => setRoomId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter room ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                          <select
                            value={visibility}
                            onChange={e => setVisibility(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="public">public</option>
                            <option value="private">private</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">k</label>
                          <input
                            type="number"
                            value={k}
                            onChange={e => setK(parseInt(e.target.value || "50", 10))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">As</label>
                          <select
                            value={asRole}
                            onChange={e => setAsRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option>Teacher</option>
                            <option>Student</option>
                            <option>Analyst</option>
                            <option>Researcher</option>
                            <option>Agent</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4 mb-6">
                      <button
                        onClick={runCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        CreateThread
                      </button>
                      <button
                        onClick={runSummarize}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        SummarizeWindow
                      </button>
                      <button
                        onClick={sendWelcomeBrief}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Send Welcome Brief
                      </button>
                    </div>

                    {/* Realtime Agent Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Realtime Agent Actions</h3>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {traces.map((trace, index) => (
                              <tr key={index} className={trace.decision === "Allow" ? "bg-green-50" : "bg-red-50"}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(trace.ts).toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    trace.phase === "success" ? "bg-green-100 text-green-800" :
                                    trace.phase === "denied" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {trace.phase}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {trace.action}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {trace.principal?.type} {trace.principal?.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {trace.resource?.type} {trace.resource?.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    trace.decision === "Allow" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}>
                                    {trace.decision}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {trace.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    );
  }

  return <LoginForm onLogin={handleLogin} />;
}