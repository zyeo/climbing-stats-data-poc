import { describe, expect, it } from "vitest";
import { createNormalizedFixtureReport, parseReportFixtureArgs } from "../reportFixture.js";

describe("parseReportFixtureArgs", () => {
  it("parses event and result IDs with a leading pnpm delimiter", () => {
    expect(parseReportFixtureArgs(["--", "--event", "1478", "--result", "7"])).toEqual({
      eventId: 1478,
      resultId: 7
    });
  });

  it("rejects missing arguments", () => {
    expect(() => parseReportFixtureArgs(["--event", "1478"])).toThrow("Missing required");
  });

  it("rejects non-integer IDs", () => {
    expect(() => parseReportFixtureArgs(["--event", "event-1478", "--result", "7"])).toThrow("positive integer");
  });
});

describe("createNormalizedFixtureReport", () => {
  it("summarizes a cached fixture without live network access", async () => {
    const report = await createNormalizedFixtureReport({ eventId: 1478, resultId: 7 });

    expect(report).toEqual({
      eventId: 1478,
      resultId: 7,
      competition: "World Climbing Series Bern 2026",
      location: "Bern, Switzerland",
      disciplineCategory: "BOULDER Women",
      discipline: "boulder",
      category: "Women",
      roundNames: ["Qualification", "Semi-final", "Final"],
      counts: {
        athletes: 75,
        results: 75,
        roundResults: 107,
        boulderProblemResults: 503,
        unrankedResults: 0
      },
      lowZoneCounts: {
        true: 416,
        false: 87,
        absent: 0
      }
    });
  });
});
