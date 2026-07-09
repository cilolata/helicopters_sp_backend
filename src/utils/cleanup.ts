import { AircraftsRepository } from "../repositories/db/aircrafts";
import { msUntilNextBRTMidnight } from "./brt";

const repo = new AircraftsRepository();

async function runCleanup() {
  try {
    const deleted = await repo.deleteOldPositions();
    console.log(`[cleanup] ${deleted} posições antigas removidas`);
  } catch (err) {
    console.error('[cleanup] Erro ao limpar posições:', err);
  }
  setTimeout(runCleanup, msUntilNextBRTMidnight());
}

setTimeout(runCleanup, msUntilNextBRTMidnight());
