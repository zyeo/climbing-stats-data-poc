import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportMenBoulderWorldCup2025,
  serializeCsv
} from "../exportMenBoulderWorldCup2025.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("serializeCsv", () => {
  it("escapes commas, quotes, empty values, and booleans", () => {
    expect(
      serializeCsv(
        ["name", "location", "active", "missing"],
        [{ name: 'Climber "A"', location: "Salt Lake City, USA", active: true, missing: undefined }]
      )
    ).toBe('name,location,active,missing\n"Climber ""A""","Salt Lake City, USA",true,\n');
  });
});

describe("exportMenBoulderWorldCup2025", () => {
  it("exports normalized manifest data as analysis-ready CSV tables", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "climbing-stats-export-"));
    temporaryDirectories.push(outputDir);

    const summary = await exportMenBoulderWorldCup2025(outputDir);

    expect(summary.files).toEqual([
      { filename: "competitions.csv", rows: 6 },
      { filename: "events.csv", rows: 6 },
      { filename: "athletes.csv", rows: 185 },
      { filename: "rounds.csv", rows: 18 },
      { filename: "event_results.csv", rows: 479 },
      { filename: "round_results.csv", rows: 675 },
      { filename: "boulder_problems.csv", rows: 103 },
      { filename: "boulder_problem_results.csv", rows: 3179 }
    ]);

    const competitions = await readFile(join(outputDir, "competitions.csv"), "utf8");
    const roundResults = await readFile(join(outputDir, "round_results.csv"), "utf8");
    const boulderProblemResults = await readFile(join(outputDir, "boulder_problem_results.csv"), "utf8");

    expect(competitions).toContain('"Salt Lake City, USA"');
    expect(roundResults).toContain("starting_group");
    expect(roundResults).toContain("Group A");
    expect(boulderProblemResults).toContain("top,top_tries,zone,zone_tries,low_zone,low_zone_tries");
    expect(boulderProblemResults.split("\n")).toHaveLength(3181);
  });
});
