import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { normalizeAthlete } from "../normalizeAthlete.js";
import { normalizeBoulderProblemResult } from "../normalizeBoulderProblemResult.js";
import { normalizeCompetition } from "../normalizeCompetition.js";
import { normalizeEvent } from "../normalizeEvent.js";
import { normalizeResult } from "../normalizeResult.js";
import { normalizeRound } from "../normalizeRound.js";
import { parseEventMetadataJson, parseEventResultJson } from "../../sources/ifsc-results/parseEventJson.js";

const eventMetadataSourceUrl = "https://ifsc.results.info/api/v1/events/1412";
const eventResultSourceUrl = "https://ifsc.results.info/api/v1/events/1412/result/3";

async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`../../sources/ifsc-results/fixtures/${name}`, import.meta.url), "utf8");
}

describe("normalizing IFSC event JSON fixtures", () => {
  it("turns event 1412 metadata and Boulder Men results into minimal app schema records", async () => {
    const metadata = parseEventMetadataJson(await readFixture("event-1412.json"));
    const result = parseEventResultJson(await readFixture("event-1412-result-3.json"));
    const season = Number(metadata.localStartDate?.slice(0, 4));

    const competition = normalizeCompetition({
      name: metadata.name,
      season,
      location: metadata.location,
      sourceUrl: eventMetadataSourceUrl,
      sourceCompetitionId: String(metadata.sourceEventId)
    });
    const event = normalizeEvent({
      name: result.disciplineCategory,
      competitionId: competition.id,
      discipline: result.discipline,
      category: result.category,
      sourceUrl: eventResultSourceUrl,
      sourceCompetitionId: String(metadata.sourceEventId)
    });
    const rounds = result.categoryRounds.map((round, index) =>
      normalizeRound({
        eventId: event.id,
        name: round.name,
        order: index,
        sourceUrl: round.resultUrl ? `https://ifsc.results.info${round.resultUrl}` : eventResultSourceUrl,
        sourceCategoryRoundId: String(round.sourceCategoryRoundId)
      })
    );
    const firstRanking = result.rankings[0];
    const athlete = normalizeAthlete({
      name: firstRanking.name,
      country: firstRanking.country,
      sourceUrl: eventResultSourceUrl,
      sourceAthleteId: String(firstRanking.sourceAthleteId)
    });
    const normalizedResult = normalizeResult({
      eventId: event.id,
      athleteId: athlete.id,
      rank: firstRanking.rank,
      score: firstRanking.rounds.at(-1)?.score,
      sourceUrl: eventResultSourceUrl
    });
    const finalRound = firstRanking.rounds.find((round) => round.roundName === "Final");
    const finalRoundRecord = rounds.find((round) => round.name === "Final");

    if (!finalRound || !finalRoundRecord) {
      throw new Error("Expected final round data in event 1412 result fixture.");
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
        sourceUrl: eventResultSourceUrl
      })
    );

    expect(competition).toMatchObject({
      name: "IFSC World Cup Innsbruck 2025",
      season: 2025,
      location: "Innsbruck, AUT",
      source: "ifsc-results",
      sourceUrl: eventMetadataSourceUrl,
      sourceCompetitionId: "1412"
    });
    expect(event).toMatchObject({
      name: "BOULDER Men",
      competitionId: competition.id,
      discipline: "boulder",
      category: "Men",
      source: "ifsc-results",
      sourceUrl: eventResultSourceUrl,
      sourceCompetitionId: "1412"
    });
    expect(rounds).toHaveLength(3);
    expect(rounds.map((round) => round.name)).toEqual(["Qualification", "Semi-final", "Final"]);
    expect(rounds.every((round) => round.eventId === event.id)).toBe(true);
    expect(athlete).toMatchObject({
      name: "ROBERTS Toby",
      country: "GBR",
      source: "ifsc-results",
      sourceUrl: eventResultSourceUrl,
      sourceAthleteId: "11490"
    });
    expect(normalizedResult).toMatchObject({
      eventId: event.id,
      athleteId: athlete.id,
      rank: 1,
      score: "69.8",
      source: "ifsc-results",
      sourceUrl: eventResultSourceUrl
    });
    expect(boulderProblemResults).toHaveLength(4);
    expect(boulderProblemResults.map((problem) => problem.sourceRouteId)).toEqual(["17071", "17072", "17073", "17074"]);
    expect(boulderProblemResults.map((problem) => problem.points)).toEqual([9.8, 10, 25, 25]);
    expect(boulderProblemResults.map((problem) => problem.top)).toEqual([false, false, true, true]);
    expect(boulderProblemResults.map((problem) => problem.topTries)).toEqual([5, 3, 1, 1]);
    expect(boulderProblemResults.map((problem) => problem.zone)).toEqual([true, true, true, true]);
    expect(boulderProblemResults.map((problem) => problem.zoneTries)).toEqual([3, 1, 1, 1]);
    expect(boulderProblemResults.every((problem) => problem.resultId === normalizedResult.id)).toBe(true);
    expect(boulderProblemResults.every((problem) => problem.roundId === finalRoundRecord.id)).toBe(true);
  });
});
