import type { Spell } from "@/cedar/spells";
import { spellToAction } from "@/cedar/actions";
import { runAgenticAction } from "@/cedar/actionAdapter";

export type RunSpellOptions = {
  roomId?: string;
  threadId?: string | null;
  messageId?: string | null;
  kMessages?: number;
  fileKey?: string;
};

export function runSpell(spell: Spell, opts: RunSpellOptions = {}) {
  // 1) Dispatch a DOM event (kept for debug/compat).
  window.dispatchEvent(new CustomEvent("spell:run", { detail: { spell, opts } }));

  // 2) Convert to action and send to server.
  if (!opts.roomId) return;
  const action = spellToAction(spell, {
    roomId: opts.roomId,
    threadId: opts.threadId ?? null,
    targetMessageId: opts.messageId ?? null,
  });
  if (action) {
    runAgenticAction(action);
  }
}
