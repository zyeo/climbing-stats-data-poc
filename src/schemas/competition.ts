import { z } from "zod";

export const competitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  season: z.number().int().optional(),
  location: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceCompetitionId: z.string().optional()
});

export type Competition = z.infer<typeof competitionSchema>;
