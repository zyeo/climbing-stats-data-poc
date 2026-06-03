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
    lowZoneCounts
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
