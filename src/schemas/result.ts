import { z } from "zod";

export const resultSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  athleteId: z.string().min(1),
  rank: z.number().int().positive().optional(),
  score: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceEventId: z.string().optional(),
  sourceAthleteId: z.string().optional()
});

export type Result = z.infer<typeof resultSchema>;
