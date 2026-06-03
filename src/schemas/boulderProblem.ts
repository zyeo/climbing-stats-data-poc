import { z } from "zod";

export const boulderProblemSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  roundId: z.string().min(1),
  sourceCategoryRoundId: z.string().optional(),
  sourceRouteId: z.string().optional(),
  routeName: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional()
});

export type BoulderProblem = z.infer<typeof boulderProblemSchema>;
