import { boulderProblemResultSchema, type BoulderProblemResult } from "../schemas/boulderProblemResult.js";
import { createStableId } from "../utils/ids.js";

export interface IfscBoulderProblemResultInput {
  resultId: string;
  athleteId: string;
  eventId: string;
  roundId: string;
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
    id: createStableId(["boulder-problem-result", input.resultId, input.roundId, input.sourceRouteId ?? input.routeName ?? ""]),
    resultId: input.resultId,
    athleteId: input.athleteId,
    eventId: input.eventId,
    roundId: input.roundId,
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
