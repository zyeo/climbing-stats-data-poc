import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { fetchIfscResultsPage, parseIfscResultsUrl } from "../sources/ifsc-results/fetchPage.js";
import { ensureCacheDir } from "../utils/cache.js";

export const IFSC_FIXTURE_DIR = "src/sources/ifsc-results/fixtures";

export interface SaveFixtureOptions {
  url: string;
  out: string;
  force: boolean;
}

function usage(): string {
  return [
    "Usage: pnpm save:fixture -- --url <https://ifsc.results.info/...> [--out fixture-name.html] [--force]",
    "",
    "Fetches one IFSC Results page and saves its raw HTML as a cached fixture."
  ].join("\n");
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "ifsc-results-fixture";
}

export function defaultFixtureFilename(url: string): string {
  const parsedUrl = parseIfscResultsUrl(url);
  const pathPart = slugify(parsedUrl.pathname);
  const queryPart = parsedUrl.search ? `-${slugify(parsedUrl.search)}` : "";

  return `${pathPart}${queryPart}.html`;
}

export function validateFixtureFilename(filename: string): string {
  const trimmed = filename.trim();

  if (!trimmed) {
    throw new Error("Output filename cannot be empty.");
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed === "." || trimmed === ".." || trimmed.includes("..")) {
    throw new Error("Output filename must be a plain filename, not a path.");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.html?$/.test(trimmed)) {
    throw new Error("Output filename must use only letters, numbers, dots, dashes, or underscores and end in .html or .htm.");
  }

  return trimmed;
}

export function parseSaveFixtureArgs(args: string[]): SaveFixtureOptions {
  let url: string | undefined;
  let out: string | undefined;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--url") {
      url = args[index + 1];
      index += 1;
    } else if (arg === "--out") {
      out = args[index + 1];
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

  parseIfscResultsUrl(url);

  return {
    url,
    out: validateFixtureFilename(out ?? defaultFixtureFilename(url)),
    force
  };
}

export async function saveFixture(options: SaveFixtureOptions): Promise<string> {
  const fixtureDir = await ensureCacheDir(IFSC_FIXTURE_DIR);
  const outputPath = join(fixtureDir, options.out);
  const html = await fetchIfscResultsPage(options.url);

  await writeFile(outputPath, html, {
    encoding: "utf8",
    flag: options.force ? "w" : "wx"
  });

  return outputPath;
}

async function main(): Promise<void> {
  const options = parseSaveFixtureArgs(process.argv.slice(2));
  const outputPath = await saveFixture(options);

  console.log(`Saved fixture: ${outputPath}`);
  console.log(`Source URL: ${parseIfscResultsUrl(options.url).href}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("EEXIST")) {
      console.error("Failed to save fixture: output file already exists. Re-run with --force to overwrite it.");
    } else {
      console.error(`Failed to save fixture: ${message}`);
    }

    process.exitCode = 1;
  });
}
