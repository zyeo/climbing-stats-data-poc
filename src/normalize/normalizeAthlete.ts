import { type Athlete, athleteSchema } from "../schemas/athlete.js";
import { createStableId } from "../utils/ids.js";

export interface IfscAthleteInput {
  name: string;
  country?: string;
  sourceUrl?: string;
  sourceAthleteId?: string;
}

export function normalizeAthlete(input: IfscAthleteInput): Athlete {
  return athleteSchema.parse({
    id: createStableId(["athlete", input.sourceAthleteId ?? input.name]),
    name: input.name,
    country: input.country,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl,
    sourceAthleteId: input.sourceAthleteId
  });
}
