import { describe, expect, it } from "vitest";
import {
  readMenBoulderWorldCup2025Manifest,
  normalizeMenBoulderWorldCup2025ManifestEvents
} from "../menBoulderWorldCup2025.js";

describe("2025 Men Boulder World Cup experiment manifest", () => {
  it("documents a manual fixture-backed dataset", async () => {
    const manifest = await readMenBoulderWorldCup2025Manifest();

    expect(manifest).toMatchObject({
      id: "2025-men-boulder-world-cup",
      season: 2025,
      discipline: "boulder",
      category: "Men",
      rules: {
        fetching: "manual-low-volume-only",
        testsUseLiveNetwork: false,
        crawl: false
      }
    });
    expect(manifest.events.map((event) => event.eventId)).toEqual([1405, 1408, 1409, 1410, 1411, 1412]);
    expect(manifest.events.every((event) => event.status === "fixture-ready")).toBe(true);
  });

  it("normalizes every manifest event from committed fixtures only", async () => {
    const entries = await normalizeMenBoulderWorldCup2025ManifestEvents();

    expect(entries).toHaveLength(6);
    expect(entries.map((entry) => entry.result.disciplineCategory)).toEqual([
      "BOULDER Men",
      "BOULDER Men",
      "BOULDER Men",
      "BOULDER Men",
      "BOULDER Men",
      "BOULDER Men"
    ]);
    expect(entries.map((entry) => entry.normalized.event.category)).toEqual(["Men", "Men", "Men", "Men", "Men", "Men"]);
    expect(entries.map((entry) => entry.normalized.event.discipline)).toEqual([
      "boulder",
      "boulder",
      "boulder",
      "boulder",
      "boulder",
      "boulder"
    ]);
    expect(entries.map((entry) => entry.normalized.boulderProblems.length)).toEqual([18, 13, 18, 18, 18, 18]);
    expect(entries.map((entry) => entry.normalized.results.length)).toEqual([68, 56, 62, 93, 88, 112]);
    expect(entries.reduce((total, entry) => total + entry.normalized.results.length, 0)).toBe(479);
    expect(entries.reduce((total, entry) => total + entry.normalized.boulderProblems.length, 0)).toBe(103);
    expect(entries.reduce((total, entry) => total + entry.normalized.boulderProblemResults.length, 0)).toBe(3179);
    expect(
      entries.every((entry) =>
        entry.normalized.boulderProblemResults.every((result) =>
          entry.normalized.boulderProblems.some((problem) => problem.id === result.boulderProblemId)
        )
      )
    ).toBe(true);
  });

  it("keeps qualification route inventory separate from athlete qualification workload", async () => {
    const entries = await normalizeMenBoulderWorldCup2025ManifestEvents();

    expect(
      entries.map((entry) => {
        const qualificationRouteIds = new Set<number>();
        const qualificationAscentCounts = new Set<number>();
        const qualificationStartingGroups = new Set<string>();

        for (const ranking of entry.result.rankings) {
          const qualificationRound = ranking.rounds.find((round) => round.roundName === "Qualification");

          if (!qualificationRound) {
            continue;
          }

          qualificationAscentCounts.add(qualificationRound.ascentCount);

          if (qualificationRound.startingGroup) {
            qualificationStartingGroups.add(qualificationRound.startingGroup);
          }

          for (const ascent of qualificationRound.ascents) {
            if (ascent.sourceRouteId) {
              qualificationRouteIds.add(ascent.sourceRouteId);
            }
          }
        }

        return {
          eventId: entry.manifestEvent.eventId,
          qualificationRouteInventory: qualificationRouteIds.size,
          athleteQualificationAscentCounts: [...qualificationAscentCounts].sort((a, b) => a - b),
          startingGroups: [...qualificationStartingGroups].sort()
        };
      })
    ).toEqual([
      {
        eventId: 1405,
        qualificationRouteInventory: 10,
        athleteQualificationAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      },
      {
        eventId: 1408,
        qualificationRouteInventory: 5,
        athleteQualificationAscentCounts: [5],
        startingGroups: []
      },
      {
        eventId: 1409,
        qualificationRouteInventory: 10,
        athleteQualificationAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      },
      {
        eventId: 1410,
        qualificationRouteInventory: 10,
        athleteQualificationAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      },
      {
        eventId: 1411,
        qualificationRouteInventory: 10,
        athleteQualificationAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      },
      {
        eventId: 1412,
        qualificationRouteInventory: 10,
        athleteQualificationAscentCounts: [5],
        startingGroups: ["Group A", "Group B"]
      }
    ]);
  });
});
