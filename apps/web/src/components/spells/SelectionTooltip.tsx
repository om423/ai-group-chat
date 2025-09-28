"use client";

import { useEffect, useRef, useState } from "react";
import { useSpell, ActivationMode, Hotkey } from "cedar-os";
import { actAskAI, actSummarizeWindow } from "@/cedar/spellActions";

type Props = { roomId: string };

export function SelectionTooltip({ roomId }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { isActive, activate, deactivate } = useSpell({
    id: "selection-tooltip",
    activationConditions: {
      // We'll activate programmatically when a non-empty selection exists.
      events: [],
      mode: ActivationMode.TOGGLE,
    },
    onDeactivate: () => setTooltip(null),
  });

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text) {
        const range = sel!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
        activate();
      } else {
        if (isActive) deactivate();
      }
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [activate, deactivate, isActive]);

  if (!isActive || !tooltip) return null;

  return (
    <div className="fixed inset-0 z-40" onMouseDown={() => deactivate()}>
      <div
        className="absolute translate-x-[-50%] translate-y-[-100%] bg-background border shadow-xl rounded-xl p-2"
        style={{ left: tooltip.x, top: tooltip.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-lg border hover:bg-muted text-sm"
            onClick={() => { actAskAI(roomId, `Explain this selection:\n\n${tooltip.text}`); deactivate(); }}
          >
            Ask AI
          </button>
          <button
            className="px-3 py-1 rounded-lg border hover:bg-muted text-sm"
            onClick={() => { actSummarizeWindow(roomId, 30); deactivate(); }}
          >
            Summarize window
          </button>
        </div>
      </div>
    </div>
  );
}
