import { io } from "socket.io-client";
import type { AgenticAction, AgenticResult } from "./actions";

let socket: ReturnType<typeof io> | null = null;

export function initActionSocket(base = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111") {
  if (socket) return socket;
  socket = io(base, { transports: ["websocket"] });
  
  // Join the room when socket connects
  socket.on("connect", () => {
    console.log("[ActionAdapter] Connected to agent socket");
  });
  
  return socket;
}

export async function runAgenticAction(action: AgenticAction): Promise<void> {
  const s = initActionSocket();
  
  // Join the room first
  s.emit("room:join", action.roomId);
  
  // Then emit the action
  s.emit("action:run", action);
}

export function onActionResult(cb: (result: AgenticResult) => void) {
  const s = initActionSocket();
  s.off("action:result").on("action:result", cb);
}

// New Mastra integration functions
export async function runMastraAction(action: {
  type: string;
  roomId: string;
  userId?: string;
  prompt?: string;
  [key: string]: any;
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";
  
  try {
    const response = await fetch(`${base}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: action.prompt || `Execute ${action.type} action`,
        roomId: action.roomId,
        userId: action.userId,
        additionalContext: action,
        temperature: 0.7,
        maxTokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mastra action failed: ${response.statusText}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('[Mastra] Stream data:', data);
            } catch (e) {
              // Ignore parsing errors for non-JSON data
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Mastra] Action failed:', error);
    throw error;
  }
}
