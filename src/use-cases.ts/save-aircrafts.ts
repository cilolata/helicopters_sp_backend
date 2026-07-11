import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";
import { AircraftRaw, Dump1090Response } from "../entities/models/aircraft.interface";
import { updateCache, LiveAircraft } from "../lib/aircraft-cache";
import { brtDateString } from "../utils/brt";
import { AnacEntry } from "../lib/helicopter-registry";

export type { AnacEntry };

function toAlt(v: number | string | null | undefined): number | null {
  if (v == null || v === 'ground') return null;
  return typeof v === 'number' ? v : null;
}

function normalizeCallsign(flight: string): string {
  return flight.trim().replace(/-/g, '').toUpperCase();
}

export class SaveAircraftUseCase {
  constructor(
    private repository: IAircraftsRepository,
    private registry: Map<string, AnacEntry>,
  ) {}

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

  private isPolice(entry: AnacEntry | undefined): boolean {
    const ownerAndOperator = `${entry?.owner ?? ''} ${entry?.operator ?? ''}`.toLowerCase();
    return ownerAndOperator.includes('polici') || ownerAndOperator.includes('POLÍCIA');
  }

  async execute(response: Dump1090Response): Promise<void> {
    const now  = new Date();
    const brtDate = brtDateString(now);
    const live: LiveAircraft[] = [];

    const list = response.aircraft ?? response.ac ?? [];
    for (const ac of list) {
      if (ac.on_ground != null && ac.ground == null) ac.ground = ac.on_ground;
      if (!this.isValid(ac))      continue;
      if (!this.isInSaoPaulo(ac)) continue;
      if (ac.ground)              continue;

      const callsign = ac.flight ? normalizeCallsign(ac.flight) : '';
      const entry    = callsign ? this.registry.get(callsign) : undefined;
      const isHelicopter = !!entry || ac.category === 'A7';
      if (!isHelicopter)        continue;
      if (this.isPolice(entry)) continue;

      const icao = ac.hex.toUpperCase().padStart(6, "0");
      const alt  = toAlt(ac.alt_geom) ?? toAlt(ac.alt_baro) ?? null;

      live.push({
        icao_hex:     icao,
        callsign:     ac.flight?.trim() ?? null,
        owner:        entry?.owner    ?? null,
        model:        entry?.model    ?? null,
        operator:     entry?.operator ?? null,
        altitude:     alt,
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
        this.repository.savePosition(icao, ac.lat!, ac.lon!, alt),
        this.repository.saveDailyFlight(icao, brtDate, now, ac.lat!, ac.lon!, alt),
        this.repository.saveAircraft({
          icao_hex:      icao,
          first_seen:    now,
          last_seen:     now,
          last_callsign: ac.flight?.trim().slice(0, 10) ?? null,
          last_squawk:   ac.squawk?.slice(0, 4) ?? null,
          operator:      entry?.operator ?? null,
          owner:         entry?.owner    ?? null,
          model:         entry?.model    ?? null,
        }),
      ]);
    }

    updateCache(live);
  }
}
