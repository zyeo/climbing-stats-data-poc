import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCategoryRoundResultsJson, parseEventMetadataJson, parseEventResultJson } from "../parseEventJson.js";

async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

describe("parseEventMetadataJson", () => {
  it("parses stable event metadata from the event 1412 fixture", async () => {
    const parsed = parseEventMetadataJson(await readFixture("event-1412.json"));

    expect(parsed).toEqual({
      sourceEventId: 1412,
      name: "IFSC World Cup Innsbruck 2025",
      location: "Innsbruck, AUT",
      country: "AUT",
      localStartDate: "2025-06-25",
      localEndDate: "2025-06-29",
      disciplines: ["boulder", "lead"],
      disciplineCategoryCount: 4,
      roundCount: 6
    });
  });

  it("parses stable event metadata from the older event 1405 fixture", async () => {
    const parsed = parseEventMetadataJson(await readFixture("event-1405.json"));

    expect(parsed).toEqual({
      sourceEventId: 1405,
      name: "IFSC World Cup Keqiao 2025",
      location: "Keqiao, CHN",
      country: "CHN",
      localStartDate: "2025-04-18",
      localEndDate: "2025-04-20",
      disciplines: ["boulder"],
      disciplineCategoryCount: 2,
      roundCount: 3
    });
  });

  it("throws for invalid JSON", () => {
    expect(() => parseEventMetadataJson("not-json")).toThrow("Expected valid JSON.");
  });
});

describe("parseEventResultJson", () => {
  it.each([
    {
      fixture: "event-1412-result-3.json",
      eventName: "IFSC World Cup Innsbruck 2025",
      disciplineCategory: "BOULDER Men",
      category: "Men",
      roundIds: [9399, 10119, 10121],
      rankingCount: 112
    },
    {
      fixture: "event-1478-result-7.json",
      eventName: "World Climbing Series Bern 2026",
      disciplineCategory: "BOULDER Women",
      category: "Women",
      roundIds: [10379, 10666, 10668],
      rankingCount: 75
    },
    {
      fixture: "event-1405-result-3.json",
      eventName: "IFSC World Cup Keqiao 2025",
      disciplineCategory: "BOULDER Men",
      category: "Men",
      roundIds: [9381, 9953, 9955],
      rankingCount: 68
    },
    {
      fixture: "event-1405-result-7.json",
      eventName: "IFSC World Cup Keqiao 2025",
      disciplineCategory: "BOULDER Women",
      category: "Women",
      roundIds: [9382, 9954, 9956],
      rankingCount: 58
    }
  ])("parses $disciplineCategory result summary from $fixture", async (expectation) => {
    const parsed = parseEventResultJson(await readFixture(expectation.fixture));

    expect(parsed.eventName).toBe(expectation.eventName);
    expect(parsed.disciplineCategory).toBe(expectation.disciplineCategory);
    expect(parsed.discipline).toBe("boulder");
    expect(parsed.category).toBe(expectation.category);
    expect(parsed.status).toBe("finished");
    expect(parsed.categoryRounds.map((round) => round.name)).toEqual(["Qualification", "Semi-final", "Final"]);
    expect(parsed.categoryRounds.map((round) => round.sourceCategoryRoundId)).toEqual(expectation.roundIds);
    expect(parsed.categoryRounds.every((round) => round.kind === "boulder")).toBe(true);
    expect(parsed.categoryRounds.every((round) => round.category === expectation.category)).toBe(true);
    expect(parsed.rankings).toHaveLength(expectation.rankingCount);
  });

  it("parses the first-ranked athlete and per-round scores from the event 1412 result fixture", async () => {
    const parsed = parseEventResultJson(await readFixture("event-1412-result-3.json"));

    expect(parsed.rankings[0]).toEqual({
      sourceAthleteId: 11490,
      bibNumber: "105",
      name: "ROBERTS Toby",
      firstName: "Toby",
      lastName: "ROBERTS",
      country: "GBR",
      rank: 1,
      rounds: [
        {
          sourceCategoryRoundId: 9399,
          roundName: "Qualification",
          rank: 5,
          score: "94.6",
          startingGroup: "Group B",
          ascentCount: 5,
          ascents: expect.any(Array)
        },
        {
          sourceCategoryRoundId: 10119,
          roundName: "Semi-final",
          rank: 5,
          score: "54.1",
          startingGroup: undefined,
          ascentCount: 4,
          ascents: expect.any(Array)
        },
        {
          sourceCategoryRoundId: 10121,
          roundName: "Final",
          rank: 1,
          score: "69.8",
          startingGroup: undefined,
          ascentCount: 4,
          ascents: [
            {
              sourceRouteId: 17071,
              routeName: "1",
              points: 9.8,
              top: false,
              topTries: 5,
              zone: true,
              zoneTries: 3,
              lowZone: undefined,
              lowZoneTries: undefined,
              status: "locked"
            },
            {
              sourceRouteId: 17072,
              routeName: "2",
              points: 10,
              top: false,
              topTries: 3,
              zone: true,
              zoneTries: 1,
              lowZone: undefined,
              lowZoneTries: undefined,
              status: "locked"
            },
            {
              sourceRouteId: 17073,
              routeName: "3",
              points: 25,
              top: true,
              topTries: 1,
              zone: true,
              zoneTries: 1,
              lowZone: undefined,
              lowZoneTries: undefined,
              status: "locked"
            },
            {
              sourceRouteId: 17074,
              routeName: "4",
              points: 25,
              top: true,
              topTries: 1,
              zone: true,
              zoneTries: 1,
              lowZone: undefined,
              lowZoneTries: undefined,
              status: "locked"
            }
          ]
        }
      ]
    });
  });
});

