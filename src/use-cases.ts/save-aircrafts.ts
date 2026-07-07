import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";
import { AircraftRaw, Dump1090Response } from "../entities/models/aircraft.interface";
import { helicopterRegistry } from "../lib/helicopter-registry";
import { updateCache, LiveAircraft } from "../lib/aircraft-cache";

function toAlt(v: number | string | null | undefined): number | null {
  if (v == null || v === 'ground') return null;
  return typeof v === 'number' ? v : null;
}

export class SaveAircraftUseCase {
  constructor(private repository: IAircraftsRepository) {}

  // Bounding box do município de São Paulo (capital)
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

  private static AIRLINE_PREFIXES = ['GOL', 'GLO', 'TAM', 'AZU', 'ONE', 'BRL', 'PTB', 'LAM', 'VRG'];

  private isHelicopter(ac: AircraftRaw): boolean {
    if (ac.ground) return false;

    const callsign = ac.flight?.trim() ?? '';

    // Rejeita prefixos de companhias aéreas conhecidas
    if (callsign && SaveAircraftUseCase.AIRLINE_PREFIXES.some(p => callsign.startsWith(p))) return false;

    // Confirmação positiva pelo campo category do ADS-B (A7 = rotorcraft)
    if (ac.category === 'A7') return true;

    // Confirmação positiva pelo registro ANAC
    if (callsign && helicopterRegistry.has(callsign)) return true;

    // Se tem callsign mas não está no registro → provavelmente avião
    if (callsign) return false;

    // Sem callsign: aceita só se altitude E velocidade forem muito baixas
    const altitude = toAlt(ac.alt_geom) ?? toAlt(ac.alt_baro);
    const speed    = ac.gs ?? null;
    if (altitude != null && altitude >= 1500) return false;
    if (speed    != null && speed    >= 100)  return false;

    // Sem callsign, baixo e lento: possivelmente helicóptero local
    return altitude != null || speed != null;
  }

  async execute(response: Dump1090Response): Promise<void> {
    const now = new Date();
    const live: LiveAircraft[] = [];

    const list = response.aircraft ?? response.ac ?? [];
    for (const ac of list) {
      // normaliza campo ground (dump1090 usa `ground`, adsb.fi usa `on_ground`)
      if (ac.on_ground != null && ac.ground == null) ac.ground = ac.on_ground;
      if (!this.isValid(ac))        continue;
      if (!this.isInSaoPaulo(ac))   continue;
      if (!this.isHelicopter(ac))   continue;

      const icao = ac.hex.toUpperCase().padStart(6, "0");

      live.push({
        icao_hex:     icao,
        callsign:     ac.flight?.trim() ?? null,
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

      await this.repository.savePosition(icao, ac.lat!, ac.lon!, toAlt(ac.alt_geom) ?? toAlt(ac.alt_baro) ?? null);
      await this.repository.saveAircraft({
        icao_hex:      icao,
        first_seen:    now,
        last_seen:     now,
        last_callsign: ac.flight?.trim() ?? null,
        last_squawk:   ac.squawk ?? null,
      });
    }

    updateCache(live);
  }
}
