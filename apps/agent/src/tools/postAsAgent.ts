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
  // Store agent message in database
  const { MessageModel } = await import("../db/models");
  const msg = await MessageModel.create({
    roomId,
    authorType: "Agent",
    authorId: "FacilitatorAgent",
    text,
    ts: Date.now()
  });
  
  // Emit to socket for real-time updates
  ioEmit("agent:message", { roomId, text, ts: Date.now() });
  
  // Also emit as regular chat message
  ioEmit("chat:message", msg.toObject());
  
  return { posted: true, message: msg };
};

export const execPostAsAgent = executeWithPolicy<PostInput, Awaited<ReturnType<typeof impl>>>(
  "PostAsAgent",
  (args) => ({ type: "Room", id: args.roomId, orgId: "org-1", teacherPresent: true })
);
export const postAsAgentImpl = impl;
