import { Request } from 'express';

export const ICAO_RE = /^[0-9A-Fa-f]{6}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateParam(req: Request): string | null {
  const date = String(req.query.date ?? '');
  return DATE_RE.test(date) ? date : null;
}
