import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { normalizeAthlete } from "../normalizeAthlete.js";
import { normalizeBoulderProblemResult } from "../normalizeBoulderProblemResult.js";
import { normalizeCompetition } from "../normalizeCompetition.js";
import { normalizeEvent } from "../normalizeEvent.js";
import { normalizeResult } from "../normalizeResult.js";
import { normalizeRound } from "../normalizeRound.js";
import { normalizeRoundResult } from "../normalizeRoundResult.js";
import { parseEventMetadataJson, parseEventResultJson } from "../../sources/ifsc-results/parseEventJson.js";

interface RepresentativeFixtureExpectation {
  eventId: number;
  metadataUrl: string;
  resultUrl: string;
  competitionName: string;
  season: number;
  location: string;
  rankingCount: number;
  athlete: {
    sourceAthleteId: number;
    name: string;
    country: string;
    rank: number;
    finalScore: string;
    roundScores: Array<{
      roundName: string;
      rank: number;
      score: string;
      startingGroup?: string;
    }>;
    finalAscents: Array<{
      sourceRouteId: string;
      points: number;
      top: boolean;
      topTries: number;
      zone: boolean;
      zoneTries: number;
      lowZone?: boolean;
      lowZoneTries?: number;
    }>;
  };
}

async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`../../sources/ifsc-results/fixtures/${name}`, import.meta.url), "utf8");
}

async function normalizeRepresentativeFixture(expectation: RepresentativeFixtureExpectation) {
  const metadata = parseEventMetadataJson(await readFixture(`event-${expectation.eventId}.json`));
  const result = parseEventResultJson(await readFixture(`event-${expectation.eventId}-result-3.json`));
  const competition = normalizeCompetition({
    name: metadata.name,
    season: Number(metadata.localStartDate?.slice(0, 4)),
    location: metadata.location,
    sourceUrl: expectation.metadataUrl,
    sourceCompetitionId: String(metadata.sourceEventId)
  });
  const event = normalizeEvent({
    name: result.disciplineCategory,
    competitionId: competition.id,
    discipline: result.discipline,
    category: result.category,
    sourceUrl: expectation.resultUrl,
    sourceCompetitionId: String(metadata.sourceEventId)
  });
  const rounds = result.categoryRounds.map((round, index) =>
    normalizeRound({
      eventId: event.id,
      name: round.name,
      order: index,
      sourceUrl: round.resultUrl ? `https://ifsc.results.info${round.resultUrl}` : expectation.resultUrl,
      sourceCategoryRoundId: String(round.sourceCategoryRoundId)
    })
  );
  const roundBySourceId = new Map(result.categoryRounds.map((round, index) => [round.sourceCategoryRoundId, rounds[index]]));
  const firstRanking = result.rankings[0];
  const athlete = normalizeAthlete({
    name: firstRanking.name,
    country: firstRanking.country,
    sourceUrl: expectation.resultUrl,
    sourceAthleteId: String(firstRanking.sourceAthleteId)
  });
  const normalizedResult = normalizeResult({
    eventId: event.id,
    athleteId: athlete.id,
    rank: firstRanking.rank,
    score: firstRanking.rounds.at(-1)?.score,
    sourceUrl: expectation.resultUrl
  });
  const roundResults = firstRanking.rounds.map((round) => {
    const roundRecord = roundBySourceId.get(round.sourceCategoryRoundId);

    if (!roundRecord) {
      throw new Error(`Missing normalized round for source category round ${round.sourceCategoryRoundId}.`);
    }

    return normalizeRoundResult({
      resultId: normalizedResult.id,
      eventId: event.id,
      roundId: roundRecord.id,
      athleteId: athlete.id,
      rank: round.rank,
      score: round.score,
      startingGroup: round.startingGroup,
      sourceUrl: expectation.resultUrl,
      sourceCategoryRoundId: String(round.sourceCategoryRoundId)
    });
  });
  const finalRound = firstRanking.rounds.find((round) => round.roundName === "Final");
  const finalRoundRecord = rounds.find((round) => round.name === "Final");

  if (!finalRound || !finalRoundRecord) {
    throw new Error(`Expected final round data in event ${expectation.eventId} result fixture.`);
  }

  const boulderProblemResults = finalRound.ascents.map((ascent) =>
    normalizeBoulderProblemResult({
      resultId: normalizedResult.id,
      athleteId: athlete.id,
      eventId: event.id,
      roundId: finalRoundRecord.id,
      sourceRouteId: ascent.sourceRouteId ? String(ascent.sourceRouteId) : undefined,
      routeName: ascent.routeName,
      points: ascent.points,
      top: ascent.top,
      topTries: ascent.topTries,
      zone: ascent.zone,
      zoneTries: ascent.zoneTries,
      lowZone: ascent.lowZone,
      lowZoneTries: ascent.lowZoneTries,
      sourceUrl: expectation.resultUrl
    })
  );

  return {
    result,
    competition,
    event,
    rounds,
    athlete,
    normalizedResult,
    roundResults,
    boulderProblemResults
  };
}

