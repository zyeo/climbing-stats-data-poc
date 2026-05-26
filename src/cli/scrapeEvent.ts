import { readFile } from "node:fs/promises";
import { parseEventPage } from "../sources/ifsc-results/parseEventPage.js";

const [, , fixturePath] = process.argv;

if (!fixturePath) {
  console.error("Usage: pnpm scrape:event -- <fixture-path>");
  process.exitCode = 1;
} else {
  const html = await readFile(fixturePath, "utf8");
  const parsed = parseEventPage(html);

  console.log(JSON.stringify(parsed, null, 2));
}
