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

    expect(report).toMatchObject({
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
        boulderProblems: 18,
        boulderProblemResults: 503,
        unrankedResults: 0
      },
      lowZoneCounts: {
        true: 416,
        false: 87,
        absent: 0
      },
      ascentCounts: {
        attempts: 503,
        top: {
          true: 243,
          false: 260,
          absent: 0
        },
        zone: {
          true: 416,
          false: 87,
          absent: 0
        },
        lowZone: {
          true: 416,
          false: 87,
          absent: 0
        }
      },
      qualification: {
        athleteAscentCounts: [5],
        routeInventory: 10,
        routeSets: [
          {
            startingGroup: "Group A",
            athleteCount: 37,
            routeCount: 5,
            routeNames: ["1", "2", "3", "4", "5"],
            sourceRouteIds: ["18742", "18743", "18744", "18745", "18746"]
          },
          {
            startingGroup: "Group B",
            athleteCount: 38,
            routeCount: 5,
            routeNames: ["1", "2", "3", "4", "5"],
            sourceRouteIds: ["18747", "18748", "18749", "18750", "18751"]
          }
        ]
      }
    });
    expect(report.roundSummaries).toEqual([
      expect.objectContaining({
        roundName: "Qualification",
        athletes: 75,
        attempts: 375,
        routeInventory: 10,
        ascentCounts: expect.objectContaining({
          top: { true: 209, false: 166, absent: 0 },
          zone: { true: 324, false: 51, absent: 0 }
        })
      }),
      expect.objectContaining({
        roundName: "Semi-final",
        athletes: 24,
        attempts: 96,
        routeInventory: 4
      }),
      expect.objectContaining({
        roundName: "Final",
        athletes: 8,
        attempts: 32,
        routeInventory: 4
      })
    ]);
    expect(report.boulderSummaries).toHaveLength(18);
    expect(report.boulderSummaries[0]).toMatchObject({
      roundName: "Qualification",
      startingGroup: "Group A",
      routeName: "1",
      sourceRouteId: "18742",
      attempts: 37,
      topRate: 0.5405,
      zoneRate: 0.973,
      lowZoneRate: 0.973
    });
  });

  it("summarizes one-group qualification fixtures separately from two-group fixtures", async () => {
    const report = await createNormalizedFixtureReport({ eventId: 1408, resultId: 3 });

    expect(report.ascentCounts).toEqual({
      attempts: 412,
      top: {
        true: 133,
        false: 279,
        absent: 0
      },
      zone: {
        true: 294,
        false: 118,
        absent: 0
      },
      lowZone: {
        true: 0,
        false: 0,
        absent: 412
      }
    });
    expect(report.roundSummaries).toEqual([
      expect.objectContaining({
        roundName: "Qualification",
        athletes: 56,
        attempts: 280,
        routeInventory: 5
      }),
      expect.objectContaining({
        roundName: "Semi-final",
        athletes: 25,
        attempts: 100,
        routeInventory: 4
      }),
      expect.objectContaining({
        roundName: "Final",
        athletes: 8,
        attempts: 32,
        routeInventory: 4
      })
    ]);
    expect(report.boulderSummaries).toHaveLength(13);
    expect(report.boulderSummaries[1]).toMatchObject({
      roundName: "Qualification",
      routeName: "2",
      sourceRouteId: "16548",
      attempts: 56,
      topRate: 0.0179,
      zoneRate: 0.0893
    });
    expect(report.boulderSummaries[1].lowZoneRate).toBeUndefined();
    expect(report.qualification).toEqual({
      athleteAscentCounts: [5],
      routeInventory: 5,
      routeSets: [
        {
          athleteCount: 56,
          routeCount: 5,
          routeNames: ["1", "2", "3", "4", "5"],
          sourceRouteIds: ["16547", "16548", "16549", "16550", "16551"]
        }
      ]
    });
  });
});
