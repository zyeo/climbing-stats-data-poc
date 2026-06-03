import { z } from "zod";

export const eventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  competitionId: z.string().min(1).optional(),
  discipline: z.string().optional(),
  category: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceEventId: z.string().optional(),
  sourceCompetitionId: z.string().optional()
});

export type Event = z.infer<typeof eventSchema>;
