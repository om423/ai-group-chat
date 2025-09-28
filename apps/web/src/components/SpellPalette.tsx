"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spell } from "@/cedar/spells";
import { DEFAULT_SPELLS } from "@/cedar/spells";

type Props = {
  onRun: (s: Spell) => void;
};

export function SpellPalette({ onRun }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // Global hotkeys:
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Toggle palette
      if (meta && key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // Quick-run single-letter hotkeys when palette is closed
      if (!open && meta) {
        const spell = DEFAULT_SPELLS.find((s) => s.k === key);
        if (spell) {
          e.preventDefault();
          onRun(spell);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRun]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DEFAULT_SPELLS;
    return DEFAULT_SPELLS.filter((s) =>
      s.label.toLowerCase().includes(term)
    );
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
      onClick={() => setOpen(false)}
      aria-label="Spell palette backdrop"
    >
      <div
        className="mx-auto mt-24 w-full max-w-xl rounded-2xl bg-background p-4 shadow-xl border"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="w-full p-3 border rounded-xl mb-3 outline-none"
          placeholder="Type a command…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="space-y-1 max-h-80 overflow-auto">
          {items.map((s) => (
            <li key={s.id}>
              <button
                className="w-full text-left p-2 hover:bg-muted rounded-xl flex items-center justify-between"
                onClick={() => {
                  onRun(s);
                  setOpen(false);
                }}
              >
                <span>{s.label}</span>
                {s.k ? (
                  <kbd className="px-2 py-0.5 text-xs border rounded-lg opacity-70">
                    ⌘/{s.k.toUpperCase()}
                  </kbd>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-xs opacity-70">
          Tip: Press <kbd className="px-1 border rounded">Esc</kbd> to close.
        </div>
      </div>
    </div>
  );
}
