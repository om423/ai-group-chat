"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

function principalHeaders(role: string) {
  if (role === "Agent") {
    return { "x-principal-type":"Agent","x-agent-id":"facilitator","x-agent-name":"FacilitatorAgent","x-org-id":"org-1" };
  }
  return { "x-principal-type":"User","x-user-id":`u-${role.toLowerCase()}`,"x-org-id":"org-1","x-roles":role };
}

export function FilePanel({ roomId, asRole }: { roomId: string; asRole: string }) {
  const [classification, setClassification] = useState<"public"|"internal"|"restricted">("internal");
  const [fileId, setFileId] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(e: any) {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("roomId", roomId);
    form.append("orgId", "org-1");
    form.append("classification", classification);
    const r = await fetch(`${AGENT_BASE}/upload`, { method:"POST", body: form });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "upload failed");
    setFileId(j.fileId);
  }

  async function runAnalyze() {
    if (!fileId) return alert("Upload a file first");
    setBusy(true);
    try {
      const r = await fetch(`${AGENT_BASE}/tools/analyze-file`, {
        method: "POST",
        headers: { "content-type":"application/json", ...principalHeaders(asRole) },
        body: JSON.stringify({ fileId, roomId })
      });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || "Denied");
      setAnalysis(j.result);
    } catch (e:any) {
      alert(e.message);
    } finally { setBusy(false); }
  }

  async function postSummary() {
    if (!analysis?.analysis) return;
    const text = `Doc summary:\n${JSON.stringify(analysis.analysis, null, 2)}`;
    await fetch(`${AGENT_BASE}/events/user-joined`, {
      method: "POST",
      headers: { "content-type":"application/json", ...principalHeaders("Agent") },
      body: JSON.stringify({ roomId })
    }); // reuse summarize+post endpoint; or create a dedicated /post if you prefer
    alert("Posted (see Agent Messages/Chat)");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">File Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Classification</label>
          <Select 
            value={classification} 
            onValueChange={(value: any) => setClassification(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">public</SelectItem>
              <SelectItem value="internal">internal</SelectItem>
              <SelectItem value="restricted">restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">File</label>
          <Input 
            type="file" 
            onChange={onUpload}
            className="cursor-pointer"
          />
        </div>
        <Button 
          onClick={runAnalyze} 
          disabled={!fileId || busy}
          className="w-full"
        >
          {busy ? "Analyzing..." : "Analyze"}
        </Button>
        {fileId && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
            <strong>File ID:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{fileId}</code>
          </div>
        )}
        {analysis && (
          <div className="whitespace-pre-wrap font-mono text-xs border border-border rounded-lg p-3 bg-muted text-foreground">
            <div className="mb-2 font-semibold text-foreground">Analysis Results:</div>
            {JSON.stringify(analysis, null, 2)}
            <div className="mt-3">
              <Button 
                size="sm"
                onClick={postSummary}
                className="text-xs"
              >
                Post as Agent
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
