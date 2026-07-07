import { AircraftDB } from "../../entities/models/aircraft.interface";
import prisma from "../../config/database";

export class AircraftsRepository {
  async findToday() {
    return this.findByDate(new Date().toISOString().slice(0, 10));
  }

  async findByDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end   = new Date(y, m - 1, d, 23, 59, 59, 999);
    return prisma.aircraft.findMany({
      where:   { last_seen: { gte: start, lte: end } },
      orderBy: { last_seen: 'desc' },
    });
  }

  async savePosition(icao_hex: string, lat: number, lon: number, altitude: number | null): Promise<void> {
    await prisma.position.create({ data: { icao_hex, lat, lon, altitude } });
  }

  async findRoute(icao_hex: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return prisma.position.findMany({
      where:   { icao_hex, captured_at: { gte: start } },
      select:  { lat: true, lon: true, captured_at: true },
      orderBy: { captured_at: 'asc' },
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
