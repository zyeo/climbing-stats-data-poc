import { describe, expect, it } from "vitest";
import { parseEventPage } from "../parseEventPage.js";

describe("parseEventPage", () => {
  it("parses a placeholder title from an HTML string", () => {
    const result = parseEventPage("<html><head><title>IFSC Event</title></head><body></body></html>");

    expect(result).toEqual({
      title: "IFSC Event",
      events: []
    });
  });

  it("does not require network access", () => {
    const result = parseEventPage("<html></html>");

    expect(result.title).toBeNull();
  });
});
