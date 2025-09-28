export type SpellId =
  | "openFork"
  | "tagMessage"
  | "postSummary"
  | "inviteUser"
  | "analyzeFile"
  | "summarizeWindow"
  | "askAI";

export type Spell = {
  id: SpellId;
  label: string;
  k?: string; // optional single-letter key for ⌘/Ctrl hotkey (e.g., 'f')
};

export const DEFAULT_SPELLS: Spell[] = [
  { id: "openFork", label: "Open Thread Fork", k: "f" },
  { id: "tagMessage", label: "Tag Message", k: "t" },
  { id: "postSummary", label: "Post Summary", k: "s" },
  { id: "inviteUser", label: "Invite User", k: "i" },
  { id: "analyzeFile", label: "Analyze File", k: "a" },
  { id: "summarizeWindow", label: "Summarize Last N", k: "w" },
  { id: "askAI", label: "Ask AI (compose)", k: "k" },
];
