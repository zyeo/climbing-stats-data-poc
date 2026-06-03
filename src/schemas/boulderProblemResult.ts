import { z } from "zod";

export const boulderProblemResultSchema = z.object({
  id: z.string().min(1),
  resultId: z.string().min(1),
  athleteId: z.string().min(1),
  eventId: z.string().min(1),
  roundId: z.string().min(1),
  sourceCategoryRoundId: z.string().optional(),
  sourceRouteId: z.string().optional(),
  routeName: z.string().optional(),
  points: z.number().optional(),
  top: z.boolean().optional(),
  topTries: z.number().int().nonnegative().optional(),
  zone: z.boolean().optional(),
  zoneTries: z.number().int().nonnegative().optional(),
  lowZone: z.boolean().optional(),
  lowZoneTries: z.number().int().nonnegative().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional()
});

export type BoulderProblemResult = z.infer<typeof boulderProblemResultSchema>;
