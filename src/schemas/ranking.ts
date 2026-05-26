import { z } from "zod";

export const rankingSchema = z.object({
  id: z.string().min(1),
  athleteId: z.string().min(1),
  rank: z.number().int().positive(),
  points: z.number().nonnegative().optional(),
  discipline: z.string().optional(),
  season: z.number().int().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional()
});

export type Ranking = z.infer<typeof rankingSchema>;
