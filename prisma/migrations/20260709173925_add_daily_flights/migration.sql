-- CreateTable
CREATE TABLE "daily_flights" (
    "id" SERIAL NOT NULL,
    "icao_hex" VARCHAR(6) NOT NULL,
    "flight_date" VARCHAR(10) NOT NULL,
    "first_seen" TIMESTAMPTZ(6) NOT NULL,
    "last_seen" TIMESTAMPTZ(6) NOT NULL,
    "last_lat" DOUBLE PRECISION,
    "last_lon" DOUBLE PRECISION,
    "last_alt" INTEGER,

    CONSTRAINT "daily_flights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_flights_flight_date_idx" ON "daily_flights"("flight_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_flights_icao_hex_flight_date_key" ON "daily_flights"("icao_hex", "flight_date");

-- CreateIndex
CREATE INDEX "aircraft_last_seen_idx" ON "aircraft"("last_seen" DESC);
