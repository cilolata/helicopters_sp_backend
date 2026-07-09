import { AircraftDB } from "../../entities/models/aircraft.interface";
import prisma from "../../config/database";

export class AircraftsRepository {
  async findToday() {
    // Get today's date in BRT (UTC-3)
    const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
    return this.findByDate(brtNow.toISOString().slice(0, 10));
  }

  async findByDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) throw new Error('Data inválida');
    // BRT 00:00:00 = UTC 03:00:00 / BRT 23:59:59 = UTC next-day 02:59:59
    const start = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
    const end   = new Date(Date.UTC(y, m - 1, d + 1, 2, 59, 59, 999));
    // Use positions.captured_at to find every ICAO that actually flew that BRT day,
    // regardless of when last_seen was updated (avoids missing overnight flights)
    const seen = await prisma.position.groupBy({
      by:    ['icao_hex'],
      where: { captured_at: { gte: start, lte: end } },
    });
    if (seen.length === 0) return [];
    return prisma.aircraft.findMany({
      where:   { icao_hex: { in: seen.map(r => r.icao_hex) } },
      orderBy: { last_seen: 'desc' },
    });
  }

  async savePosition(icao_hex: string, lat: number, lon: number, altitude: number | null): Promise<void> {
    await prisma.position.create({ data: { icao_hex, lat, lon, altitude } });
  }

  async findRoute(icao_hex: string) {
    // BRT midnight = UTC 03:00 of today in BRT
    const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const [y, m, d] = brtNow.toISOString().slice(0, 10).split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
    return prisma.position.findMany({
      where:   { icao_hex, captured_at: { gte: start } },
      select:  { lat: true, lon: true, captured_at: true },
      orderBy: { captured_at: 'asc' },
      take:    2000,
    });
  }

  async findForExport(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) throw new Error('Data inválida');
    const start = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
    const end   = new Date(Date.UTC(y, m - 1, d + 1, 2, 59, 59, 999));
    type Row = {
      icao_hex: string; last_callsign: string | null; owner: string | null;
      model: string | null; operator: string | null;
      first_seen: Date; last_seen: Date;
      lat: number | null; lon: number | null; altitude: number | null;
    };
    return prisma.$queryRaw<Row[]>`
      SELECT a.icao_hex, a.last_callsign, a.owner, a.model, a.operator,
             a.first_seen, a.last_seen,
             p.lat, p.lon, p.altitude
      FROM aircraft a
      LEFT JOIN LATERAL (
        SELECT lat, lon, altitude FROM positions
        WHERE icao_hex = a.icao_hex
        ORDER BY captured_at DESC LIMIT 1
      ) p ON true
      WHERE a.last_seen >= ${start} AND a.last_seen <= ${end}
      ORDER BY a.last_seen DESC
    `;
  }

  async deleteOldPositions(): Promise<number> {
    // Delete positions from before today's BRT midnight (= UTC 03:00 today)
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setUTCHours(3, 0, 0, 0);
    if (cutoff > now) cutoff.setUTCDate(cutoff.getUTCDate() - 1);
    const result = await prisma.position.deleteMany({
      where: { captured_at: { lt: cutoff } },
    });
    return result.count;
  }

  async saveAircraft(aircraft: AircraftDB): Promise<void> {
    await prisma.aircraft.upsert({
      where:  { icao_hex: aircraft.icao_hex },
      create: {
        icao_hex:      aircraft.icao_hex,
        first_seen:    aircraft.first_seen    ?? new Date(),
        last_seen:     aircraft.last_seen     ?? new Date(),
        last_callsign: aircraft.last_callsign ?? null,
        last_squawk:   aircraft.last_squawk   ?? null,
        operator:      aircraft.operator      ?? null,
        owner:         aircraft.owner         ?? null,
        model:         aircraft.model         ?? null,
      },
      update: {
        last_seen:     aircraft.last_seen     ?? new Date(),
        last_callsign: aircraft.last_callsign ?? undefined,
        last_squawk:   aircraft.last_squawk   ?? undefined,
        operator:      aircraft.operator      ?? undefined,
        owner:         aircraft.owner         ?? undefined,
        model:         aircraft.model         ?? undefined,
      },
    });
  }
}
