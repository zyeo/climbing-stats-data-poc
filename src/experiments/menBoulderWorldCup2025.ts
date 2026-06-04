import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { normalizeIfscBoulderingEventResult } from "../normalize/normalizeIfscEventResult.js";
import { parseEventMetadataJson, parseEventResultJson } from "../sources/ifsc-results/parseEventJson.js";
import { IFSC_JSON_FIXTURE_DIR } from "../cli/saveJsonFixture.js";

export const MEN_BOULDER_WORLD_CUP_2025_MANIFEST_PATH = "experiments/2025-men-boulder-world-cup/manifest.json";

const manifestEventSchema = z.object({
  eventId: z.number().int().positive(),
  name: z.string().min(1),
  location: z.string().min(1),
  metadataUrl: z.string().url(),
  resultUrl: z.string().url(),
  metadataFixture: z.string().min(1),
  resultFixture: z.string().min(1),
  status: z.literal("fixture-ready"),
  notes: z.string().optional()
});

export const menBoulderWorldCup2025ManifestSchema = z.object({
  id: z.literal("2025-men-boulder-world-cup"),
  name: z.string().min(1),
  status: z.literal("fixture-backed"),
  description: z.string().min(1),
  source: z.literal("ifsc-results"),
  season: z.literal(2025),
  discipline: z.literal("boulder"),
  category: z.literal("Men"),
  rules: z.object({
    fetching: z.literal("manual-low-volume-only"),
    testsUseLiveNetwork: z.literal(false),
    crawl: z.literal(false)
  }),
  events: z.array(manifestEventSchema).min(1),
  nextEventsToIdentify: z.array(z.unknown()),
  knownLimitations: z.array(z.string())
});

export type MenBoulderWorldCup2025Manifest = z.infer<typeof menBoulderWorldCup2025ManifestSchema>;

export async function readMenBoulderWorldCup2025Manifest(): Promise<MenBoulderWorldCup2025Manifest> {
  const manifestPath = join(process.cwd(), MEN_BOULDER_WORLD_CUP_2025_MANIFEST_PATH);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;

  return menBoulderWorldCup2025ManifestSchema.parse(manifest);
}

export async function normalizeMenBoulderWorldCup2025ManifestEvents() {
  const manifest = await readMenBoulderWorldCup2025Manifest();

  return Promise.all(
    manifest.events.map(async (event) => {
      const metadataFixturePath = join(process.cwd(), IFSC_JSON_FIXTURE_DIR, event.metadataFixture);
      const resultFixturePath = join(process.cwd(), IFSC_JSON_FIXTURE_DIR, event.resultFixture);
      const metadata = parseEventMetadataJson(await readFile(metadataFixturePath, "utf8"));
      const result = parseEventResultJson(await readFile(resultFixturePath, "utf8"));
      const normalized = normalizeIfscBoulderingEventResult({
        metadata,
        result,
        metadataSourceUrl: event.metadataUrl,
        resultSourceUrl: event.resultUrl
      });

      return {
        manifestEvent: event,
        metadata,
        result,
        normalized
      };
    })
  );
}
