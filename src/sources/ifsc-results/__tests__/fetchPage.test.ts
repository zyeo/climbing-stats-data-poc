import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IFSC_RESULTS_USER_AGENT,
  fetchIfscResultsJson,
  fetchIfscResultsPage,
  parseIfscApiUrl,
  parseIfscResultsUrl
} from "../fetchPage.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("parseIfscResultsUrl", () => {
  it("rejects non-IFSC URLs", () => {
    expect(() => parseIfscResultsUrl("https://example.com/results")).toThrow("Only ifsc.results.info URLs are supported.");
  });

  it("rejects non-HTTP protocols", () => {
    expect(() => parseIfscResultsUrl("file://ifsc.results.info/results.html")).toThrow("Only HTTP and HTTPS URLs are supported.");
  });
});

describe("parseIfscApiUrl", () => {
  it("accepts IFSC API URLs", () => {
    expect(parseIfscApiUrl("https://ifsc.results.info/api/v1/events/1412").pathname).toBe("/api/v1/events/1412");
  });

  it("rejects non-API URLs", () => {
    expect(() => parseIfscApiUrl("https://ifsc.results.info/event/1412/")).toThrow("under /api/");
  });
});

describe("fetchIfscResultsPage", () => {
  it("fetches a single IFSC HTML page with a clear user-agent", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("<html></html>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8"
        }
      });
    }) as typeof fetch;

    await expect(fetchIfscResultsPage("https://ifsc.results.info/event.html")).resolves.toBe("<html></html>");

    expect(globalThis.fetch).toHaveBeenCalledWith(new URL("https://ifsc.results.info/event.html"), {
      headers: {
        "user-agent": IFSC_RESULTS_USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      },
      redirect: "error"
    });
  });

  it("throws for non-200 responses", async () => {
    globalThis.fetch = vi.fn(async () => new Response("missing", { status: 404, statusText: "Not Found" })) as typeof fetch;

    await expect(fetchIfscResultsPage("https://ifsc.results.info/missing.html")).rejects.toThrow("404 Not Found");
  });

  it("throws for detectable non-HTML responses", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("{}", {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }) as typeof fetch;

    await expect(fetchIfscResultsPage("https://ifsc.results.info/data.json")).rejects.toThrow("Expected HTML");
  });
});

describe("fetchIfscResultsJson", () => {
  it("fetches a single IFSC JSON API URL with safe headers", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ id: 1412 }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8"
        }
      });
    }) as typeof fetch;

    await expect(
      fetchIfscResultsJson("https://ifsc.results.info/api/v1/events/1412", {
        referer: "https://ifsc.results.info/event/1412/general/boulder"
      })
    ).resolves.toEqual({ id: 1412 });

    expect(globalThis.fetch).toHaveBeenCalledWith(new URL("https://ifsc.results.info/api/v1/events/1412"), {
      headers: {
        "user-agent": IFSC_RESULTS_USER_AGENT,
        accept: "application/json",
        referer: "https://ifsc.results.info/event/1412/general/boulder"
      },
      redirect: "error"
    });
  });

  it("throws for non-JSON responses", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("<html></html>", {
        status: 200,
        headers: {
          "content-type": "text/html"
        }
      });
    }) as typeof fetch;

    await expect(fetchIfscResultsJson("https://ifsc.results.info/api/v1/events/1412")).rejects.toThrow("Expected JSON");
  });

  it("throws for invalid JSON bodies", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("not-json", {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }) as typeof fetch;

    await expect(fetchIfscResultsJson("https://ifsc.results.info/api/v1/events/1412")).rejects.toThrow("Expected valid JSON");
  });
});
