import { createHash } from "node:crypto";

export function createStableId(parts: string[]): string {
  const normalized = parts.map((part) => part.trim().toLowerCase()).join(":");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
