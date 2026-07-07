export const env = {
  port:           parseInt(process.env.PORT             || "3000"),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "5000"),
  dump1090Url:    process.env.DUMP1090_HOST              ?? "http://192.168.15.18/dump1090/data/aircraft.json",
  corsOrigin:     process.env.CORS_ORIGIN                ?? "http://localhost:5173",
};
