import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";
import { MessageModel } from "../db/models";

const schema = z.object({
  roomId: z.string().min(1),
  messageId: z.string().min(1),
  assignedTo: z.string().min(1),
  dueAt: z.string().optional().nullable()
});
export type AssignMessageInput = z.infer<typeof schema>;
export const validateAssignMessage = (b: unknown) => schema.parse(b);

const impl = async ({ roomId, messageId, assignedTo, dueAt }: AssignMessageInput) => {
  const update: any = { 
    "meta.task.assignedTo": assignedTo, 
    "meta.task.done": false 
  };
  if (dueAt) {
    update["meta.task.dueAt"] = new Date(dueAt);
  }
  
  await MessageModel.updateOne({ _id: messageId, roomId }, { $set: update });
  const msg = await MessageModel.findById(messageId).lean();
  return { message: msg };
};

export const execAssignMessage = executeWithPolicy<AssignMessageInput, Awaited<ReturnType<typeof impl>>>(
  "AssignMessage",
  (args) => ({ type: "Message", id: args.messageId }),
  (args) => ({ classification: "internal" })
);
export const assignMessageImpl = impl;
