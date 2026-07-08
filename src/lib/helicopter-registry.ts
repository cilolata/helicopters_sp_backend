import { readFileSync } from "fs";
import { join } from "path";

interface AnacEntry {
  owner: string | null;
  model: string | null;
  operator: string | null;
}

const data: Record<string, AnacEntry> = JSON.parse(
  readFileSync(join(__dirname, "../../prisma/data/anac-registry.json"), "utf-8")
);

export const helicopterRegistry = new Map<string, AnacEntry>(Object.entries(data));

console.log(`[anac-registry] ${helicopterRegistry.size} helicópteros carregados`);
