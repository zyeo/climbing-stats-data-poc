import { z } from "zod";

export const roundResultSchema = z.object({
  id: z.string().min(1),
  resultId: z.string().min(1),
  eventId: z.string().min(1),
  roundId: z.string().min(1),
  athleteId: z.string().min(1),
  rank: z.number().int().positive().optional(),
  score: z.string().optional(),
  startingGroup: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceCategoryRoundId: z.string().optional()
});

export type RoundResult = z.infer<typeof roundResultSchema>;
