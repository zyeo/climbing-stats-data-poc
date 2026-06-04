import { describe, expect, it } from "vitest";
import { createMenBoulderWorldCup2025Analysis } from "../analyzeMenBoulderWorldCup2025.js";

describe("createMenBoulderWorldCup2025Analysis", () => {
  it("summarizes the committed 2025 Men Boulder World Cup manifest fixtures", async () => {
    const analysis = await createMenBoulderWorldCup2025Analysis();

    expect(analysis).toMatchObject({
      experimentId: "2025-men-boulder-world-cup",
      eventCount: 6,
      totals: {
        athleteEventResults: 479,
        roundResults: 675,
        boulderProblems: 103,
        boulderProblemResults: 3179,
        tops: 897,
        zones: 2157,
        lowZones: 0,
        lowZoneAbsent: 3179
      },
      repeatedAthletes: {
        uniqueAthletes: 185,
        multiEventAthletes: 112,
        maxEventsByAthlete: 6
      }
    });
    expect(analysis.perEvent.map((event) => event.eventId)).toEqual([1405, 1408, 1409, 1410, 1411, 1412]);
    expect(analysis.perEvent.map((event) => event.roundSummaries.map((round) => round.roundName))).toEqual([
      ["Qualification", "Semi-final", "Final"],
      ["Qualification", "Semi-final", "Final"],
      ["Qualification", "Semi-final", "Final"],
      ["Qualification", "Semi-final", "Final"],
      ["Qualification", "Semi-final", "Final"],
      ["Qualification", "Semi-final", "Final"]
    ]);
  });

  it("preserves one-group and two-group qualification shapes", async () => {
    const analysis = await createMenBoulderWorldCup2025Analysis();

    expect(analysis.qualificationShapes).toEqual([
      expect.objectContaining({
        eventId: 1405,
        routeInventory: 10,
        athleteAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      }),
      expect.objectContaining({
        eventId: 1408,
        routeInventory: 5,
        athleteAscentCounts: [5],
        startingGroups: []
      }),
      expect.objectContaining({
        eventId: 1409,
        routeInventory: 10,
        athleteAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      }),
      expect.objectContaining({
        eventId: 1410,
        routeInventory: 10,
        athleteAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      }),
      expect.objectContaining({
        eventId: 1411,
        routeInventory: 10,
        athleteAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      }),
      expect.objectContaining({
        eventId: 1412,
        routeInventory: 10,
        athleteAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      })
    ]);
  });
});
