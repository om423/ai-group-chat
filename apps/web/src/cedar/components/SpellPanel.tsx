"use client";
import { useState } from "react";
import { useSpells } from "../hooks/useSpells";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SpellPanel({ roomId, asRole }: { roomId: string; asRole: string }) {
  const spells = useSpells();
  const [k, setK] = useState(30);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [messageId, setMessageId] = useState("m1");
  const [label, setLabel] = useState("action-item");
  const [classification, setClassification] = useState<"public" | "internal" | "restricted">("internal");
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
    } catch (e: any) {
      alert(`Spell ${name} failed: ${e.message}`);
    }
  }

  return (
    <Card className="p-6 md:p-8 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-ink-800">Cedar Spells</h3>
        <p className="text-sm text-ink-500 mt-1">
          Quick actions for threads, summaries, labels, and files.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Create Thread */}
        <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-sm font-medium">Create Thread</div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-ink-500">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="input h-10 rounded-xl"
            >
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
            <Button size="sm" variant="primary" className="rounded-xl" onClick={() => run("createThread")}>
              Run
            </Button>
          </div>
        </div>

        {/* Summarize Window */}
        <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-sm font-medium">Summarize Window</div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-ink-500">k</label>
            <Input
              type="number"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value || "30", 10))}
              className="w-24"
            />
            <Button size="sm" className="rounded-xl" onClick={() => run("summarizeWindow")}>
              Run
            </Button>
          </div>
        </div>

        {/* Label Message */}
        <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-sm font-medium">Label Message</div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm text-ink-500">id</label>
            <Input value={messageId} onChange={(e) => setMessageId(e.target.value)} className="w-36" />
            <label className="text-sm text-ink-500">label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="w-44" />
            <label className="text-sm text-ink-500">class</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as any)}
              className="input h-10 rounded-xl"
            >
              <option value="public">public</option>
              <option value="internal">internal</option>
              <option value="restricted">restricted</option>
            </select>
            <Button size="sm" className="rounded-xl" onClick={() => run("labelMessage")}>
              Run
            </Button>
          </div>
        </div>

        {/* Analyze File */}
        <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-sm font-medium">Analyze File</div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-ink-500">fileId</label>
            <Input value={fileId} onChange={(e) => setFileId(e.target.value)} className="w-60" />
            <Button size="sm" className="rounded-xl" onClick={() => run("analyzeFile")}>
              Run
            </Button>
          </div>
        </div>

        {/* Post As Agent */}
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-sm font-medium">Post As Agent</div>
          <Button size="sm" className="rounded-xl" onClick={() => run("postAsAgent")}>
            Run
          </Button>
        </div>
      </div>
    </Card>
  );
}