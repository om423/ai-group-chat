"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createThread, summarizeWindow, uploadFile, analyzeFile, labelMessage } from "@/agentic/actions";
import { setTeacherPresent, resetTraces, resetMessages } from "@/lib/api";
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
  principal: { type: string; id: string; roles?: string[]; orgId?: string; name?: string };
  action: string;
  resource: any;
  context?: any;
  phase: "requested" | "pdp_decision" | "success" | "denied" | "error";
  decision?: "Allow" | "Deny";
  reason?: string;
  durationMs?: number;
  correlationId: string;
};

type ChatMsg = { id:string; roomId:string; authorType:"User"|"Agent"; authorId:string; text:string; ts:number };

export default function Page() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public"|"private">("public");
  const [k, setK] = useState(50);
  const [asRole, setAsRole] = useState("Student");
  const [log, setLog] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  const [fileId, setFileId] = useState<string| null>(null);
  const [classification, setClassification] = useState("internal");

  const [traces, setTraces] = useState<Trace[]>([]);
  const [agentMsgs, setAgentMsgs] = useState<{roomId:string;text:string;ts:number}[]>([]);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);

  // socket
  useEffect(() => {
    if (socketRef.current) return;              // ✅ prevent double-connect
    const socket = io(AGENT_BASE, { transports: ["websocket"] });
    socketRef.current = socket;

    const addMsg = (m: ChatMsg) => {
      if (seenIdsRef.current.has(m.id)) return; // ✅ drop dupes
      seenIdsRef.current.add(m.id);
      setChat(prev => [...prev, m]);
    };

    socket.on("chat:message", addMsg);

    // Convert agent:message → ChatMsg for the same list
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
    socket.on("agent:trace", (t:any) => setTraces(prev => [t, ...prev].slice(0, 200)));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

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
      const result = await labelMessage({ messageId: "m1", label: "off-topic", classification: "restricted", as: asRole });
      setLog(l => [`ALLOW labelMessage(restricted) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage(restricted) → ${e.message}`, ...l]);
    }
  }
  async function runLabelInternal() {
    try {
      const result = await labelMessage({ messageId: "m1", label: "off-topic", classification: "internal", as: asRole });
      setLog(l => [`ALLOW labelMessage(internal) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage(internal) → ${e.message}`, ...l]);
    }
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
    } catch (e:any) {
      setLog(l => [`WELCOME denied → ${e.message}`, ...l]);
    }
  }

  // Pitch Mode scenario functions
  function logLine(s: string) { setLog(l => [s, ...l]); }

  async function scenario_studentPublicDeny() {
    setAsRole("Student"); 
    setVisibility("public");
    await runCreate();
  }

  async function scenario_studentPrivateAllow() {
    setAsRole("Student"); 
    setVisibility("private");
    await runCreate();
  }

  async function scenario_teacherPublicAllow() {
    setAsRole("Teacher"); 
    setVisibility("public");
    await runCreate();
  }

  async function scenario_analyzeRestrictedDeny() {
    setAsRole("Student"); 
    setClassification("restricted");
    logLine("Pick a small text file then click AnalyzeFile");
  }

  async function scenario_welcomeBriefAllow() {
    setAsRole("Teacher");
    await sendWelcomeBrief();
  }

  async function scenario_welcomeBriefDenyAsStudent() {
    setAsRole("Student");
    await sendWelcomeBrief();
  }

  async function toggleTeacherPresent(on: boolean) {
    await setTeacherPresent(roomId, on);
    logLine(`Context: teacherPresent=${on}`);
  }

  async function doReset() {
    await resetTraces(); 
    await resetMessages();
    setLog([]); 
    setAgentMsgs([]); 
    setTraces([]);
    logLine("Demo reset.");
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;                  // ✅ prevent double-submit
    try {
      await sendChatMessage(roomId, text, asRole); // ❌ do NOT locally push; rely on socket
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
    return <ChatRoom roomId={roomId} onLogout={handleLogout} />;
  }

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
        {showDemo ? (
          <div className="space-y-8">
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

              {/* Chat Panel */}
              <div style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat</h3>
                <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid #eee", padding: 8, backgroundColor: "#f9f9f9" }}>
                  {chat.map(m => (
                    <div key={m.id} style={{ marginBottom: 6 }}>
                      <strong className={m.authorType === "Agent" ? "text-blue-600" : "text-gray-800"}>
                        {m.authorType === "Agent" ? "AI" : m.authorId}
                      </strong>
                      <span style={{ color:"#999", marginLeft:8 }}>{new Date(m.ts).toLocaleTimeString()}</span>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>{m.text}</div>
                    </div>
                  ))}
                  {chat.length === 0 && (
                    <div className="text-gray-500 italic">No messages yet. Try asking a question!</div>
                  )}
                </div>
                <form onSubmit={onSend} style={{ display:"flex", gap:8, marginTop:8 }}>
                  <input 
                    value={input} 
                    onChange={e=>setInput(e.target.value)} 
                    placeholder='Type here… (try a question or "@ai summarize the last 5 messages")' 
                    style={{ flex:1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px" }}
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

              {/* Pitch Mode Section */}
              <div style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}>
                <button 
                  onClick={() => setShowDemo(v => !v)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-4"
                >
                  {showDemo ? "Hide" : "Show"} Policy Demo
                </button>
                {showDemo && (
                  <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button 
                        onClick={scenario_studentPublicDeny}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Student public → DENY
                      </button>
                      <button 
                        onClick={scenario_studentPrivateAllow}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Student private → ALLOW
                      </button>
                      <button 
                        onClick={scenario_teacherPublicAllow}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Teacher public → ALLOW
                      </button>
                      <button 
                        onClick={scenario_analyzeRestrictedDeny}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Analyze restricted (Student) → DENY
                      </button>
                      <button 
                        onClick={scenario_welcomeBriefAllow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Welcome Brief (Teacher) → ALLOW
                      </button>
                      <button 
                        onClick={scenario_welcomeBriefDenyAsStudent}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Welcome Brief (Student) → DENY
                      </button>
                    </div>

                    <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
                      <span className="text-sm font-medium text-gray-700">teacherPresent</span>
                      <button 
                        onClick={() => toggleTeacherPresent(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition-colors"
                      >
                        ON
                      </button>
                      <button 
                        onClick={() => toggleTeacherPresent(false)}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors"
                      >
                        OFF
                      </button>
                      <button 
                        onClick={doReset} 
                        style={{ marginLeft: "auto" }}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-3 rounded transition-colors"
                      >
                        Reset Traces & Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* File Intelligence Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">File Intelligence</h3>
                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Classification</label>
                    <select 
                      value={classification} 
                      onChange={e => setClassification(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="public">public</option>
                      <option value="internal">internal</option>
                      <option value="restricted">restricted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                    <input 
                      type="file" 
                      onChange={onUploadChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <button 
                      onClick={runAnalyze} 
                      disabled={!fileId}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      AnalyzeFile
                    </button>
                  </div>
                </div>
              </div>

              {/* Moderation Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={runLabelRestricted}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    LabelMessage (restricted)
                  </button>
                  <button 
                    onClick={runLabelInternal}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    LabelMessage (internal)
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {log.map((line, idx) => (
                      <li key={idx} className="font-mono text-sm">
                        <span className={line.startsWith('ALLOW') ? 'text-green-600' : 'text-red-600'}>
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Realtime trace panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Realtime Agent Actions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Phase</th>
                        <th className="text-left p-2">Action</th>
                        <th className="text-left p-2">Principal</th>
                        <th className="text-left p-2">Decision</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-left p-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traces.map((t, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="p-2">{new Date(t.ts).toLocaleTimeString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              t.phase === 'requested' ? 'bg-blue-100 text-blue-800' :
                              t.phase === 'success' ? 'bg-green-100 text-green-800' :
                              t.phase === 'denied' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {t.phase}
                            </span>
                          </td>
                          <td className="p-2">{t.action}</td>
                          <td className="p-2">{`${t.principal.type}:${t.principal.id}${t.principal.roles ? " ("+t.principal.roles.join(",")+")" : ""}`}</td>
                          <td className="p-2">
                            {t.decision && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                t.decision === "Deny" ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {t.decision}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-gray-600">{t.reason || ""}</td>
                          <td className="p-2">{t.durationMs ? `${t.durationMs}ms` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent Messages Panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Messages</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {agentMsgs.map((m, i) => (
                      <li key={i} className="font-mono text-sm" style={{ whiteSpace: "pre-wrap" }}>
                        [{new Date(m.ts).toLocaleTimeString()}] {m.text}
                      </li>
                    ))}
                    {agentMsgs.length === 0 && (
                      <li className="text-gray-500 italic">No agent messages yet. Try "Send Welcome Brief"!</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}