import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";
import { MessageModel } from "../db/models";

const schema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  includeDone: z.boolean().default(false)
});
export type ListMyTasksInput = z.infer<typeof schema>;
export const validateListMyTasks = (b: unknown) => schema.parse(b);

const impl = async ({ roomId, userId, includeDone = false }: ListMyTasksInput) => {
  const q: any = { roomId, "meta.task.assignedTo": userId };
  if (!includeDone) {
    q["meta.task.done"] = { $ne: true };
  }
  
  const msgs = await MessageModel.find(q)
    .sort({ "meta.task.dueAt": 1, ts: -1 })
    .lean();
    
  return { 
    tasks: msgs.map(m => ({
      messageId: m._id,
      text: m.text,
      labels: m.labels ?? [],
      task: m.meta?.task ?? {},
      ts: m.ts
    }))
  };
};

export const execListMyTasks = executeWithPolicy<ListMyTasksInput, Awaited<ReturnType<typeof impl>>>(
  "ListMyTasks",
  (args) => ({ type: "Room", id: args.roomId }),
  (args) => ({ classification: "internal" })
);
export const listMyTasksImpl = impl;
