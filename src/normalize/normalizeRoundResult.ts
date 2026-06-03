import { roundResultSchema, type RoundResult } from "../schemas/roundResult.js";
import { createStableId } from "../utils/ids.js";

export interface IfscRoundResultInput {
  resultId: string;
  eventId: string;
  roundId: string;
  athleteId: string;
  rank?: number;
  score?: string;
  startingGroup?: string;
  sourceUrl?: string;
  sourceCategoryRoundId?: string;
}

export function normalizeRoundResult(input: IfscRoundResultInput): RoundResult {
  return roundResultSchema.parse({
    id: createStableId(["round-result", input.resultId, input.roundId, input.athleteId]),
    resultId: input.resultId,
    eventId: input.eventId,
    roundId: input.roundId,
    athleteId: input.athleteId,
    rank: input.rank,
    score: input.score,
    startingGroup: input.startingGroup,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl,
    sourceCategoryRoundId: input.sourceCategoryRoundId
  });
}
