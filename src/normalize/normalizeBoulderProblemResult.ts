import { boulderProblemResultSchema, type BoulderProblemResult } from "../schemas/boulderProblemResult.js";
import { createStableId } from "../utils/ids.js";

export interface IfscBoulderProblemResultInput {
  resultId: string;
  boulderProblemId: string;
  athleteId: string;
  eventId: string;
  roundId: string;
  sourceCategoryRoundId?: string;
  sourceRouteId?: string;
  routeName?: string;
  points?: number;
  top?: boolean;
  topTries?: number;
  zone?: boolean;
  zoneTries?: number;
  lowZone?: boolean;
  lowZoneTries?: number;
  sourceUrl?: string;
}

export function normalizeBoulderProblemResult(input: IfscBoulderProblemResultInput): BoulderProblemResult {
  return boulderProblemResultSchema.parse({
    id: createStableId(["boulder-problem-result", input.resultId, input.boulderProblemId]),
    resultId: input.resultId,
    boulderProblemId: input.boulderProblemId,
    athleteId: input.athleteId,
    eventId: input.eventId,
    roundId: input.roundId,
    sourceCategoryRoundId: input.sourceCategoryRoundId,
    sourceRouteId: input.sourceRouteId,
    routeName: input.routeName,
    points: input.points,
    top: input.top,
    topTries: input.topTries,
    zone: input.zone,
    zoneTries: input.zoneTries,
    lowZone: input.lowZone,
    lowZoneTries: input.lowZoneTries,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl
  });
}
