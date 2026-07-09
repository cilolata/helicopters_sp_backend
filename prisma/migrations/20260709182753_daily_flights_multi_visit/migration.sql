-- DropIndex
DROP INDEX "daily_flights_icao_hex_flight_date_key";

-- CreateIndex
CREATE INDEX "daily_flights_icao_hex_flight_date_last_seen_idx" ON "daily_flights"("icao_hex", "flight_date", "last_seen" DESC);
