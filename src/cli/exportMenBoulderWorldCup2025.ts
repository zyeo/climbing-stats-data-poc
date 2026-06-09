import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeMenBoulderWorldCup2025ManifestEvents } from "../experiments/menBoulderWorldCup2025.js";

export const MEN_BOULDER_WORLD_CUP_2025_EXPORT_DIR = "analysis/data/generated/2025-men-boulder-world-cup";

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

interface CsvTable {
  filename: string;
  columns: string[];
  rows: CsvRow[];
}

export interface MenBoulderWorldCup2025ExportSummary {
  outputDir: string;
  files: Array<{
    filename: string;
    rows: number;
  }>;
}

function csvCell(value: CsvValue): string {
  if (value === undefined || value === null) {
    return "";
  }

  const serialized = String(value);

  if (/[",\n\r]/.test(serialized)) {
    return `"${serialized.replaceAll('"', '""')}"`;
  }

  return serialized;
}

export function serializeCsv(columns: string[], rows: CsvRow[]): string {
  const lines = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))
  ];

  return `${lines.join("\n")}\n`;
}

export async function createMenBoulderWorldCup2025ExportTables(): Promise<CsvTable[]> {
  const entries = await normalizeMenBoulderWorldCup2025ManifestEvents();
  const competitionById = new Map<string, CsvRow>();
  const eventById = new Map<string, CsvRow>();
  const athleteById = new Map<string, CsvRow>();
  const rounds: CsvRow[] = [];
  const eventResults: CsvRow[] = [];
  const roundResults: CsvRow[] = [];
  const boulderProblems: CsvRow[] = [];
  const boulderProblemResults: CsvRow[] = [];

  for (const entry of entries) {
    const { competition, event } = entry.normalized;

    competitionById.set(competition.id, {
      competition_id: competition.id,
      source_competition_id: competition.sourceCompetitionId,
      name: competition.name,
      season: competition.season,
      location: competition.location,
      source: competition.source,
      source_url: competition.sourceUrl
    });
    eventById.set(event.id, {
      event_id: event.id,
      competition_id: event.competitionId,
      source_event_id: event.sourceEventId,
      source_competition_id: event.sourceCompetitionId,
      name: event.name,
      discipline: event.discipline,
      category: event.category,
      source: event.source,
      source_url: event.sourceUrl
    });

    for (const athlete of entry.normalized.athletes) {
      if (!athleteById.has(athlete.id)) {
        athleteById.set(athlete.id, {
          athlete_id: athlete.id,
          source_athlete_id: athlete.sourceAthleteId,
          name: athlete.name,
          country: athlete.country,
          source: athlete.source,
          source_url: athlete.sourceUrl
        });
      }
    }

    for (const round of entry.normalized.rounds) {
      rounds.push({
        round_id: round.id,
        event_id: round.eventId,
        source_category_round_id: round.sourceCategoryRoundId,
        name: round.name,
        round_order: round.order,
        source: round.source,
        source_url: round.sourceUrl
      });
    }

    for (const result of entry.normalized.results) {
      eventResults.push({
        result_id: result.id,
        event_id: result.eventId,
        athlete_id: result.athleteId,
        source_event_id: result.sourceEventId,
        source_athlete_id: result.sourceAthleteId,
        rank: result.rank,
        score: result.score,
        source: result.source,
        source_url: result.sourceUrl
      });
    }

    for (const result of entry.normalized.roundResults) {
      roundResults.push({
        round_result_id: result.id,
        result_id: result.resultId,
        event_id: result.eventId,
        round_id: result.roundId,
        athlete_id: result.athleteId,
        source_category_round_id: result.sourceCategoryRoundId,
        rank: result.rank,
        score: result.score,
        starting_group: result.startingGroup,
        start_order: result.startOrder,
        source: result.source,
        source_url: result.sourceUrl
      });
    }

    for (const problem of entry.normalized.boulderProblems) {
      boulderProblems.push({
        boulder_problem_id: problem.id,
        event_id: problem.eventId,
        round_id: problem.roundId,
        source_category_round_id: problem.sourceCategoryRoundId,
        source_route_id: problem.sourceRouteId,
        route_name: problem.routeName,
        source: problem.source,
        source_url: problem.sourceUrl
      });
    }

    for (const result of entry.normalized.boulderProblemResults) {
      boulderProblemResults.push({
        boulder_problem_result_id: result.id,
        result_id: result.resultId,
        boulder_problem_id: result.boulderProblemId,
        athlete_id: result.athleteId,
        event_id: result.eventId,
        round_id: result.roundId,
        source_category_round_id: result.sourceCategoryRoundId,
        source_route_id: result.sourceRouteId,
        route_name: result.routeName,
        points: result.points,
        top: result.top,
        top_tries: result.topTries,
        zone: result.zone,
        zone_tries: result.zoneTries,
        low_zone: result.lowZone,
        low_zone_tries: result.lowZoneTries,
        source: result.source,
        source_url: result.sourceUrl
      });
    }
  }

  return [
    {
      filename: "competitions.csv",
      columns: ["competition_id", "source_competition_id", "name", "season", "location", "source", "source_url"],
      rows: [...competitionById.values()]
    },
    {
      filename: "events.csv",
      columns: [
        "event_id",
        "competition_id",
        "source_event_id",
        "source_competition_id",
        "name",
        "discipline",
        "category",
        "source",
        "source_url"
      ],
      rows: [...eventById.values()]
    },
    {
      filename: "athletes.csv",
      columns: ["athlete_id", "source_athlete_id", "name", "country", "source", "source_url"],
      rows: [...athleteById.values()]
    },
    {
      filename: "rounds.csv",
      columns: ["round_id", "event_id", "source_category_round_id", "name", "round_order", "source", "source_url"],
      rows: rounds
    },
    {
      filename: "event_results.csv",
      columns: [
        "result_id",
        "event_id",
        "athlete_id",
        "source_event_id",
        "source_athlete_id",
        "rank",
        "score",
        "source",
        "source_url"
      ],
      rows: eventResults
    },
    {
      filename: "round_results.csv",
      columns: [
        "round_result_id",
        "result_id",
        "event_id",
        "round_id",
        "athlete_id",
        "source_category_round_id",
        "rank",
        "score",
        "starting_group",
        "start_order",
        "source",
        "source_url"
      ],
      rows: roundResults
    },
    {
      filename: "boulder_problems.csv",
      columns: [
        "boulder_problem_id",
        "event_id",
        "round_id",
        "source_category_round_id",
        "source_route_id",
        "route_name",
        "source",
        "source_url"
      ],
      rows: boulderProblems
    },
    {
      filename: "boulder_problem_results.csv",
      columns: [
        "boulder_problem_result_id",
        "result_id",
        "boulder_problem_id",
        "athlete_id",
        "event_id",
        "round_id",
        "source_category_round_id",
        "source_route_id",
        "route_name",
        "points",
        "top",
        "top_tries",
        "zone",
        "zone_tries",
        "low_zone",
        "low_zone_tries",
        "source",
        "source_url"
      ],
      rows: boulderProblemResults
    }
  ];
}

export async function exportMenBoulderWorldCup2025(
  outputDir = MEN_BOULDER_WORLD_CUP_2025_EXPORT_DIR
): Promise<MenBoulderWorldCup2025ExportSummary> {
  const resolvedOutputDir = resolve(process.cwd(), outputDir);
  const tables = await createMenBoulderWorldCup2025ExportTables();

  await mkdir(resolvedOutputDir, { recursive: true });

  for (const table of tables) {
    await writeFile(join(resolvedOutputDir, table.filename), serializeCsv(table.columns, table.rows), "utf8");
  }

  return {
    outputDir: resolvedOutputDir,
    files: tables.map((table) => ({
      filename: table.filename,
      rows: table.rows.length
    }))
  };
}

async function main(): Promise<void> {
  const summary = await exportMenBoulderWorldCup2025();

  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to export 2025 Men Boulder World Cup fixtures: ${message}`);
    process.exitCode = 1;
  });
}
