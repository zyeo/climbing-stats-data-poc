import { z } from "zod";

export const athleteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().optional(),
  source: z.literal("ifsc-results"),
  sourceUrl: z.string().url().optional(),
  sourceAthleteId: z.string().optional()
});

export type Athlete = z.infer<typeof athleteSchema>;
