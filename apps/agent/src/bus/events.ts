// Simple event bus for agent subscriptions
type EventHandler = (data: any) => void | Promise<void>;

const eventHandlers: Map<string, EventHandler[]> = new Map();

export function on(event: string, handler: EventHandler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, []);
  }
  eventHandlers.get(event)!.push(handler);
}

export function emit(event: string, data: any) {
  const handlers = eventHandlers.get(event) || [];
  handlers.forEach(handler => {
    try {
      const result = handler(data);
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`Error in event handler for ${event}:`, error);
        });
      }
    } catch (error) {
      console.error(`Error in event handler for ${event}:`, error);
    }
  });
}

// Event types
export type MessageCreatedEvent = {
  roomId: string;
  authorType: "User" | "Agent";
  authorId: string;
  text: string;
  ts: number;
  _id?: string;
};

export type ThreadMessageCreatedEvent = {
  threadId: string;
  roomId: string;
  authorType: "User" | "Agent";
  authorId: string;
  text: string;
  ts: number;
  _id?: string;
};

export type RoomContextUpdatedEvent = {
  roomId: string;
  teacherPresent: boolean;
  orgId: string;
  members: string[];
};
