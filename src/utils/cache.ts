import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function ensureCacheDir(path: string): Promise<string> {
  const absolutePath = resolve(path);
  await mkdir(absolutePath, { recursive: true });
  return absolutePath;
}
