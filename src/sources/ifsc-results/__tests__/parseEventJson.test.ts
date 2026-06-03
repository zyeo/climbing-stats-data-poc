import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseEventMetadataJson, parseEventResultJson } from "../parseEventJson.js";

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

  it("throws for invalid JSON", () => {
    expect(() => parseEventMetadataJson("not-json")).toThrow("Expected valid JSON.");
  });
});

describe("parseEventResultJson", () => {
  it("parses Boulder Men result summary from the event 1412 result fixture", async () => {
    const parsed = parseEventResultJson(await readFixture("event-1412-result-3.json"));

    expect(parsed.eventName).toBe("IFSC World Cup Innsbruck 2025");
    expect(parsed.disciplineCategory).toBe("BOULDER Men");
    expect(parsed.discipline).toBe("boulder");
    expect(parsed.category).toBe("Men");
    expect(parsed.status).toBe("finished");
    expect(parsed.categoryRounds).toEqual([
      {
        sourceCategoryRoundId: 9399,
        kind: "boulder",
        name: "Qualification",
        category: "Men",
        status: "finished",
        resultUrl: "/api/v1/category_rounds/9399/results"
      },
      {
        sourceCategoryRoundId: 10119,
        kind: "boulder",
        name: "Semi-final",
        category: "Men",
        status: "finished",
        resultUrl: "/api/v1/category_rounds/10119/results"
      },
      {
        sourceCategoryRoundId: 10121,
        kind: "boulder",
        name: "Final",
        category: "Men",
        status: "finished",
        resultUrl: "/api/v1/category_rounds/10121/results"
      }
    ]);
    expect(parsed.rankings).toHaveLength(112);
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
          ascentCount: 5
        },
        {
          sourceCategoryRoundId: 10119,
          roundName: "Semi-final",
          rank: 5,
          score: "54.1",
          startingGroup: undefined,
          ascentCount: 4
        },
        {
          sourceCategoryRoundId: 10121,
          roundName: "Final",
          rank: 1,
          score: "69.8",
          startingGroup: undefined,
          ascentCount: 4
        }
      ]
    });
  });
});
