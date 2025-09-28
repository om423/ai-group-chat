type Key = string; // `${roomId}:${userId}`
const LAST = new Map<Key, number>();
const now = () => Date.now();

export function shouldWelcome(roomId: string, userId: string, minMs = Number(process.env.WELCOME_BRIEF_MIN_MS ?? 180000)) {
  const key = `${roomId}:${userId}`;
  const last = LAST.get(key) ?? 0;
  if (now() - last >= minMs) {
    LAST.set(key, now());
    return true;
  }
  return false;
}

export function getLastWelcomeTime(roomId: string, userId: string): number | null {
  const key = `${roomId}:${userId}`;
  return LAST.get(key) ?? null;
}

export function clearWelcomeCache(roomId?: string, userId?: string) {
  if (roomId && userId) {
    const key = `${roomId}:${userId}`;
    LAST.delete(key);
  } else if (roomId) {
    // Clear all entries for this room
    for (const [key] of LAST) {
      if (key.startsWith(`${roomId}:`)) {
        LAST.delete(key);
      }
    }
  } else {
    // Clear all entries
    LAST.clear();
  }
}
