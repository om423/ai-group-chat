import { z } from "zod";
import { services } from "../services";
import { executeWithPolicy } from "../auth/pdp";

const schema = z.object({
  roomId: z.string().min(1),
  k: z.number().int().positive().max(500)
});
export type SummarizeInput = z.infer<typeof schema>;
export const validateSummarizeWindow = (body: unknown) => schema.parse(body);

const impl = async ({ roomId, k }: SummarizeInput) => {
  return services.summary.summarizeWindow(roomId, k);
};

export const execSummarizeWindow = executeWithPolicy<SummarizeInput, Awaited<ReturnType<typeof impl>>>(
  "Summarize",
  (args) => ({ 
    type: "Room", 
    id: args.roomId,
    orgId: "org-1",
    members: [],
    teacherPresent: true // Mock: assume teacher is present for testing
  }),
  (args) => ({ windowSize: args.k })
);
export const summarizeImpl = impl;
