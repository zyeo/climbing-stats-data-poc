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
          ascents: z.array(
            z.object({
              route_id: z.number().nullable().optional(),
              route_name: z.string().nullable().optional(),
              points: z.number().nullable().optional(),
              top: z.boolean().nullable().optional(),
              top_tries: z.number().nullable().optional(),
              zone: z.boolean().nullable().optional(),
              zone_tries: z.number().nullable().optional(),
              low_zone: z.boolean().nullable().optional(),
              low_zone_tries: z.number().nullable().optional(),
              status: z.string().nullable().optional()
            }).passthrough()
          ).optional()
        }).passthrough()
      )
    }).passthrough()
  ),
  ranking_as_of: z.string().nullable().optional()
}).passthrough();

const ascentSchema = z.object({
  route_id: z.number().nullable().optional(),
  route_name: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  top: z.boolean().nullable().optional(),
  top_tries: z.number().nullable().optional(),
  zone: z.boolean().nullable().optional(),
  zone_tries: z.number().nullable().optional(),
  low_zone: z.boolean().nullable().optional(),
  low_zone_tries: z.number().nullable().optional(),
  status: z.string().nullable().optional()
}).passthrough();

const categoryRoundResultSchema = z.object({
  id: z.number(),
  event: z.string(),
  event_id: z.number(),
  dcat_id: z.number(),
  discipline: z.string(),
  status: z.string(),
  category: z.string(),
  round: z.string(),
  points_per_boulder_settings: z.object({
    points_per_zone: z.number().nullable().optional(),
    points_per_top: z.number().nullable().optional(),
    points_per_low_zone: z.number().nullable().optional(),
    use_low_zone: z.boolean().nullable().optional(),
    fall_deduction: z.number().nullable().optional()
  }).passthrough().nullable().optional(),
  routes: z.array(
    z.object({
      id: z.number(),
      name: z.string()
    }).passthrough()
  ).optional(),
  ranking: z.array(
    z.object({
      athlete_id: z.number(),
      bib: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      firstname: z.string().nullable().optional(),
      lastname: z.string().nullable().optional(),
      name: z.string(),
      rank: z.number().nullable().optional(),
      score: z.string().nullable().optional(),
      start_order: z.number().nullable().optional(),
      ascents: z.array(ascentSchema).optional()
    }).passthrough()
  )
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
      ascents: Array<{
        sourceRouteId?: number;
        routeName?: string;
        points?: number;
        top?: boolean;
        topTries?: number;
        zone?: boolean;
        zoneTries?: number;
        lowZone?: boolean;
        lowZoneTries?: number;
        status?: string;
      }>;
    }>;
  }>;
  rankingAsOf?: string;
}

export interface IfscParsedCategoryRoundResult {
  sourceCategoryRoundId: number;
  sourceEventId: number;
  sourceDisciplineCategoryId: number;
  eventName: string;
  discipline: string;
  category: string;
  roundName: string;
  status: string;
  boulderPointsSettings?: {
    pointsPerZone?: number;
    pointsPerTop?: number;
    pointsPerLowZone?: number;
    useLowZone?: boolean;
    fallDeduction?: number;
  };
  routes: Array<{
    sourceRouteId: number;
    routeName: string;
  }>;
  rankings: Array<{
    sourceAthleteId: number;
    bibNumber?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    rank?: number;
    score?: string;
    startOrder?: number;
    ascents: Array<{
      sourceRouteId?: number;
      routeName?: string;
      points?: number;
      top?: boolean;
      topTries?: number;
      zone?: boolean;
      zoneTries?: number;
      lowZone?: boolean;
      lowZoneTries?: number;
      status?: string;
    }>;
  }>;
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
        ascentCount: round.ascents?.length ?? 0,
        ascents: round.ascents?.map((ascent) => ({
          sourceRouteId: ascent.route_id ?? undefined,
          routeName: ascent.route_name ?? undefined,
          points: ascent.points ?? undefined,
          top: ascent.top ?? undefined,
          topTries: ascent.top_tries ?? undefined,
          zone: ascent.zone ?? undefined,
          zoneTries: ascent.zone_tries ?? undefined,
          lowZone: ascent.low_zone ?? undefined,
          lowZoneTries: ascent.low_zone_tries ?? undefined,
          status: ascent.status ?? undefined
        })) ?? []
      }))
    })),
    rankingAsOf: optionalString(input.ranking_as_of)
  };
}

export function parseCategoryRoundResultsJson(json: string): IfscParsedCategoryRoundResult {
  const input = categoryRoundResultSchema.parse(parseJsonObject(json));

  return {
    sourceCategoryRoundId: input.id,
    sourceEventId: input.event_id,
    sourceDisciplineCategoryId: input.dcat_id,
    eventName: input.event,
    discipline: input.discipline.toLowerCase(),
    category: input.category,
    roundName: input.round,
    status: input.status,
    boulderPointsSettings: input.points_per_boulder_settings
      ? {
          pointsPerZone: input.points_per_boulder_settings.points_per_zone ?? undefined,
          pointsPerTop: input.points_per_boulder_settings.points_per_top ?? undefined,
          pointsPerLowZone: input.points_per_boulder_settings.points_per_low_zone ?? undefined,
          useLowZone: input.points_per_boulder_settings.use_low_zone ?? undefined,
          fallDeduction: input.points_per_boulder_settings.fall_deduction ?? undefined
        }
      : undefined,
    routes: input.routes?.map((route) => ({
      sourceRouteId: route.id,
      routeName: route.name
    })) ?? [],
    rankings: input.ranking.map((ranking) => ({
      sourceAthleteId: ranking.athlete_id,
      bibNumber: optionalString(ranking.bib),
      name: ranking.name,
      firstName: optionalString(ranking.firstname),
      lastName: optionalString(ranking.lastname),
      country: optionalString(ranking.country),
      rank: ranking.rank ?? undefined,
      score: ranking.score ?? undefined,
      startOrder: ranking.start_order ?? undefined,
      ascents: ranking.ascents?.map((ascent) => ({
        sourceRouteId: ascent.route_id ?? undefined,
        routeName: ascent.route_name ?? undefined,
        points: ascent.points ?? undefined,
        top: ascent.top ?? undefined,
        topTries: ascent.top_tries ?? undefined,
        zone: ascent.zone ?? undefined,
        zoneTries: ascent.zone_tries ?? undefined,
        lowZone: ascent.low_zone ?? undefined,
        lowZoneTries: ascent.low_zone_tries ?? undefined,
        status: ascent.status ?? undefined
      })) ?? []
    }))
  };
}
