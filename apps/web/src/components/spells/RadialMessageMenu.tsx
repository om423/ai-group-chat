"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSpell, Hotkey, ActivationMode } from "cedar-os";
import { actOpenFork, actTagMessage, actSummarizeWindow, actAskAI, actAssignMessage } from "@/cedar/spellActions";

type RadialTarget = {
  messageId: string;
  text: string;
  authorId?: string;
  authorType?: string;
};

type Props = {
  roomId: string;
  // The host list should set these when a message is double-clicked:
  target?: RadialTarget | null;
  onFork?: (payload: RadialTarget) => void;
};

type RadialAction = {
  id: string;
  label: string;
  onClick: () => void;
};

export function RadialMessageMenu({ roomId, target, onFork }: Props) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  // Register a Cedar spell that activates on double-click.
  const { isActive, activate, deactivate } = useSpell({
    id: "message-radial-menu",
    activationConditions: {
      // We'll toggle this programmatically on double-click with coordinates.
      events: [],
      mode: ActivationMode.TOGGLE,
    },
    onActivate: () => {},
    onDeactivate: () => setAnchor(null),
  });

  // Expose a window event API for the message list to open the radial menu
  useEffect(() => {
    const onOpen = (e: any) => {
      const detail = e.detail as { x: number; y: number; messageId: string; text: string };
      if (!detail) return;
      console.log('[RadialMenu] Opening radial menu at:', detail);
      setAnchor({ x: detail.x, y: detail.y });
      activate();
    };
    window.addEventListener("spell:messageRadialOpen", onOpen as any);
    return () => window.removeEventListener("spell:messageRadialOpen", onOpen as any);
  }, [activate]);

  const items: RadialAction[] = useMemo(() => {
    if (!target) return [];
    const me = (window as any).__sessionUserId || "demo-user"; // replace with your auth

    return [
      {
        id: "answer",
        label: "Ask AI (about this)",
        onClick: () => actAskAI(roomId, `Answer this message: "${target.text}"`),
      },
      {
        id: "summarize",
        label: "Summarize recent",
        onClick: () => actSummarizeWindow(roomId, 30),
      },
      {
        id: "fork",
        label: "Open Fork",
        onClick: () => {
          if (onFork) {
            onFork(target);
          } else {
            actOpenFork(roomId, "public");
          }
        },
      },
      {
        id: "tag",
        label: "Tag: open-question",
        onClick: () => actTagMessage(roomId, target.messageId, "open-question"),
      },
      {
        id: "task",
        label: "Mark Action Item",
        onClick: () => actTagMessage(roomId, target.messageId, "action-item"),
      },
      {
        id: "assignMe",
        label: "Assign to me",
        onClick: () => actAssignMessage(roomId, target.messageId, me),
      },
    ];
  }, [roomId, target]);

  if (!isActive || !anchor || !target) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={() => deactivate()}>
      <div
        className="absolute rounded-full bg-background/95 shadow-xl border p-3"
        style={{ left: anchor.x, top: anchor.y, transform: "translate(-50%, -50%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => { it.onClick(); deactivate(); }}
              className="px-3 py-2 rounded-xl border hover:bg-muted text-sm"
              title={it.label}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
