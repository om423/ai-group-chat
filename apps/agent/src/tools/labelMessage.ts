import { z } from "zod";
import { executeWithPolicy } from "../auth/pdp";

const schema = z.object({
  messageId: z.string().min(1),
  classification: z.enum(["public","internal","restricted"]),
  label: z.string().min(1)
});
export type LabelInput = z.infer<typeof schema>;
export const validateLabelMessage = (b: unknown) => schema.parse(b);

// Fake impl: we don't persist yet; just echo
const impl = async ({ messageId, label }: LabelInput) => ({ messageId, label, applied: true });

export const execLabelMessage = executeWithPolicy<LabelInput, Awaited<ReturnType<typeof impl>>>(
  "LabelMessage",
  (args) => ({ type: "Message", id: args.messageId }),
  (args) => ({ classification: args.classification })
);
export const labelMessageImpl = impl;

