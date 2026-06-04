import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeIfscBoulderingEventResult } from "../normalize/normalizeIfscEventResult.js";
import { parseEventMetadataJson, parseEventResultJson } from "../sources/ifsc-results/parseEventJson.js";
import { IFSC_JSON_FIXTURE_DIR } from "./saveJsonFixture.js";

export interface ReportFixtureOptions {
  eventId: number;
  resultId: number;
}

export interface BooleanCountSummary {
  true: number;
  false: number;
  absent: number;
}

export interface AscentCountSummary {
  attempts: number;
  top: BooleanCountSummary;
  zone: BooleanCountSummary;
  lowZone: BooleanCountSummary;
}

export interface NormalizedFixtureReport {
  eventId: number;
  resultId: number;
  competition: string;
  location?: string;
  disciplineCategory: string;
  discipline: string;
  category: string;
  roundNames: string[];
  counts: {
    athletes: number;
    results: number;
    roundResults: number;
    boulderProblems: number;
    boulderProblemResults: number;
    unrankedResults: number;
  };
  lowZoneCounts: {
    true: number;
    false: number;
    absent: number;
  };
  ascentCounts: AscentCountSummary;
  roundSummaries: Array<{
    roundName: string;
    athletes: number;
    attempts: number;
    routeInventory: number;
    ascentCounts: AscentCountSummary;
  }>;
  boulderSummaries: Array<{
    roundName: string;
    startingGroup?: string;
    routeName?: string;
    sourceRouteId?: string;
    attempts: number;
    topRate: number;
    zoneRate: number;
    lowZoneRate?: number;
    ascentCounts: AscentCountSummary;
  }>;
  qualification: {
    athleteAscentCounts: number[];
    routeInventory: number;
    routeSets: Array<{
      startingGroup?: string;
      athleteCount: number;
      routeCount: number;
      routeNames: string[];
      sourceRouteIds: string[];
    }>;
  };
}

function usage(): string {
  return [
    "Usage: pnpm report:fixture -- --event <event-id> --result <result-id>",
    "",
    "Reads cached IFSC JSON fixtures from src/sources/ifsc-results/fixtures and prints normalized counts.",
    "This command does not fetch live network data."
  ].join("\n");
}

