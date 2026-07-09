import { AircraftDB } from "../../entities/models/aircraft.interface";
import prisma from "../../config/database";

export class AircraftsRepository {
  async findToday() {
    // Get today's date in BRT (UTC-3)
    const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
    return this.findByDate(brtNow.toISOString().slice(0, 10));
  }

  async findByDate(dateStr: string) {
    type Row = { icao_hex: string; last_callsign: string | null; first_seen: Date; last_seen: Date };
    return prisma.$queryRaw<Row[]>`
      SELECT a.icao_hex, a.last_callsign, df.first_seen, df.last_seen
      FROM daily_flights df
      JOIN aircraft a ON a.icao_hex = df.icao_hex
      WHERE df.flight_date = ${dateStr}
      ORDER BY df.last_seen DESC
    `;
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
    type Row = {
      icao_hex: string; last_callsign: string | null; owner: string | null;
      model: string | null; operator: string | null;
      first_seen: Date; last_seen: Date;
      lat: number | null; lon: number | null; altitude: number | null;
    };
    return prisma.$queryRaw<Row[]>`
      SELECT a.icao_hex, a.last_callsign, a.owner, a.model, a.operator,
             df.first_seen, df.last_seen,
             df.last_lat AS lat, df.last_lon AS lon, df.last_alt AS altitude
      FROM daily_flights df
      JOIN aircraft a ON a.icao_hex = df.icao_hex
      WHERE df.flight_date = ${dateStr}
      ORDER BY df.last_seen DESC
    `;
  }

  async deleteOldPositions(): Promise<number> {
    // Delete positions from before today's BRT midnight (= UTC 03:00 today).
    // History is kept in daily_flights; positions are only needed for live route display.
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setUTCHours(3, 0, 0, 0);
    if (cutoff > now) cutoff.setUTCDate(cutoff.getUTCDate() - 1);
    const result = await prisma.position.deleteMany({
      where: { captured_at: { lt: cutoff } },
    });
    return result.count;
  }

  async saveDailyFlight(icao_hex: string, flight_date: string, now: Date, lat: number, lon: number, altitude: number | null): Promise<void> {
    await prisma.dailyFlight.upsert({
      where:  { icao_hex_flight_date: { icao_hex, flight_date } },
      create: { icao_hex, flight_date, first_seen: now, last_seen: now, last_lat: lat, last_lon: lon, last_alt: altitude },
      update: { last_seen: now, last_lat: lat, last_lon: lon, last_alt: altitude },
    });
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
