export type ChatMsg = {
  id: string;
  roomId: string;
  authorType: "User" | "Agent";
  authorId: string;
  text: string;
  ts: number;
};

const MAX_PER_ROOM = 200;
const _rooms = new Map<string, ChatMsg[]>();
const _lastAIPost = new Map<string, number>(); // cooldown

export const ChatState = {
  push(msg: ChatMsg) {
    const arr = _rooms.get(msg.roomId) ?? [];
    arr.push(msg);
    if (arr.length > MAX_PER_ROOM) arr.shift();
    _rooms.set(msg.roomId, arr);
  },
  recent(roomId: string, n = 30) {
    const arr = _rooms.get(roomId) ?? [];
    return arr.slice(-n);
  },
  lastAIPost(roomId: string) {
    return _lastAIPost.get(roomId) ?? 0;
  },
  markAIPost(roomId: string) {
    _lastAIPost.set(roomId, Date.now());
  }
};

