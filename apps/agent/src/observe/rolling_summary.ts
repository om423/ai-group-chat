type RoomKey = string;

const COUNTS = new Map<RoomKey, number>();    // user messages since last summary
const LAST_TS = new Map<RoomKey, number>();   // last summary timestamp (ms)

const now = () => Date.now();

export type RollingSummaryConfig = {
  interval: number;     // e.g., 10 messages
  minMs: number;        // min time between summaries
};

export function getRollingConfig(): RollingSummaryConfig {
  const interval = Math.max(1, Number(process.env.ROLLING_SUMMARY_INTERVAL ?? 10));
  const minMs = Math.max(0, Number(process.env.ROLLING_SUMMARY_MIN_MS ?? 45000));
  return { interval, minMs };
}

export function noteUserMessage(roomId: string) {
  const c = COUNTS.get(roomId) ?? 0;
  COUNTS.set(roomId, c + 1);
}

export function shouldTriggerSummary(roomId: string, cfg = getRollingConfig()) {
  const count = COUNTS.get(roomId) ?? 0;
  const last = LAST_TS.get(roomId) ?? 0;
  const elapsed = now() - last;

  if (count >= cfg.interval && elapsed >= cfg.minMs) {
    return true;
  }
  return false;
}

export function markSummary(roomId: string) {
  COUNTS.set(roomId, 0);
  LAST_TS.set(roomId, now());
}
