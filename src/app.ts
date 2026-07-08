import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./env";
import "./utils/scheduler";
import { aircrafts, aircraftsToday, aircraftRoute, aircraftsHistory } from "./controllers/aircrafts";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      connectSrc:  ["'self'"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
    },
  },
}));

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

const liveLimit    = rateLimit({ windowMs: 10_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const historyLimit = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

app.get("/aircrafts",            liveLimit,    aircrafts);
app.get("/aircrafts/today",      historyLimit, aircraftsToday);
app.get("/aircrafts/history",    historyLimit, aircraftsHistory);
app.get("/aircrafts/:icao/route", historyLimit, aircraftRoute);

export { app };
