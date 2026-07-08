export interface LiveAircraft {
  icao_hex:     string;
  callsign:     string | null;
  owner:        string | null;
  model:        string | null;
  altitude:     number | null;
  ground_speed: number | null;
  track:        number | null;
  vert_rate:    number | null;
  lat:          number;
  lon:          number;
  on_ground:    number;
  captured_at:  string;
  type:         'helicopter';
}

let cache: LiveAircraft[] = [];

export function updateCache(aircrafts: LiveAircraft[]): void {
  cache = aircrafts;
}

export function getCache(): LiveAircraft[] {
  return cache;
}
