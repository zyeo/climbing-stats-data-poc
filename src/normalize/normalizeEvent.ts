import { type Event, eventSchema } from "../schemas/event.js";
import { createStableId } from "../utils/ids.js";

export interface IfscEventInput {
  name: string;
  competitionId?: string;
  discipline?: string;
  category?: string;
  sourceUrl?: string;
  sourceCompetitionId?: string;
}

export function normalizeEvent(input: IfscEventInput): Event {
  return eventSchema.parse({
    id: createStableId(["event", input.sourceCompetitionId ?? "", input.discipline ?? "", input.category ?? "", input.name]),
    name: input.name,
    competitionId: input.competitionId,
    discipline: input.discipline,
    category: input.category,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl,
    sourceCompetitionId: input.sourceCompetitionId
  });
}
