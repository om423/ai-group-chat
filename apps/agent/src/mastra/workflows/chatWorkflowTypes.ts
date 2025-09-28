import { z } from 'zod';

// Define the action schema for structured outputs
export const ActionSchema = z.object({
  type: z.string(),
  data: z.any().optional(),
  metadata: z.any().optional(),
});

export type Action = z.infer<typeof ActionSchema>;
