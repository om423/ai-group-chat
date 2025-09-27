import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";

const schema = z.object({
  roomId: z.string().min(1),
  text: z.string().min(1)
});
export type PostInput = z.infer<typeof schema>;
export const validatePostAsAgent = (b: unknown) => schema.parse(b);

// Fake post: emit over socket so UI can display "agent message"
import { ioEmit } from "../ws/emit";

const impl = async ({ roomId, text }: PostInput) => {
  ioEmit("agent:message", { roomId, text, ts: Date.now() });
  return { posted: true };
};

export const execPostAsAgent = executeWithPolicy<PostInput, Awaited<ReturnType<typeof impl>>>(
  "PostAsAgent",
  (args) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);
export const postAsAgentImpl = impl;
