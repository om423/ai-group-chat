"use client";

import { useMemo, useState, type ReactNode } from "react";
import { actOpenFork, actTagMessage, actSummarizeWindow, actAskAI } from "@/cedar/spellActions";
import { cn } from "@/lib/cn";

type Props = {
  roomId: string;
};

type SpellAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

const RADIUS_PX = 140;

export function SpellsMenu({ roomId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const spells = useMemo<SpellAction[]>(() => [
    {
      id: "ask-ai",
      label: "Ask AI",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 6V4" strokeLinecap="round" />
          <path d="M12 20v-2" strokeLinecap="round" />
          <path d="M18 12h2" strokeLinecap="round" />
          <path d="M4 12h2" strokeLinecap="round" />
          <path d="M16.95 7.05 18.36 5.64" strokeLinecap="round" />
          <path d="M5.64 18.36 7.05 16.95" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => {
        const prompt = window.prompt("Ask the assistant:");
        if (prompt && prompt.trim()) {
          actAskAI(roomId, prompt.trim());
        }
        setIsOpen(false);
      },
    },
    {
      id: "summarize",
      label: "Summarize",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 5h14M5 12h10M5 19h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => {
        actSummarizeWindow(roomId, 30);
        setIsOpen(false);
      },
    },
    {
      id: "fork",
      label: "Open Fork",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4v6a4 4 0 0 0 4 4h2a4 4 0 0 1 4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="4" r="2" />
          <circle cx="17" cy="4" r="2" />
          <circle cx="17" cy="20" r="2" />
        </svg>
      ),
      onClick: () => {
        actOpenFork(roomId, "public");
        setIsOpen(false);
      },
    },
    {
      id: "tag",
      label: "Tag Msg",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4h6l7 7-7 7-6-6V4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 7h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => {
        const messageId = window.prompt("Message ID to tag as open-question:");
        if (messageId && messageId.trim()) {
          actTagMessage(roomId, messageId.trim(), "open-question");
        }
        setIsOpen(false);
      },
    },
  ], [roomId]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {spells.map((spell, index) => {
          const start = Math.PI * 0.6; // ~108°
          const end = Math.PI * 1.2;   // ~216°
          const step = spells.length > 1 ? (end - start) / (spells.length - 1) : 0;
          const angle = start + step * index;
          const x = Math.cos(angle) * RADIUS_PX;
          const y = Math.sin(angle) * RADIUS_PX;

          return (
            <button
              key={spell.id}
              onClick={() => spell.onClick()}
              className={cn(
                "absolute bottom-0 right-0 flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-2xl border border-border/70 bg-white/95 text-[11px] font-medium uppercase tracking-wide text-ink-700 shadow-soft transition-all duration-300 ease-out hover:border-matcha-300 hover:text-matcha-600 hover:shadow-lift",
                isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              )}
              style={{
                transform: `translate(calc(-50% + ${-x}px), calc(50% - ${y}px)) scale(${isOpen ? 1 : 0.75})`,
              }}
              aria-hidden={!isOpen}
              aria-label={spell.label}
            >
              {spell.icon}
              <span>{spell.label}</span>
            </button>
          );
        })}

        <button
          onClick={toggle}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full bg-matcha-400 text-white shadow-soft transition-all duration-200",
            isOpen ? "rotate-45 bg-matcha-500" : "hover:bg-matcha-500"
          )}
          title="Spells menu"
          aria-expanded={isOpen}
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3v18M3 12h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}
    </div>
  );
}
