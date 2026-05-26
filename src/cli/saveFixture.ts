import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fetchIfscResultsPage } from "../sources/ifsc-results/fetchPage.js";
import { ensureCacheDir } from "../utils/cache.js";

const [, , url, fixtureName] = process.argv;

if (!url || !fixtureName) {
  console.error("Usage: pnpm save:fixture -- <ifsc.results.info url> <fixture-name.html>");
  process.exitCode = 1;
} else {
  const safeFixtureName = basename(fixtureName);
  const fixtureDir = await ensureCacheDir("src/sources/ifsc-results/fixtures");
  const html = await fetchIfscResultsPage(url);

  await writeFile(join(fixtureDir, safeFixtureName), html, "utf8");
  console.log(`Saved fixture: ${safeFixtureName}`);
}
