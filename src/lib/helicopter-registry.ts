import prisma from "../config/database";

export interface AnacEntry {
  owner:    string | null;
  model:    string | null;
  operator: string | null;
}

export async function loadHelicopterRegistry(): Promise<Map<string, AnacEntry>> {
  const rows = await prisma.anacRegistry.findMany();
  const registry = new Map<string, AnacEntry>();
  for (const row of rows) {
    registry.set(row.registration, {
      owner:    row.owner,
      model:    row.model,
      operator: row.operator,
    });
  }
  console.log(`[anac-registry] ${registry.size} helicópteros carregados`);
  return registry;
}
