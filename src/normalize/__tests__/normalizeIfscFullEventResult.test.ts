import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { normalizeIfscBoulderingEventResult } from "../normalizeIfscEventResult.js";
import { parseEventMetadataJson, parseEventResultJson } from "../../sources/ifsc-results/parseEventJson.js";

interface FullFixtureExpectation {
  eventId: number;
  competitionName: string;
  location: string;
  athleteCount: number;
  resultCount: number;
  roundResultCount: number;
  boulderProblemResultCount: number;
  nullRankResultCount: number;
  lowZoneValues: Array<boolean | undefined>;
}

async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`../../sources/ifsc-results/fixtures/${name}`, import.meta.url), "utf8");
}

async function normalizeFixture(eventId: number) {
  const metadataSourceUrl = `https://ifsc.results.info/api/v1/events/${eventId}`;
  const resultSourceUrl = `https://ifsc.results.info/api/v1/events/${eventId}/result/3`;
  const metadata = parseEventMetadataJson(await readFixture(`event-${eventId}.json`));
  const result = parseEventResultJson(await readFixture(`event-${eventId}-result-3.json`));

  return normalizeIfscBoulderingEventResult({
    metadata,
    result,
    metadataSourceUrl,
    resultSourceUrl
  });
}

describe("normalizeIfscBoulderingEventResult", () => {
  const expectations: FullFixtureExpectation[] = [
    {
      eventId: 1412,
      competitionName: "IFSC World Cup Innsbruck 2025",
      location: "Innsbruck, AUT",
      athleteCount: 112,
      resultCount: 112,
      roundResultCount: 144,
      boulderProblemResultCount: 688,
      nullRankResultCount: 2,
      lowZoneValues: [undefined]
    },
    {
      eventId: 1478,
      competitionName: "World Climbing Series Bern 2026",
      location: "Bern, Switzerland",
      athleteCount: 78,
      resultCount: 78,
      roundResultCount: 110,
      boulderProblemResultCount: 518,
      nullRankResultCount: 0,
      lowZoneValues: [false, true]
    }
  ];

  it.each(expectations)("normalizes every Boulder Men row from event $eventId", async (expectation) => {
    const normalized = await normalizeFixture(expectation.eventId);

    expect(normalized.competition).toMatchObject({
      name: expectation.competitionName,
      location: expectation.location,
      sourceCompetitionId: String(expectation.eventId),
      source: "ifsc-results"
    });
    expect(normalized.event).toMatchObject({
      name: "BOULDER Men",
      discipline: "boulder",
      category: "Men",
      sourceCompetitionId: String(expectation.eventId),
      source: "ifsc-results"
    });
    expect(normalized.rounds.map((round) => round.name)).toEqual(["Qualification", "Semi-final", "Final"]);
    expect(normalized.athletes).toHaveLength(expectation.athleteCount);
    expect(normalized.results).toHaveLength(expectation.resultCount);
    expect(normalized.roundResults).toHaveLength(expectation.roundResultCount);
    expect(normalized.boulderProblemResults).toHaveLength(expectation.boulderProblemResultCount);
    expect(normalized.results.filter((result) => result.rank === undefined)).toHaveLength(expectation.nullRankResultCount);
    expect([...new Set(normalized.boulderProblemResults.map((problem) => problem.lowZone).sort())]).toEqual(expectation.lowZoneValues);
    expect(normalized.athletes.every((athlete) => athlete.source === "ifsc-results")).toBe(true);
    expect(normalized.results.every((result) => result.source === "ifsc-results")).toBe(true);
    expect(normalized.roundResults.every((result) => result.source === "ifsc-results")).toBe(true);
    expect(normalized.boulderProblemResults.every((result) => result.source === "ifsc-results")).toBe(true);
  });

  it("rejects non-bouldering result data", async () => {
    const metadata = parseEventMetadataJson(await readFixture("event-1412.json"));
    const result = parseEventResultJson(await readFixture("event-1412-result-3.json"));

    expect(() =>
      normalizeIfscBoulderingEventResult({
        metadata,
        result: {
          ...result,
          discipline: "lead"
        },
        metadataSourceUrl: "https://ifsc.results.info/api/v1/events/1412",
        resultSourceUrl: "https://ifsc.results.info/api/v1/events/1412/result/3"
      })
    ).toThrow("Only bouldering event results are supported");
  });

  it("preserves event 1412 DNS/unranked rows without crashing normalization", async () => {
    const normalized = await normalizeFixture(1412);
    const unrankedResults = normalized.results.filter((result) => result.rank === undefined);
    const unrankedRoundResults = normalized.roundResults.filter((result) => result.rank === undefined);

    expect(unrankedResults).toHaveLength(2);
    expect(unrankedRoundResults).toHaveLength(2);
    expect(unrankedResults.map((result) => result.score)).toEqual(["DNS", "DNS"]);
    expect(unrankedResults.every((result) => result.sourceAthleteId)).toBe(true);
  });

  it("keeps starting groups optional outside qualification rounds", async () => {
    const normalized = await normalizeFixture(1412);
    const qualificationResults = normalized.roundResults.filter((result) => result.startingGroup);
    const nonQualificationResults = normalized.roundResults.filter((result) => !result.startingGroup);

    expect(qualificationResults).toHaveLength(112);
    expect(nonQualificationResults).toHaveLength(32);
    expect([...new Set(qualificationResults.map((result) => result.startingGroup))].sort()).toEqual(["Group A", "Group B"]);
  });

  it("normalizes low-zone nulls from event 1412 as absent values", async () => {
    const normalized = await normalizeFixture(1412);

    expect(normalized.boulderProblemResults).toHaveLength(688);
    expect(normalized.boulderProblemResults.every((problem) => problem.lowZone === undefined)).toBe(true);
    expect(normalized.boulderProblemResults.every((problem) => problem.lowZoneTries === undefined)).toBe(true);
  });

  it("preserves low-zone booleans from event 1478", async () => {
    const normalized = await normalizeFixture(1478);
    const lowZoneCounts = normalized.boulderProblemResults.reduce(
      (counts, problem) => {
        if (problem.lowZone) {
          counts.true += 1;
        } else {
          counts.false += 1;
        }

        return counts;
      },
      { true: 0, false: 0 }
    );

    expect(lowZoneCounts).toEqual({ true: 354, false: 164 });
    expect(
      normalized.boulderProblemResults
        .filter((problem) => problem.lowZone)
        .every((problem) => problem.lowZoneTries !== undefined)
    ).toBe(true);
  });
});
