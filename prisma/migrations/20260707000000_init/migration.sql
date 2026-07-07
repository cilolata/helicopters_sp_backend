-- CreateTable
CREATE TABLE "aircraft" (
    "icao_hex"      VARCHAR(6)    NOT NULL,
    "first_seen"    TIMESTAMPTZ(6) NOT NULL,
    "last_seen"     TIMESTAMPTZ(6) NOT NULL,
    "last_callsign" VARCHAR(10),
    "last_squawk"   VARCHAR(4),

    CONSTRAINT "aircraft_pkey" PRIMARY KEY ("icao_hex")
);

-- CreateTable
CREATE TABLE "positions" (
    "id"           SERIAL        NOT NULL,
    "icao_hex"     VARCHAR(6)    NOT NULL,
    "captured_at"  TIMESTAMPTZ(6) NOT NULL,
    "callsign"     VARCHAR(10),
    "squawk"       VARCHAR(4),
    "altitude"     FLOAT8,
    "ground_speed" FLOAT8,
    "track"        FLOAT8,
    "vert_rate"    FLOAT8,
    "lat"          FLOAT8,
    "lon"          FLOAT8,
    "rssi"         FLOAT8,
    "messages"     INT4,
    "on_ground"    INT2,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_positions_icao_captured" ON "positions"("icao_hex", "captured_at" DESC);
