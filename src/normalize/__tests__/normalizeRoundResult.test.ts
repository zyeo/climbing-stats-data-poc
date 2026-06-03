import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCategoryRoundResultsJson } from "../../sources/ifsc-results/parseEventJson.js";
import { normalizeRoundResult } from "../normalizeRoundResult.js";

async function readFixture(name: string): Promise<string> {
  return readFile(new URL(`../../sources/ifsc-results/fixtures/${name}`, import.meta.url), "utf8");
}

describe("normalizeRoundResult", () => {
  it("preserves athlete start order when it is available from a round endpoint", async () => {
    const parsedRound = parseCategoryRoundResultsJson(await readFixture("category-round-10668-results.json"));
    const firstRanking = parsedRound.rankings[0];

    const roundResult = normalizeRoundResult({
      resultId: "result-1478-7-2501",
      eventId: "event-1478-7",
      roundId: "round-10668",
      athleteId: "athlete-2501",
      rank: firstRanking?.rank,
      score: firstRanking?.score,
      startOrder: firstRanking?.startOrder,
      sourceUrl: "https://ifsc.results.info/api/v1/category_rounds/10668/results",
      sourceCategoryRoundId: String(parsedRound.sourceCategoryRoundId)
    });

    expect(roundResult).toMatchObject({
      rank: 1,
      score: "74.5",
      startOrder: 2,
      sourceCategoryRoundId: "10668"
    });
  });

  it("keeps start order optional for endpoints that do not provide it", () => {
    const roundResult = normalizeRoundResult({
      resultId: "result-1478-7-2501",
      eventId: "event-1478-7",
      roundId: "round-10379",
      athleteId: "athlete-2501",
      rank: 16,
      score: "109.3",
      startingGroup: "Group B",
      sourceUrl: "https://ifsc.results.info/api/v1/events/1478/result/7",
      sourceCategoryRoundId: "10379"
    });

    expect(roundResult).toMatchObject({
      rank: 16,
      score: "109.3",
      startingGroup: "Group B",
      startOrder: undefined,
      sourceCategoryRoundId: "10379"
    });
  });
});
