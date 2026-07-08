export const env = {
  port:           parseInt(process.env.PORT             || "3000"),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "5000"),
  dump1090Url:    process.env.DUMP1090_HOST              ?? "",
  corsOrigin:     process.env.CORS_ORIGIN                ?? "",
};
