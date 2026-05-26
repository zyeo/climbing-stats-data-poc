import { readFile } from "node:fs/promises";
import { parseRankings } from "../sources/ifsc-results/parseRankings.js";

const [, , fixturePath] = process.argv;

if (!fixturePath) {
  console.error("Usage: pnpm scrape:rankings -- <fixture-path>");
  process.exitCode = 1;
} else {
  const html = await readFile(fixturePath, "utf8");
  const parsed = parseRankings(html);

  console.log(JSON.stringify(parsed, null, 2));
}
