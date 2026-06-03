import { boulderProblemSchema, type BoulderProblem } from "../schemas/boulderProblem.js";
import { createStableId } from "../utils/ids.js";

export interface IfscBoulderProblemInput {
  eventId: string;
  roundId: string;
  sourceCategoryRoundId?: string;
  sourceRouteId?: string;
  routeName?: string;
  sourceUrl?: string;
}

export function normalizeBoulderProblem(input: IfscBoulderProblemInput): BoulderProblem {
  return boulderProblemSchema.parse({
    id: createStableId(["boulder-problem", input.eventId, input.roundId, input.sourceRouteId ?? input.routeName ?? ""]),
    eventId: input.eventId,
    roundId: input.roundId,
    sourceCategoryRoundId: input.sourceCategoryRoundId,
    sourceRouteId: input.sourceRouteId,
    routeName: input.routeName,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl
  });
}
