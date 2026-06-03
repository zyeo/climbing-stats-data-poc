import { describe, expect, it } from "vitest";
import { normalizeBoulderProblem } from "../normalizeBoulderProblem.js";

describe("normalizeBoulderProblem", () => {
  it("creates a shared boulder problem record for one route in one round", () => {
    const problem = normalizeBoulderProblem({
      eventId: "event-1478-result-7",
      roundId: "round-10668",
      sourceCategoryRoundId: "10668",
      sourceRouteId: "18764",
      routeName: "1",
      sourceUrl: "https://ifsc.results.info/api/v1/category_rounds/10668/results"
    });

    expect(problem).toMatchObject({
      eventId: "event-1478-result-7",
      roundId: "round-10668",
      sourceCategoryRoundId: "10668",
      sourceRouteId: "18764",
      routeName: "1",
      source: "ifsc-results",
      sourceUrl: "https://ifsc.results.info/api/v1/category_rounds/10668/results"
    });
    expect(problem.id).toMatch(/^[a-f0-9]{16}$/);
  });
});
