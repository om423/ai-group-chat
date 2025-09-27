import { z } from "zod";
import { services } from "../services";
import { executeWithPolicy } from "../auth/pdp";

const schema = z.object({
  roomId: z.string().min(1),
  visibility: z.enum(["public", "private"])
});
export type CreateThreadInput = z.infer<typeof schema>;
export const validateCreateThread = (body: unknown) => schema.parse(body);

const impl = async ({ roomId, visibility }: CreateThreadInput) => {
  return services.threads.create(roomId, visibility);
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
