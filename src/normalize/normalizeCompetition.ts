import { type Competition, competitionSchema } from "../schemas/competition.js";
import { createStableId } from "../utils/ids.js";

export interface IfscCompetitionInput {
  name: string;
  season?: number;
  location?: string;
  sourceUrl?: string;
  sourceCompetitionId?: string;
}

export function normalizeCompetition(input: IfscCompetitionInput): Competition {
  return competitionSchema.parse({
    id: createStableId(["competition", input.sourceCompetitionId ?? input.name]),
    name: input.name,
    season: input.season,
    location: input.location,
    source: "ifsc-results",
    sourceUrl: input.sourceUrl,
    sourceCompetitionId: input.sourceCompetitionId
  });
}
