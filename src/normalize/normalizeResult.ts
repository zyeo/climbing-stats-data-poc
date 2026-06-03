import { type Result, resultSchema } from "../schemas/result.js";
import { createStableId } from "../utils/ids.js";

export interface IfscResultInput {
  eventId: string;
  athleteId: string;
  rank?: number;
  score?: string;
  sourceUrl?: string;
  sourceEventId?: string;
  sourceAthleteId?: string;
}

export function normalizeResult(input: IfscResultInput): Result {
  return resultSchema.parse({
    id: createStableId(["result", input.eventId, input.athleteId, String(input.rank ?? "")]),
    eventId: input.eventId,
    athleteId: input.athleteId,
    rank: input.rank,
    score: input.score,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl,
    sourceEventId: input.sourceEventId,
    sourceAthleteId: input.sourceAthleteId
  });
}
