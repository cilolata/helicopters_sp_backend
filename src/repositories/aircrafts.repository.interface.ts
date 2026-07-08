import { AircraftDB } from "../entities/models/aircraft.interface";

export interface IAircraftsRepository {
  findToday(): Promise<{ icao_hex: string; last_callsign: string | null; first_seen: Date; last_seen: Date }[]>;
  findByDate(dateStr: string): Promise<{ icao_hex: string; last_callsign: string | null; first_seen: Date; last_seen: Date }[]>;
  findForExport(dateStr: string): Promise<{ icao_hex: string; last_callsign: string | null; owner: string | null; model: string | null; operator: string | null; first_seen: Date; last_seen: Date; lat: number | null; lon: number | null; altitude: number | null }[]>;
  saveAircraft(aircraft: AircraftDB): Promise<void>;
  savePosition(icao_hex: string, lat: number, lon: number, altitude: number | null): Promise<void>;
  findRoute(icao_hex: string): Promise<{ lat: number; lon: number; captured_at: Date }[]>;
  deleteOldPositions(): Promise<number>;
}
