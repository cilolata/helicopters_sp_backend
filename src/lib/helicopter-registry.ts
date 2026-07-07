import { readFileSync } from "fs";
import { join } from "path";

interface RegistryEntry {
  registration: string;
  model:        string | null;
  manufacturer: string | null;
  icao_type:    string | null;
}

const entries: RegistryEntry[] = JSON.parse(
  readFileSync(join(__dirname, "../../prisma/data/helicopters.json"), "utf-8")
);

export const helicopterRegistry = new Set(entries.map(e => e.registration));
