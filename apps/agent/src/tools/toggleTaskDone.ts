import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";
import { MessageModel } from "../db/models";

const schema = z.object({
  roomId: z.string().min(1),
  messageId: z.string().min(1),
  done: z.boolean()
});
export type ToggleTaskDoneInput = z.infer<typeof schema>;
export const validateToggleTaskDone = (b: unknown) => schema.parse(b);

const impl = async ({ roomId, messageId, done }: ToggleTaskDoneInput) => {
  await MessageModel.updateOne({ _id: messageId, roomId }, { 
    $set: { "meta.task.done": done } 
  });
  const msg = await MessageModel.findById(messageId).lean();
  return { message: msg };
};

export const execToggleTaskDone = executeWithPolicy<ToggleTaskDoneInput, Awaited<ReturnType<typeof impl>>>(
  "ToggleTaskDone",
  (args) => ({ type: "Message", id: args.messageId }),
  (args) => ({ classification: "internal" })
);
export const toggleTaskDoneImpl = impl;
