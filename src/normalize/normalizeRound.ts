import { type Round, roundSchema } from "../schemas/round.js";
import { createStableId } from "../utils/ids.js";

export interface IfscRoundInput {
  eventId: string;
  name: string;
  order?: number;
  sourceUrl?: string;
  sourceCategoryRoundId?: string;
}

export function normalizeRound(input: IfscRoundInput): Round {
  return roundSchema.parse({
    id: createStableId(["round", input.eventId, input.sourceCategoryRoundId ?? input.name]),
    eventId: input.eventId,
    name: input.name,
    order: input.order,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl
  });
}
