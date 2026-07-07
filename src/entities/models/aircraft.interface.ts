export interface AircraftRaw {
  hex:        string;
  flight?:    string | null;
  squawk?:    string | null;
  alt_geom?:  number | string | null;
  alt_baro?:  number | string | null;
  gs?:        number | null;
  track?:     number | null;
  baro_rate?: number | null;
  vert_rate?: number | null;
  lat?:       number | null;
  lon?:       number | null;
  rssi?:      number | null;
  messages?:  number | null;
  seen?:      number | null;
  ground?:    boolean | null;
  on_ground?: boolean | null; // ADSB.fi usa on_ground
  category?:  string | null;  // A7 = helicóptero
}

export interface AircraftDB {
  id?:           number | null;
  icao_hex:      string     ;
  first_seen?:   Date;
  last_seen?:    Date;
  last_callsign?: string | null;
  last_squawk?:  string | null;
}

export interface PositionDB {
  id?:          number | null;
  icao_hex:     string;
  captured_at?: Date;
  callsign?:    string | null;
  squawk?:      string | null;
  altitude?:    number | null;
  ground_speed?: number | null;
  track?:       number | null;
  vert_rate?:   number | null;
  lat?:         number | null;
  lon?:         number | null;
  rssi?:        number | null;
  messages?:    number | null;
  on_ground?:   number | null;
}

export interface Dump1090Response {
  aircraft?: AircraftRaw[]; // dump1090
  ac?:       AircraftRaw[]; // adsb.fi
  messages?: number;
  now?:      number;
}