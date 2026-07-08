export function escapeCSV(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function buildExportCSV(
  rows: {
    icao_hex: string; last_callsign: string | null; owner: string | null;
    model: string | null; operator: string | null;
    first_seen: Date; last_seen: Date;
    lat: number | null; lon: number | null; altitude: number | null;
  }[]
): string {
  const toTime = (d: Date) =>
    new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const header = 'ICAO,Callsign,Owner,Modelo,Operador,Primeira Vista,Última Vista,Lat,Lon,Altitude (ft)';
  const lines  = rows.map(r =>
    [r.icao_hex, r.last_callsign, r.owner, r.model, r.operator,
     toTime(r.first_seen), toTime(r.last_seen),
     r.lat, r.lon, r.altitude]
      .map(escapeCSV).join(',')
  );

  return '﻿' + [header, ...lines].join('\r\n');
}
