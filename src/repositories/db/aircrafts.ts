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
    return prisma.aircraft.findMany({
      where:   { last_seen: { gte: start, lte: end } },
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

  async saveAircraft(aircraft: AircraftDB): Promise<void> {
    await prisma.aircraft.upsert({
      where:  { icao_hex: aircraft.icao_hex },
      create: {
        icao_hex:      aircraft.icao_hex,
        first_seen:    aircraft.first_seen    ?? new Date(),
        last_seen:     aircraft.last_seen     ?? new Date(),
        last_callsign: aircraft.last_callsign ?? null,
        last_squawk:   aircraft.last_squawk   ?? null,
      },
      update: {
        last_seen:     aircraft.last_seen     ?? new Date(),
        last_callsign: aircraft.last_callsign ?? undefined,
        last_squawk:   aircraft.last_squawk   ?? undefined,
      },
    });
  }
}
