import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { fetchIfscResultsJson, parseIfscApiUrl, parseIfscResultsUrl } from "../sources/ifsc-results/fetchPage.js";
import { ensureCacheDir } from "../utils/cache.js";

export const IFSC_JSON_FIXTURE_DIR = "src/sources/ifsc-results/fixtures";

export interface SaveJsonFixtureOptions {
  url: string;
  out: string;
  force: boolean;
  referer?: string;
}

function usage(): string {
  return [
    "Usage: pnpm save:json-fixture -- --url <https://ifsc.results.info/api/...> [--out fixture-name.json] [--referer https://ifsc.results.info/...] [--force]",
    "",
    "Fetches one IFSC Results JSON API response and saves it as a cached fixture.",
    "Do not pass cookies, CSRF tokens, auth headers, or copied private browser headers."
  ].join("\n");
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "ifsc-results-json-fixture";
}

export function defaultJsonFixtureFilename(url: string): string {
  const parsedUrl = parseIfscApiUrl(url);
  const pathPart = slugify(parsedUrl.pathname);
  const queryPart = parsedUrl.search ? `-${slugify(parsedUrl.search)}` : "";

  return `${pathPart}${queryPart}.json`;
}

export function validateJsonFixtureFilename(filename: string): string {
  const trimmed = filename.trim();

  if (!trimmed) {
    throw new Error("Output filename cannot be empty.");
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed === "." || trimmed === ".." || trimmed.includes("..")) {
    throw new Error("Output filename must be a plain filename, not a path.");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(trimmed)) {
    throw new Error("Output filename must use only letters, numbers, dots, dashes, or underscores and end in .json.");
  }

  return trimmed;
}

export function parseSaveJsonFixtureArgs(args: string[]): SaveJsonFixtureOptions {
  let url: string | undefined;
  let out: string | undefined;
  let referer: string | undefined;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    } else if (arg === "--url") {
      url = args[index + 1];
      index += 1;
    } else if (arg === "--out") {
      out = args[index + 1];
      index += 1;
    } else if (arg === "--referer") {
      referer = args[index + 1];
      index += 1;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      throw new Error(usage());
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }

  if (!url) {
    throw new Error(`Missing required --url argument.\n\n${usage()}`);
  }

  parseIfscApiUrl(url);

  if (referer) {
    parseIfscResultsUrl(referer);
  }

  return {
    url,
    out: validateJsonFixtureFilename(out ?? defaultJsonFixtureFilename(url)),
    force,
    referer
  };
}

export async function saveJsonFixture(options: SaveJsonFixtureOptions): Promise<string> {
  const fixtureDir = await ensureCacheDir(IFSC_JSON_FIXTURE_DIR);
  const outputPath = join(fixtureDir, options.out);
  const json = await fetchIfscResultsJson(options.url, { referer: options.referer });
  const serialized = `${JSON.stringify(json, null, 2)}\n`;

  await writeFile(outputPath, serialized, {
    encoding: "utf8",
    flag: options.force ? "w" : "wx"
  });

  return outputPath;
}

async function main(): Promise<void> {
  const options = parseSaveJsonFixtureArgs(process.argv.slice(2));
  const outputPath = await saveJsonFixture(options);

  console.log(`Saved JSON fixture: ${outputPath}`);
  console.log(`Source URL: ${parseIfscApiUrl(options.url).href}`);

  if (options.referer) {
    console.log(`Referer: ${parseIfscResultsUrl(options.referer).href}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("EEXIST")) {
      console.error("Failed to save JSON fixture: output file already exists. Re-run with --force to overwrite it.");
    } else {
      console.error(`Failed to save JSON fixture: ${message}`);
    }

    process.exitCode = 1;
  });
}
