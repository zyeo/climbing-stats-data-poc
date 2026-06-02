import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultJsonFixtureFilename,
  parseSaveJsonFixtureArgs,
  saveJsonFixture,
  validateJsonFixtureFilename
} from "../saveJsonFixture.js";

const originalFetch = globalThis.fetch;
let tempDirs: string[] = [];

afterEach(async () => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();

  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("validateJsonFixtureFilename", () => {
  it("accepts plain JSON filenames", () => {
    expect(validateJsonFixtureFilename("event-1412.json")).toBe("event-1412.json");
  });

  it("rejects unsafe paths", () => {
    expect(() => validateJsonFixtureFilename("../secret.json")).toThrow("plain filename");
    expect(() => validateJsonFixtureFilename("nested/fixture.json")).toThrow("plain filename");
    expect(() => validateJsonFixtureFilename("nested\\fixture.json")).toThrow("plain filename");
  });

  it("rejects non-JSON extensions", () => {
    expect(() => validateJsonFixtureFilename("fixture.html")).toThrow("end in .json");
  });
});

describe("defaultJsonFixtureFilename", () => {
  it("creates a sanitized JSON filename from the API path", () => {
    expect(defaultJsonFixtureFilename("https://ifsc.results.info/api/v1/events/1412/result/3")).toBe(
      "api-v1-events-1412-result-3.json"
    );
  });
});

describe("parseSaveJsonFixtureArgs", () => {
  it("rejects non-IFSC URLs", () => {
    expect(() => parseSaveJsonFixtureArgs(["--url", "https://example.com/api/v1/events/1412"])).toThrow(
      "Only ifsc.results.info URLs are supported."
    );
  });

  it("rejects non-API IFSC URLs", () => {
    expect(() => parseSaveJsonFixtureArgs(["--url", "https://ifsc.results.info/event/1412/"])).toThrow(
      "Only IFSC Results API URLs under /api/ are supported"
    );
  });

  it("rejects unsafe --out values", () => {
    expect(() =>
      parseSaveJsonFixtureArgs(["--url", "https://ifsc.results.info/api/v1/events/1412", "--out", "../secret.json"])
    ).toThrow("plain filename");
  });

  it("rejects non-IFSC referers", () => {
    expect(() =>
      parseSaveJsonFixtureArgs([
        "--url",
        "https://ifsc.results.info/api/v1/events/1412",
        "--referer",
        "https://example.com/event/1412"
      ])
    ).toThrow("Only ifsc.results.info URLs are supported.");
  });

  it("allows a leading pnpm argument delimiter", () => {
    const options = parseSaveJsonFixtureArgs([
      "--",
      "--url",
      "https://ifsc.results.info/api/v1/events/1412",
      "--out",
      "event-1412.json",
      "--referer",
      "https://ifsc.results.info/event/1412/general/boulder"
    ]);

    expect(options).toEqual({
      url: "https://ifsc.results.info/api/v1/events/1412",
      out: "event-1412.json",
      force: false,
      referer: "https://ifsc.results.info/event/1412/general/boulder"
    });
  });
});

describe("saveJsonFixture", () => {
  it("saves pretty-printed JSON without live network access", async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), "ifsc-json-fixtures-"));
    tempDirs.push(fixtureDir);
    vi.spyOn(process, "cwd").mockReturnValue(fixtureDir);

    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ event: "IFSC World Cup Innsbruck 2025" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }) as typeof fetch;

    const outputPath = await saveJsonFixture({
      url: "https://ifsc.results.info/api/v1/events/1412",
      out: "event-1412.json",
      force: false,
      referer: "https://ifsc.results.info/event/1412/general/boulder"
    });

    await expect(readFile(outputPath, "utf8")).resolves.toBe('{\n  "event": "IFSC World Cup Innsbruck 2025"\n}\n');
  });

  it("refuses to overwrite an existing file unless forced", async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), "ifsc-json-fixtures-"));
    tempDirs.push(fixtureDir);
    vi.spyOn(process, "cwd").mockReturnValue(fixtureDir);
    const outputDir = join(fixtureDir, "src/sources/ifsc-results/fixtures");
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "event-1412.json"), "existing", "utf8");

    globalThis.fetch = vi.fn(async () => {
      return new Response("{}", {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }) as typeof fetch;

    await expect(
      saveJsonFixture({
        url: "https://ifsc.results.info/api/v1/events/1412",
        out: "event-1412.json",
        force: false
      })
    ).rejects.toThrow("EEXIST");
  });
});