function parsePositiveInteger(value: string | undefined, name: string): number {
  if (!value || !/^[0-9]+$/.test(value)) {
    throw new Error(`${name} must be a positive integer.`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

export function parseReportFixtureArgs(args: string[]): ReportFixtureOptions {
  let eventId: number | undefined;
  let resultId: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    } else if (arg === "--event") {
      eventId = parsePositiveInteger(args[index + 1], "--event");
      index += 1;
    } else if (arg === "--result") {
      resultId = parsePositiveInteger(args[index + 1], "--result");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      throw new Error(usage());
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }

  if (!eventId || !resultId) {
    throw new Error(`Missing required --event or --result argument.\n\n${usage()}`);
  }

  return { eventId, resultId };
}

function uniqueSortedNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en"));
}

function emptyBooleanCountSummary(): BooleanCountSummary {
  return {
    true: 0,
    false: 0,
    absent: 0
  };
}

function emptyAscentCountSummary(): AscentCountSummary {
  return {
    attempts: 0,
    top: emptyBooleanCountSummary(),
    zone: emptyBooleanCountSummary(),
    lowZone: emptyBooleanCountSummary()
  };
}

function addBooleanValue(counts: BooleanCountSummary, value: boolean | undefined): void {
  if (value === true) {
    counts.true += 1;
  } else if (value === false) {
    counts.false += 1;
  } else {
    counts.absent += 1;
  }
}

function addAscentCounts(
  counts: AscentCountSummary,
  ascent: {
    top?: boolean;
    zone?: boolean;
    lowZone?: boolean;
  }
): void {
  counts.attempts += 1;
  addBooleanValue(counts.top, ascent.top);
  addBooleanValue(counts.zone, ascent.zone);
  addBooleanValue(counts.lowZone, ascent.lowZone);
}

function rate(trueCount: number, attempts: number): number {
  if (attempts === 0) {
    return 0;
  }

  return Number((trueCount / attempts).toFixed(4));
}

export async function createNormalizedFixtureReport(options: ReportFixtureOptions): Promise<NormalizedFixtureReport> {
  const metadataFixture = join(process.cwd(), IFSC_JSON_FIXTURE_DIR, `event-${options.eventId}.json`);
  const resultFixture = join(process.cwd(), IFSC_JSON_FIXTURE_DIR, `event-${options.eventId}-result-${options.resultId}.json`);
  const metadata = parseEventMetadataJson(await readFile(metadataFixture, "utf8"));
  const result = parseEventResultJson(await readFile(resultFixture, "utf8"));
  const normalized = normalizeIfscBoulderingEventResult({
    metadata,
    result,
    metadataSourceUrl: `https://ifsc.results.info/api/v1/events/${options.eventId}`,
    resultSourceUrl: `https://ifsc.results.info/api/v1/events/${options.eventId}/result/${options.resultId}`
  });
  const lowZoneCounts = normalized.boulderProblemResults.reduce(
    (counts, problem) => {
      if (problem.lowZone === true) {
        counts.true += 1;
      } else if (problem.lowZone === false) {
        counts.false += 1;
      } else {
        counts.absent += 1;
      }

      return counts;
    },
    { true: 0, false: 0, absent: 0 }
  );
  const qualificationRounds = result.rankings.flatMap((ranking) => {
    const qualificationRound = ranking.rounds.find((round) => round.roundName === "Qualification");

    return qualificationRound ? [qualificationRound] : [];
  });
  const routeSetsByGroup = new Map<
    string,
    {
      startingGroup?: string;
      athleteCount: number;
      routeNames: string[];
      sourceRouteIds: string[];
    }
  >();

  for (const qualificationRound of qualificationRounds) {
    const key = qualificationRound.startingGroup ?? "";
    const routeSet = routeSetsByGroup.get(key) ?? {
      startingGroup: qualificationRound.startingGroup,
      athleteCount: 0,
      routeNames: [],
      sourceRouteIds: []
    };

    routeSet.athleteCount += 1;

    for (const ascent of qualificationRound.ascents) {
      if (ascent.routeName) {
        routeSet.routeNames.push(ascent.routeName);
      }

      if (ascent.sourceRouteId) {
        routeSet.sourceRouteIds.push(String(ascent.sourceRouteId));
      }
    }

    routeSetsByGroup.set(key, routeSet);
  }

  const qualificationRouteSets = [...routeSetsByGroup.values()]
    .map((routeSet) => {
      const sourceRouteIds = uniqueSortedStrings(routeSet.sourceRouteIds);

      return {
        startingGroup: routeSet.startingGroup,
        athleteCount: routeSet.athleteCount,
        routeCount: sourceRouteIds.length,
        routeNames: uniqueSortedStrings(routeSet.routeNames),
        sourceRouteIds
      };
    })
    .sort((left, right) => (left.startingGroup ?? "").localeCompare(right.startingGroup ?? "", "en"));
  const qualificationRouteInventory = uniqueSortedStrings(
    qualificationRouteSets.flatMap((routeSet) => routeSet.sourceRouteIds)
  ).length;
  const ascentCounts = emptyAscentCountSummary();
  const roundSummaryByName = new Map<
    string,
    {
      roundName: string;
      athleteIds: Set<number>;
      sourceRouteIds: Set<string>;
      ascentCounts: AscentCountSummary;
    }
  >();
  const boulderSummaryByKey = new Map<
    string,
    {
      roundName: string;
      startingGroup?: string;
      routeName?: string;
      sourceRouteId?: string;
      ascentCounts: AscentCountSummary;
    }
  >();

  for (const ranking of result.rankings) {
    for (const round of ranking.rounds) {
      const roundSummary = roundSummaryByName.get(round.roundName) ?? {
        roundName: round.roundName,
        athleteIds: new Set<number>(),
        sourceRouteIds: new Set<string>(),
        ascentCounts: emptyAscentCountSummary()
      };
      roundSummary.athleteIds.add(ranking.sourceAthleteId);

      for (const ascent of round.ascents) {
        addAscentCounts(ascentCounts, ascent);
        addAscentCounts(roundSummary.ascentCounts, ascent);

        if (ascent.sourceRouteId) {
          roundSummary.sourceRouteIds.add(String(ascent.sourceRouteId));
        }

        const boulderKey = [
          round.roundName,
          round.startingGroup ?? "",
          ascent.sourceRouteId ? String(ascent.sourceRouteId) : "",
          ascent.routeName ?? ""
        ].join("|");
        const boulderSummary = boulderSummaryByKey.get(boulderKey) ?? {
          roundName: round.roundName,
          startingGroup: round.startingGroup,
          routeName: ascent.routeName,
          sourceRouteId: ascent.sourceRouteId ? String(ascent.sourceRouteId) : undefined,
          ascentCounts: emptyAscentCountSummary()
        };

        addAscentCounts(boulderSummary.ascentCounts, ascent);
        boulderSummaryByKey.set(boulderKey, boulderSummary);
      }

      roundSummaryByName.set(round.roundName, roundSummary);
    }
  }
  const roundOrder = new Map(result.categoryRounds.map((round, index) => [round.name, index]));
  const roundSummaries = [...roundSummaryByName.values()]
    .map((roundSummary) => ({
      roundName: roundSummary.roundName,
      athletes: roundSummary.athleteIds.size,
      attempts: roundSummary.ascentCounts.attempts,
      routeInventory: roundSummary.sourceRouteIds.size,
      ascentCounts: roundSummary.ascentCounts
    }))
    .sort((left, right) => (roundOrder.get(left.roundName) ?? 999) - (roundOrder.get(right.roundName) ?? 999));
  const boulderSummaries = [...boulderSummaryByKey.values()]
    .map((boulderSummary) => ({
      roundName: boulderSummary.roundName,
      startingGroup: boulderSummary.startingGroup,
      routeName: boulderSummary.routeName,
      sourceRouteId: boulderSummary.sourceRouteId,
      attempts: boulderSummary.ascentCounts.attempts,
      topRate: rate(boulderSummary.ascentCounts.top.true, boulderSummary.ascentCounts.attempts),
      zoneRate: rate(boulderSummary.ascentCounts.zone.true, boulderSummary.ascentCounts.attempts),
      lowZoneRate:
        boulderSummary.ascentCounts.lowZone.absent === boulderSummary.ascentCounts.attempts
          ? undefined
          : rate(boulderSummary.ascentCounts.lowZone.true, boulderSummary.ascentCounts.attempts),
      ascentCounts: boulderSummary.ascentCounts
    }))
    .sort((left, right) => {
      const roundCompare = (roundOrder.get(left.roundName) ?? 999) - (roundOrder.get(right.roundName) ?? 999);

      if (roundCompare !== 0) {
        return roundCompare;
      }

      const groupCompare = (left.startingGroup ?? "").localeCompare(right.startingGroup ?? "", "en");

      if (groupCompare !== 0) {
        return groupCompare;
      }

      return (left.routeName ?? "").localeCompare(right.routeName ?? "", "en", { numeric: true });
    });

  return {
    eventId: options.eventId,
    resultId: options.resultId,
    competition: normalized.competition.name,
    location: normalized.competition.location,
    disciplineCategory: normalized.event.name,
    discipline: result.discipline,
    category: result.category,
    roundNames: normalized.rounds.map((round) => round.name),
    counts: {
      athletes: normalized.athletes.length,
      results: normalized.results.length,
      roundResults: normalized.roundResults.length,
      boulderProblems: normalized.boulderProblems.length,
      boulderProblemResults: normalized.boulderProblemResults.length,
      unrankedResults: normalized.results.filter((resultRecord) => resultRecord.rank === undefined).length
    },
    lowZoneCounts,
    ascentCounts,
    roundSummaries,
    boulderSummaries,
    qualification: {
      athleteAscentCounts: uniqueSortedNumbers(qualificationRounds.map((round) => round.ascentCount)),
      routeInventory: qualificationRouteInventory,
      routeSets: qualificationRouteSets
    }
  };
}

async function main(): Promise<void> {
  const options = parseReportFixtureArgs(process.argv.slice(2));
  const report = await createNormalizedFixtureReport(options);

  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to report fixture: ${message}`);
    process.exitCode = 1;
  });
}
