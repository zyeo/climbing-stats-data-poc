import { z } from "zod";

export const roundSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().nonnegative().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceCategoryRoundId: z.string().optional()
});

export type Round = z.infer<typeof roundSchema>;
