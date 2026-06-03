import { z } from "zod";

const eventMetadataSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  local_start_date: z.string().nullable().optional(),
  local_end_date: z.string().nullable().optional(),
  disciplines: z.array(
    z.object({
      kind: z.string()
    }).passthrough()
  ),
  d_cats: z.array(z.unknown()).optional(),
  rounds: z.array(z.unknown()).optional()
}).passthrough();

const eventResultSchema = z.object({
  event: z.string(),
  dcat: z.string(),
  status: z.string(),
  category_rounds: z.array(
    z.object({
      category_round_id: z.number(),
      kind: z.string(),
      name: z.string(),
      category: z.string(),
      status: z.string().nullable().optional(),
      result_url: z.string().nullable().optional()
    }).passthrough()
  ),
  ranking: z.array(
    z.object({
      athlete_id: z.number(),
      bib_number: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      firstname: z.string().nullable().optional(),
      lastname: z.string().nullable().optional(),
      name: z.string(),
      rank: z.number().nullable().optional(),
      rounds: z.array(
        z.object({
          category_round_id: z.number(),
          round_name: z.string(),
          rank: z.number().nullable().optional(),
          score: z.string().nullable().optional(),
          starting_group: z.string().nullable().optional(),
          ascents: z.array(z.unknown()).optional()
        }).passthrough()
      )
    }).passthrough()
  ),
  ranking_as_of: z.string().nullable().optional()
}).passthrough();

export interface IfscParsedEventMetadata {
  sourceEventId: number;
  name: string;
  location?: string;
  country?: string;
  localStartDate?: string;
  localEndDate?: string;
  disciplines: string[];
  disciplineCategoryCount: number;
  roundCount: number;
}

export interface IfscParsedEventResult {
  eventName: string;
  disciplineCategory: string;
  discipline: string;
  category: string;
  status: string;
  categoryRounds: Array<{
    sourceCategoryRoundId: number;
    kind: string;
    name: string;
    category: string;
    status?: string;
    resultUrl?: string;
  }>;
  rankings: Array<{
    sourceAthleteId: number;
    bibNumber?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    rank?: number;
    rounds: Array<{
      sourceCategoryRoundId: number;
      roundName: string;
      rank?: number;
      score?: string;
      startingGroup?: string;
      ascentCount: number;
    }>;
  }>;
  rankingAsOf?: string;
}

function parseJsonObject(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Expected valid JSON.");
  }
}

function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function parseDisciplineCategory(dcat: string): { discipline: string; category: string } {
  const [discipline, ...categoryParts] = dcat.trim().split(/\s+/);

  return {
    discipline: discipline?.toLowerCase() ?? "",
    category: categoryParts.join(" ")
  };
}

export function parseEventMetadataJson(json: string): IfscParsedEventMetadata {
  const input = eventMetadataSchema.parse(parseJsonObject(json));

  return {
    sourceEventId: input.id,
    name: input.name,
    location: optionalString(input.location),
    country: optionalString(input.country),
    localStartDate: optionalString(input.local_start_date),
    localEndDate: optionalString(input.local_end_date),
    disciplines: input.disciplines.map((discipline) => discipline.kind),
    disciplineCategoryCount: input.d_cats?.length ?? 0,
    roundCount: input.rounds?.length ?? 0
  };
}

export function parseEventResultJson(json: string): IfscParsedEventResult {
  const input = eventResultSchema.parse(parseJsonObject(json));
  const { discipline, category } = parseDisciplineCategory(input.dcat);

  return {
    eventName: input.event,
    disciplineCategory: input.dcat,
    discipline,
    category,
    status: input.status,
    categoryRounds: input.category_rounds.map((round) => ({
      sourceCategoryRoundId: round.category_round_id,
      kind: round.kind,
      name: round.name,
      category: round.category,
      status: optionalString(round.status),
      resultUrl: optionalString(round.result_url)
    })),
    rankings: input.ranking.map((ranking) => ({
      sourceAthleteId: ranking.athlete_id,
      bibNumber: optionalString(ranking.bib_number),
      name: ranking.name,
      firstName: optionalString(ranking.firstname),
      lastName: optionalString(ranking.lastname),
      country: optionalString(ranking.country),
      rank: ranking.rank ?? undefined,
      rounds: ranking.rounds.map((round) => ({
        sourceCategoryRoundId: round.category_round_id,
        roundName: round.round_name,
        rank: round.rank ?? undefined,
        score: round.score ?? undefined,
        startingGroup: round.starting_group ?? undefined,
        ascentCount: round.ascents?.length ?? 0
      }))
    })),
    rankingAsOf: optionalString(input.ranking_as_of)
  };
}
