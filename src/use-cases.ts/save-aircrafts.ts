import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";
import { AircraftRaw, Dump1090Response } from "../entities/models/aircraft.interface";
import { helicopterRegistry } from "../lib/helicopter-registry";
import { updateCache, LiveAircraft } from "../lib/aircraft-cache";

function toAlt(v: number | string | null | undefined): number | null {
  if (v == null || v === 'ground') return null;
  return typeof v === 'number' ? v : null;
}

function normalizeCallsign(flight: string): string {
  return flight.trim().replace(/-/g, '').toUpperCase();
}

export class SaveAircraftUseCase {
  constructor(private repository: IAircraftsRepository) {}

  private static readonly SP_BOUNDS = {
    minLat: -24.010, maxLat: -23.356,
    minLon: -46.826, maxLon: -46.365,
  };

  private isInSaoPaulo(ac: AircraftRaw): boolean {
    const { minLat, maxLat, minLon, maxLon } = SaveAircraftUseCase.SP_BOUNDS;
    return ac.lat! >= minLat && ac.lat! <= maxLat &&
           ac.lon! >= minLon && ac.lon! <= maxLon;
  }

  private isValid(ac: AircraftRaw): boolean {
    return !!ac.hex && ac.lat != null && ac.lon != null && (ac.messages ?? 0) >= 1;
  }

  async execute(response: Dump1090Response): Promise<void> {
    const now  = new Date();
    const live: LiveAircraft[] = [];

    const list = response.aircraft ?? response.ac ?? [];
    for (const ac of list) {
      if (ac.on_ground != null && ac.ground == null) ac.ground = ac.on_ground;
      if (!this.isValid(ac))      continue;
      if (!this.isInSaoPaulo(ac)) continue;
      if (ac.ground)              continue;

      const callsign = ac.flight ? normalizeCallsign(ac.flight) : '';
      const entry    = callsign ? helicopterRegistry.get(callsign) : undefined;
      if (!entry) continue;

      const icao = ac.hex.toUpperCase().padStart(6, "0");

      live.push({
        icao_hex:     icao,
        callsign:     ac.flight?.trim() ?? null,
        owner:        entry.owner,
        model:        entry.model,
        altitude:     toAlt(ac.alt_geom) ?? toAlt(ac.alt_baro) ?? null,
        ground_speed: ac.gs ?? null,
        track:        ac.track ?? null,
        vert_rate:    ac.baro_rate ?? ac.vert_rate ?? null,
        lat:          ac.lat!,
        lon:          ac.lon!,
        on_ground:    ac.ground ? 1 : 0,
        captured_at:  now.toISOString(),
        type:         'helicopter',
      });

      await Promise.all([
        this.repository.savePosition(icao, ac.lat!, ac.lon!, toAlt(ac.alt_geom) ?? toAlt(ac.alt_baro) ?? null),
        this.repository.saveAircraft({
          icao_hex:      icao,
          first_seen:    now,
          last_seen:     now,
          last_callsign: ac.flight?.trim().slice(0, 10) ?? null,
          last_squawk:   ac.squawk?.slice(0, 4) ?? null,
        }),
      ]);
    }

    updateCache(live);
  }
}