describe("normalizing IFSC event JSON fixtures", () => {
  const expectations: RepresentativeFixtureExpectation[] = [
    {
      eventId: 1412,
      metadataUrl: "https://ifsc.results.info/api/v1/events/1412",
      resultUrl: "https://ifsc.results.info/api/v1/events/1412/result/3",
      competitionName: "IFSC World Cup Innsbruck 2025",
      season: 2025,
      location: "Innsbruck, AUT",
      rankingCount: 112,
      athlete: {
        sourceAthleteId: 11490,
        name: "ROBERTS Toby",
        country: "GBR",
        rank: 1,
        finalScore: "69.8",
        roundScores: [
          { roundName: "Qualification", rank: 5, score: "94.6", startingGroup: "Group B" },
          { roundName: "Semi-final", rank: 5, score: "54.1" },
          { roundName: "Final", rank: 1, score: "69.8" }
        ],
        finalAscents: [
          { sourceRouteId: "17071", points: 9.8, top: false, topTries: 5, zone: true, zoneTries: 3 },
          { sourceRouteId: "17072", points: 10, top: false, topTries: 3, zone: true, zoneTries: 1 },
          { sourceRouteId: "17073", points: 25, top: true, topTries: 1, zone: true, zoneTries: 1 },
          { sourceRouteId: "17074", points: 25, top: true, topTries: 1, zone: true, zoneTries: 1 }
        ]
      }
    },
    {
      eventId: 1478,
      metadataUrl: "https://ifsc.results.info/api/v1/events/1478",
      resultUrl: "https://ifsc.results.info/api/v1/events/1478/result/3",
      competitionName: "World Climbing Series Bern 2026",
      season: 2026,
      location: "Bern, Switzerland",
      rankingCount: 78,
      athlete: {
        sourceAthleteId: 13040,
        name: "ANRAKU Sorato",
        country: "JPN",
        rank: 1,
        finalScore: "99.7",
        roundScores: [
          { roundName: "Qualification", rank: 5, score: "108.2", startingGroup: "Group A" },
          { roundName: "Semi-final", rank: 1, score: "74.2" },
          { roundName: "Final", rank: 1, score: "99.7" }
        ],
        finalAscents: [
          { sourceRouteId: "18760", points: 25, top: true, topTries: 1, zone: true, zoneTries: 1, lowZone: true, lowZoneTries: 1 },
          { sourceRouteId: "18761", points: 24.9, top: true, topTries: 2, zone: true, zoneTries: 2, lowZone: true, lowZoneTries: 1 },
          { sourceRouteId: "18762", points: 24.9, top: true, topTries: 2, zone: true, zoneTries: 2, lowZone: true, lowZoneTries: 1 },
          { sourceRouteId: "18763", points: 24.9, top: true, topTries: 2, zone: true, zoneTries: 2, lowZone: true, lowZoneTries: 1 }
        ]
      }
    }
  ];

  it.each(expectations)("turns event $eventId metadata and Boulder Men results into app schema records", async (expectation) => {
    const normalized = await normalizeRepresentativeFixture(expectation);

    expect(normalized.competition).toMatchObject({
      name: expectation.competitionName,
      season: expectation.season,
      location: expectation.location,
      source: "ifsc-results",
      sourceUrl: expectation.metadataUrl,
      sourceCompetitionId: String(expectation.eventId)
    });
    expect(normalized.event).toMatchObject({
      name: "BOULDER Men",
      competitionId: normalized.competition.id,
      discipline: "boulder",
      category: "Men",
      source: "ifsc-results",
      sourceUrl: expectation.resultUrl,
      sourceCompetitionId: String(expectation.eventId)
    });
    expect(normalized.result.rankings).toHaveLength(expectation.rankingCount);
    expect(normalized.rounds).toHaveLength(3);
    expect(normalized.rounds.map((round) => round.name)).toEqual(["Qualification", "Semi-final", "Final"]);
    expect(normalized.athlete).toMatchObject({
      name: expectation.athlete.name,
      country: expectation.athlete.country,
      source: "ifsc-results",
      sourceUrl: expectation.resultUrl,
      sourceAthleteId: String(expectation.athlete.sourceAthleteId)
    });
    expect(normalized.normalizedResult).toMatchObject({
      eventId: normalized.event.id,
      athleteId: normalized.athlete.id,
      rank: expectation.athlete.rank,
      score: expectation.athlete.finalScore,
      source: "ifsc-results",
      sourceUrl: expectation.resultUrl
    });
    expect(normalized.roundResults.map((roundResult) => ({
      rank: roundResult.rank,
      score: roundResult.score,
      startingGroup: roundResult.startingGroup
    }))).toEqual(expectation.athlete.roundScores.map(({ rank, score, startingGroup }) => ({ rank, score, startingGroup })));
    expect(normalized.roundResults.every((roundResult) => roundResult.resultId === normalized.normalizedResult.id)).toBe(true);
    expect(normalized.boulderProblemResults).toHaveLength(4);
    expect(normalized.boulderProblemResults.map((problem) => ({
      sourceRouteId: problem.sourceRouteId,
      points: problem.points,
      top: problem.top,
      topTries: problem.topTries,
      zone: problem.zone,
      zoneTries: problem.zoneTries,
      lowZone: problem.lowZone,
      lowZoneTries: problem.lowZoneTries
    }))).toEqual(expectation.athlete.finalAscents);
  });
});
