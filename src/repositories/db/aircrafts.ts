import { AircraftDB } from "../../entities/models/aircraft.interface";
import prisma from "../../config/database";
import { brtDateString, brtMidnightCutoff } from "../../utils/brt";

export class AircraftsRepository {
  async findToday() {
    return this.findByDate(brtDateString());
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
    const start = brtMidnightCutoff();
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
    // History is kept in daily_flights; positions are only needed for live route display.
    const result = await prisma.position.deleteMany({
      where: { captured_at: { lt: brtMidnightCutoff() } },
    });
    return result.count;
  }

  async saveDailyFlight(icao_hex: string, flight_date: string, now: Date, lat: number, lon: number, altitude: number | null): Promise<void> {
    // Gap > 15 min without a sighting = aircraft left SP; create a new visit record
    const GAP_MS = 15 * 60 * 1000;
    const cutoff = new Date(now.getTime() - GAP_MS);
    const active = await prisma.dailyFlight.findFirst({
      where:   { icao_hex, flight_date, last_seen: { gte: cutoff } },
      orderBy: { last_seen: 'desc' },
    });
    if (active) {
      await prisma.dailyFlight.update({
        where: { id: active.id },
        data:  { last_seen: now, last_lat: lat, last_lon: lon, last_alt: altitude },
      });
    } else {
      await prisma.dailyFlight.create({
        data: { icao_hex, flight_date, first_seen: now, last_seen: now, last_lat: lat, last_lon: lon, last_alt: altitude },
      });
    }
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
