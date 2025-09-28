import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";
import { ThreadModel, RoomModel } from "../db/models";

const schema = z.object({
  roomId: z.string().min(1),
  visibility: z.enum(["public", "private"])
});
export type CreateThreadInput = z.infer<typeof schema>;
export const validateCreateThread = (body: unknown) => schema.parse(body);

const impl = async ({ roomId, visibility }: CreateThreadInput) => {
  await RoomModel.updateOne({ roomId }, { $setOnInsert: { roomId, name:`Room ${roomId}`, orgId:"org-1" }}, { upsert:true });
  const threadId = `thr_${Math.random().toString(36).slice(2)}`;
  const doc = await ThreadModel.create({ threadId, roomId, name:`Thread ${threadId.slice(-4)}`, visibility });
  return { threadId: doc.threadId, roomId: doc.roomId, visibility: doc.visibility, name: doc.name };
};

export const execCreateThread = executeWithPolicy<CreateThreadInput, Awaited<ReturnType<typeof impl>>>(
  "CreateThread",
  (args) => ({ 
    type: "Room", 
    id: args.roomId,
    orgId: "org-1",
    members: [],
    teacherPresent: true // Mock: assume teacher is present for testing
  }),
  (args) => ({ visibility: args.visibility })
);
export const createThreadImpl = impl;
