import { AircraftsRepository } from "../repositories/db/aircrafts";

const repo = new AircraftsRepository();

function msUntilNextBRTMidnight(): number {
  const now = new Date();
  // BRT midnight = 03:00 UTC
  const next = new Date(now);
  next.setUTCHours(3, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

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
