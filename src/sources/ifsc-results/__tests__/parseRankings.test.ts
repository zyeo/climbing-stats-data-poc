import { describe, expect, it } from "vitest";
import { parseRankings } from "../parseRankings.js";

describe("parseRankings", () => {
  it("parses a placeholder title from an HTML string", () => {
    const result = parseRankings("<html><head><title>IFSC Rankings</title></head><body></body></html>");

    expect(result).toEqual({
      title: "IFSC Rankings",
      rankings: []
    });
  });

  it("does not require network access", () => {
    const result = parseRankings("<html></html>");

    expect(result.title).toBeNull();
  });
});
