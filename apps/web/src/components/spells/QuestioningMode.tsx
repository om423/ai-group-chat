"use client";

import { useEffect, useState } from "react";
import { useSpell, ActivationMode, Hotkey } from "cedar-os";

export function QuestioningMode() {
  const [hint, setHint] = useState<{ x: number; y: number; text: string } | null>(null);

  const { isActive, toggle, deactivate } = useSpell({
    id: "questioning-mode",
    activationConditions: {
      events: [Hotkey.Q],
      mode: ActivationMode.TOGGLE,
    },
    onDeactivate: () => setHint(null),
  });

  useEffect(() => {
    if (!isActive) return;
    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const txt = el?.getAttribute?.("data-question");
      if (txt) setHint({ x: e.clientX + 10, y: e.clientY + 10, text: txt });
      else setHint(null);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isActive]);

  if (!isActive || !hint) return null;

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: hint.x, top: hint.y }}>
      <div className="rounded-lg border bg-background shadow px-2 py-1 text-xs opacity-95">
        {hint.text}
      </div>
    </div>
  );
}
