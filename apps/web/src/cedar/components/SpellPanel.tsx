"use client";
import { useState } from "react";
import { useSpells } from "../hooks/useSpells";

export function SpellPanel({ roomId, asRole }: { roomId: string; asRole: string }) {
  const spells = useSpells();
  const [k, setK] = useState(30);
  const [visibility, setVisibility] = useState<"public"|"private">("public");
  const [messageId, setMessageId] = useState("m1");
  const [label, setLabel] = useState("action-item");
  const [classification, setClassification] = useState<"public"|"internal"|"restricted">("internal");
  const [fileId, setFileId] = useState<string>("");

  async function run(name: keyof typeof spells) {
    try {
      switch (name) {
        case "createThread":
          await spells.createThread.run({ roomId, visibility, as: asRole }); break;
        case "summarizeWindow":
          await spells.summarizeWindow.run({ roomId, k, as: asRole }); break;
        case "labelMessage":
          await spells.labelMessage.run({ messageId, label, classification, as: asRole }); break;
        case "analyzeFile":
          if (!fileId) throw new Error("Upload a file first to get fileId");
          await spells.analyzeFile.run({ fileId, roomId, as: asRole }); break;
        case "postAsAgent":
          await spells.postAsAgent.run({ roomId, text: "Hello from Agent" }); break;
      }
      alert(`Spell ${name} OK`);
    } catch (e:any) {
      alert(`Spell ${name} failed: ${e.message}`);
    }
  }

  return (
    <div style={{ display:"grid", gap:10 }}>
      <h3>Cedar Spells</h3>
      <div style={{ display:"grid", gap:8 }}>
        <div>
          <b>Create Thread</b> — visibility:
          <select value={visibility} onChange={e=>setVisibility(e.target.value as any)}>
            <option value="public">public</option>
            <option value="private">private</option>
          </select>
          <button onClick={()=>run("createThread")}>Run</button>
        </div>

        <div>
          <b>Summarize Window</b> — k:
          <input type="number" value={k} onChange={e=>setK(parseInt(e.target.value || "30",10))} style={{ width:80 }} />
          <button onClick={()=>run("summarizeWindow")}>Run</button>
        </div>

        <div>
          <b>Label Message</b> — id:
          <input value={messageId} onChange={e=>setMessageId(e.target.value)} style={{ width:120 }} /> label:
          <input value={label} onChange={e=>setLabel(e.target.value)} style={{ width:140 }} />
          class:
          <select value={classification} onChange={e=>setClassification(e.target.value as any)}>
            <option value="public">public</option>
            <option value="internal">internal</option>
            <option value="restricted">restricted</option>
          </select>
          <button onClick={()=>run("labelMessage")}>Run</button>
        </div>

        <div>
          <b>Analyze File</b> — fileId:
          <input value={fileId} onChange={e=>setFileId(e.target.value)} style={{ width:220 }} />
          <button onClick={()=>run("analyzeFile")}>Run</button>
        </div>

        <div>
          <b>Post As Agent</b>
          <button onClick={()=>run("postAsAgent")}>Run</button>
        </div>
      </div>
    </div>
  );
}
