import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";
import { ThreadModel, RoomModel } from "../db/models";
import { ioEmit } from "../ws/emit";

const schema = z.object({
  roomId: z.string().min(1),
  visibility: z.enum(["public", "private"]),
  name: z.string().min(1).optional(),
  originMessageId: z.string().min(1).optional(),
  originAuthorId: z.string().min(1).optional(),
  originAuthorType: z.enum(["User", "Agent"]).optional(),
  originSnippet: z.string().optional(),
  createdBy: z.string().optional()
});
export type CreateThreadInput = z.infer<typeof schema>;
export const validateCreateThread = (body: unknown) => schema.parse(body);

const impl = async ({ roomId, visibility, name, originMessageId, originAuthorId, originAuthorType, originSnippet, createdBy }: CreateThreadInput) => {
  await RoomModel.updateOne({ roomId }, { $setOnInsert: { roomId, name:`Room ${roomId}`, orgId:"org-1" }}, { upsert:true });
  const threadId = `thr_${Math.random().toString(36).slice(2)}`;
  const displayName = name || (originAuthorId ? `${visibility === "private" ? "Private notes" : "Fork"} • ${originAuthorId}` : `Thread ${threadId.slice(-4)}`);
  const doc = await ThreadModel.create({
    threadId,
    roomId,
    name: displayName,
    visibility,
    createdBy,
    originMessageId,
    originAuthorId,
    originAuthorType,
    originSnippet,
  });
  const payload = {
    threadId: doc.threadId,
    roomId: doc.roomId,
    visibility: doc.visibility,
    name: doc.name,
    createdBy: doc.createdBy,
    originMessageId: doc.originMessageId,
    originAuthorId: doc.originAuthorId,
    originAuthorType: doc.originAuthorType,
    originSnippet: doc.originSnippet,
  };
  ioEmit("thread:created", payload);
  return payload;
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
