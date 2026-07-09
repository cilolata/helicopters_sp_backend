export const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

export function brtDateString(date: Date = new Date()): string {
  return new Date(date.getTime() - BRT_OFFSET_MS).toISOString().slice(0, 10);
}

export function brtMidnightCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCHours(3, 0, 0, 0);
  if (cutoff > now) cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  return cutoff;
}

export function msUntilNextBRTMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(3, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}
