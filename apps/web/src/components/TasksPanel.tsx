"use client";
import { useEffect, useState } from "react";
import { onActionResult, runAgenticAction } from "@/cedar/actionAdapter";
import type { AgenticResult } from "@/cedar/actions";
import { actListMyTasks, actToggleTaskDone } from "@/cedar/spellActions";

type TaskMsg = {
  messageId: string;
  text: string;
  labels: string[];
  task: { assignedTo?: string; done?: boolean; dueAt?: string };
  ts: string;
};

export function TasksPanel({ roomId, userId }: { roomId: string; userId: string }) {
  const [includeDone, setIncludeDone] = useState(false);
  const [tasks, setTasks] = useState<TaskMsg[]>([]);

  const refresh = () => actListMyTasks(roomId, userId, includeDone);

  useEffect(() => {
    refresh();
  }, [roomId, userId, includeDone]);

  useEffect(() => {
    onActionResult((res: AgenticResult) => {
      if (!res.ok) return;
      if (res.action.type === "listMyTasks") {
        setTasks(res.data?.tasks ?? []);
      }
      // live updates when labels/assignments change
      if (res.action.type === "assignMessage" || res.action.type === "toggleTaskDone" || res.action.type === "tagMessage") {
        refresh();
      }
    });
  }, [roomId, userId, includeDone]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase opacity-60">My Tasks</div>
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={includeDone} onChange={e => setIncludeDone(e.target.checked)} />
          Show done
        </label>
      </div>
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.messageId} className="border rounded-xl p-2">
            <div className="flex items-start justify-between gap-2">
              <div className={`text-sm ${t.task?.done ? "line-through opacity-60" : ""}`}>{t.text}</div>
              <button
                className="text-xs px-2 py-1 rounded border hover:bg-muted"
                onClick={() => actToggleTaskDone(roomId, t.messageId, !t.task?.done)}
                title={t.task?.done ? "Mark as open" : "Mark as done"}
              >
                {t.task?.done ? "Reopen" : "Done"}
              </button>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(t.labels ?? []).map(l => (
                <span key={l} className="text-[10px] px-2 py-[2px] rounded-full border uppercase opacity-80">{l}</span>
              ))}
              {t.task?.dueAt ? (
                <span className="text-[10px] px-2 py-[2px] rounded-full border">Due {new Date(t.task.dueAt).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="text-xs opacity-60">No tasks assigned to you.</div>}
      </div>
    </div>
  );
}