describe("parseCategoryRoundResultsJson", () => {
  it("parses a single Women Boulder final-round result fixture", async () => {
    const parsed = parseCategoryRoundResultsJson(await readFixture("category-round-10668-results.json"));

    expect(parsed).toMatchObject({
      sourceCategoryRoundId: 10668,
      sourceEventId: 1478,
      sourceDisciplineCategoryId: 7,
      eventName: "World Climbing Series Bern 2026",
      discipline: "boulder",
      category: "Women",
      roundName: "Final",
      status: "finished",
      boulderPointsSettings: {
        pointsPerZone: 10,
        pointsPerTop: 25,
        pointsPerLowZone: undefined,
        useLowZone: false,
        fallDeduction: 0.1
      }
    });
    expect(parsed.routes).toEqual([
      { sourceRouteId: 18764, routeName: "1" },
      { sourceRouteId: 18765, routeName: "2" },
      { sourceRouteId: 18766, routeName: "3" },
      { sourceRouteId: 18767, routeName: "4" }
    ]);
    expect(parsed.rankings).toHaveLength(8);
    expect(parsed.rankings[0]).toMatchObject({
      sourceAthleteId: 2501,
      bibNumber: "106",
      name: "MACKENZIE Oceania",
      firstName: "Oceania",
      lastName: "MACKENZIE",
      country: "AUS",
      rank: 1,
      score: "74.5",
      startOrder: 2
    });
    expect(parsed.rankings[0]?.ascents).toEqual([
      {
        sourceRouteId: 18764,
        routeName: "1",
        points: 24.7,
        top: true,
        topTries: 4,
        zone: true,
        zoneTries: 3,
        lowZone: true,
        lowZoneTries: 1,
        status: "locked"
      },
      {
        sourceRouteId: 18765,
        routeName: "2",
        points: 24.9,
        top: true,
        topTries: 2,
        zone: true,
        zoneTries: 1,
        lowZone: true,
        lowZoneTries: 1,
        status: "locked"
      },
      {
        sourceRouteId: 18766,
        routeName: "3",
        points: 0,
        top: false,
        topTries: 9,
        zone: false,
        zoneTries: 9,
        lowZone: false,
        lowZoneTries: undefined,
        status: "locked"
      },
      {
        sourceRouteId: 18767,
        routeName: "4",
        points: 24.9,
        top: true,
        topTries: 2,
        zone: true,
        zoneTries: 1,
        lowZone: true,
        lowZoneTries: 1,
        status: "locked"
      }
    ]);
  });

  it("matches the final-round slice in the full event result fixture", async () => {
    const roundResult = parseCategoryRoundResultsJson(await readFixture("category-round-10668-results.json"));
    const eventResult = parseEventResultJson(await readFixture("event-1478-result-7.json"));
    const winnerEventRanking = eventResult.rankings.find((ranking) => ranking.sourceAthleteId === 2501);
    const winnerFinalRound = winnerEventRanking?.rounds.find((round) => round.sourceCategoryRoundId === 10668);

    expect(roundResult.rankings[0]).toMatchObject({
      sourceAthleteId: winnerEventRanking?.sourceAthleteId,
      name: winnerEventRanking?.name,
      country: winnerEventRanking?.country,
      rank: winnerFinalRound?.rank,
      score: winnerFinalRound?.score
    });
    expect(roundResult.rankings[0]?.ascents).toEqual(winnerFinalRound?.ascents);
  });
});
