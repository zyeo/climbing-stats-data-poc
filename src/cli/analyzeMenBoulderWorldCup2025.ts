import { pathToFileURL } from "node:url";
import { normalizeMenBoulderWorldCup2025ManifestEvents } from "../experiments/menBoulderWorldCup2025.js";

interface CountSummary {
  attempts: number;
  tops: number;
  zones: number;
  lowZones: number;
  lowZoneAbsent: number;
}

export interface MenBoulderWorldCup2025Analysis {
  experimentId: "2025-men-boulder-world-cup";
  eventCount: number;
  totals: {
    athleteEventResults: number;
    roundResults: number;
    boulderProblems: number;
    boulderProblemResults: number;
    tops: number;
    zones: number;
    lowZones: number;
    lowZoneAbsent: number;
  };
  qualificationShapes: Array<{
    eventId: number;
    competition: string;
    athletes: number;
    routeInventory: number;
    athleteAscentCounts: number[];
    startingGroups: string[];
  }>;
  perEvent: Array<{
    eventId: number;
    competition: string;
    location?: string;
    athletes: number;
    boulderProblemResults: number;
    topRate: number;
    zoneRate: number;
    roundSummaries: Array<{
      roundName: string;
      attempts: number;
      topRate: number;
      zoneRate: number;
    }>;
  }>;
  repeatedAthletes: {
    uniqueAthletes: number;
    multiEventAthletes: number;
    maxEventsByAthlete: number;
  };
}

function emptyCountSummary(): CountSummary {
  return {
    attempts: 0,
    tops: 0,
    zones: 0,
    lowZones: 0,
    lowZoneAbsent: 0
  };
}

function rate(count: number, attempts: number): number {
  if (attempts === 0) {
    return 0;
  }

  return Number((count / attempts).toFixed(4));
}

function uniqueSortedNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en"));
}

export async function createMenBoulderWorldCup2025Analysis(): Promise<MenBoulderWorldCup2025Analysis> {
  const entries = await normalizeMenBoulderWorldCup2025ManifestEvents();
  const totals = {
    athleteEventResults: 0,
    roundResults: 0,
    boulderProblems: 0,
    boulderProblemResults: 0,
    tops: 0,
    zones: 0,
    lowZones: 0,
    lowZoneAbsent: 0
  };
  const athleteEventCounts = new Map<string, number>();

  const perEvent = entries.map((entry) => {
    const eventCounts = emptyCountSummary();
    const roundCounts = new Map<string, CountSummary>();
    const roundNameById = new Map(entry.normalized.rounds.map((round) => [round.id, round.name]));

    totals.athleteEventResults += entry.normalized.results.length;
    totals.roundResults += entry.normalized.roundResults.length;
    totals.boulderProblems += entry.normalized.boulderProblems.length;
    totals.boulderProblemResults += entry.normalized.boulderProblemResults.length;

    for (const athlete of entry.normalized.athletes) {
      const key = athlete.sourceAthleteId ?? athlete.id;
      athleteEventCounts.set(key, (athleteEventCounts.get(key) ?? 0) + 1);
    }

    for (const result of entry.normalized.boulderProblemResults) {
      const roundName = roundNameById.get(result.roundId) ?? "Unknown";
      const roundSummary = roundCounts.get(roundName) ?? emptyCountSummary();

      eventCounts.attempts += 1;
      roundSummary.attempts += 1;

      if (result.top === true) {
        eventCounts.tops += 1;
        roundSummary.tops += 1;
      }

      if (result.zone === true) {
        eventCounts.zones += 1;
        roundSummary.zones += 1;
      }

      if (result.lowZone === true) {
        eventCounts.lowZones += 1;
        roundSummary.lowZones += 1;
      } else if (result.lowZone === undefined) {
        eventCounts.lowZoneAbsent += 1;
        roundSummary.lowZoneAbsent += 1;
      }

      roundCounts.set(roundName, roundSummary);
    }

    totals.tops += eventCounts.tops;
    totals.zones += eventCounts.zones;
    totals.lowZones += eventCounts.lowZones;
    totals.lowZoneAbsent += eventCounts.lowZoneAbsent;

    return {
      eventId: entry.manifestEvent.eventId,
      competition: entry.normalized.competition.name,
      location: entry.normalized.competition.location,
      athletes: entry.normalized.results.length,
      boulderProblemResults: entry.normalized.boulderProblemResults.length,
      topRate: rate(eventCounts.tops, eventCounts.attempts),
      zoneRate: rate(eventCounts.zones, eventCounts.attempts),
      roundSummaries: [...roundCounts.entries()].map(([roundName, counts]) => ({
        roundName,
        attempts: counts.attempts,
        topRate: rate(counts.tops, counts.attempts),
        zoneRate: rate(counts.zones, counts.attempts)
      }))
    };
  });

  const qualificationShapes = entries.map((entry) => {
    const qualificationRouteIds = new Set<number>();
    const athleteAscentCounts: number[] = [];
    const startingGroups: string[] = [];

    for (const ranking of entry.result.rankings) {
      const qualificationRound = ranking.rounds.find((round) => round.roundName === "Qualification");

      if (!qualificationRound) {
        continue;
      }

      athleteAscentCounts.push(qualificationRound.ascentCount);

      if (qualificationRound.startingGroup) {
        startingGroups.push(qualificationRound.startingGroup);
      }

      for (const ascent of qualificationRound.ascents) {
        if (ascent.sourceRouteId) {
          qualificationRouteIds.add(ascent.sourceRouteId);
        }
      }
    }

    return {
      eventId: entry.manifestEvent.eventId,
      competition: entry.normalized.competition.name,
      athletes: entry.normalized.results.length,
      routeInventory: qualificationRouteIds.size,
      athleteAscentCounts: uniqueSortedNumbers(athleteAscentCounts),
      startingGroups: uniqueSortedStrings(startingGroups)
    };
  });
  const athleteEventCountValues = [...athleteEventCounts.values()];

  return {
    experimentId: "2025-men-boulder-world-cup",
    eventCount: entries.length,
    totals,
    qualificationShapes,
    perEvent,
    repeatedAthletes: {
      uniqueAthletes: athleteEventCounts.size,
      multiEventAthletes: athleteEventCountValues.filter((count) => count > 1).length,
      maxEventsByAthlete: Math.max(...athleteEventCountValues)
    }
  };
}

async function main(): Promise<void> {
  const analysis = await createMenBoulderWorldCup2025Analysis();

  console.log(JSON.stringify(analysis, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze 2025 Men Boulder World Cup fixtures: ${message}`);
    process.exitCode = 1;
  });
}
