import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSaveFixtureArgs, saveFixture, validateFixtureFilename } from "../saveFixture.js";

const originalFetch = globalThis.fetch;
let tempDirs: string[] = [];

afterEach(async () => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();

  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("validateFixtureFilename", () => {
  it("accepts plain HTML filenames", () => {
    expect(validateFixtureFilename("event-2026.html")).toBe("event-2026.html");
    expect(validateFixtureFilename("rankings_fixture.htm")).toBe("rankings_fixture.htm");
  });

  it("rejects unsafe paths", () => {
    expect(() => validateFixtureFilename("../secret.html")).toThrow("plain filename");
    expect(() => validateFixtureFilename("nested/fixture.html")).toThrow("plain filename");
    expect(() => validateFixtureFilename("nested\\fixture.html")).toThrow("plain filename");
  });

  it("rejects filenames without an HTML extension", () => {
    expect(() => validateFixtureFilename("fixture.txt")).toThrow("end in .html or .htm");
  });
});

describe("parseSaveFixtureArgs", () => {
  it("rejects non-IFSC URLs", () => {
    expect(() => parseSaveFixtureArgs(["--url", "https://example.com/event.html"])).toThrow(
      "Only ifsc.results.info URLs are supported."
    );
  });

  it("rejects unsafe --out values", () => {
    expect(() => parseSaveFixtureArgs(["--url", "https://ifsc.results.info/event.html", "--out", "../secret.html"])).toThrow(
      "plain filename"
    );
  });

  it("defaults to a sanitized output filename", () => {
    const options = parseSaveFixtureArgs(["--url", "https://ifsc.results.info/results/season/2026/event/1"]);

    expect(options).toEqual({
      url: "https://ifsc.results.info/results/season/2026/event/1",
      out: "results-season-2026-event-1.html",
      force: false
    });
  });
});

describe("saveFixture", () => {
  it("refuses to overwrite an existing file unless forced", async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), "ifsc-fixtures-"));
    tempDirs.push(fixtureDir);
    vi.spyOn(process, "cwd").mockReturnValue(fixtureDir);
    const outputDir = join(fixtureDir, "src/sources/ifsc-results/fixtures");
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "event.html"), "existing", "utf8");

    globalThis.fetch = vi.fn(async () => {
      return new Response("<html></html>", {
        status: 200,
        headers: {
          "content-type": "text/html"
        }
      });
    }) as typeof fetch;

    await expect(
      saveFixture({
        url: "https://ifsc.results.info/event.html",
        out: "event.html",
        force: false
      })
    ).rejects.toThrow("EEXIST");
  });
});
