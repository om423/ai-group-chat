export type Visibility = "public" | "private";

export class ThreadsService {
  async create(roomId: string, visibility: Visibility) {
    // TODO: replace with Mongo write
    const threadId = `thr_${Math.random().toString(36).slice(2)}`;
    console.log(`[threads] create -> room=${roomId} visibility=${visibility} => ${threadId}`);
    return { threadId, roomId, visibility };
  }
}


