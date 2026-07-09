import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./env";
import "./utils/scheduler";
import "./utils/cleanup";
import { aircrafts } from "./controllers/get-helicopters";
import { aircraftsToday } from "./controllers/get-today-aircrafts";
import { aircraftsHistory } from "./controllers/get-aircraft-history";
import { aircraftsExport } from "./controllers/get-aircraft-export";
import { aircraftRoute } from "./controllers/get-aircraft-route";

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

app.get("/aircrafts",             liveLimit,    aircrafts);
app.get("/aircrafts/today",       historyLimit, aircraftsToday);
app.get("/aircrafts/history",     historyLimit, aircraftsHistory);
app.get("/aircrafts/export",      historyLimit, aircraftsExport);
app.get("/aircrafts/:icao/route", historyLimit, aircraftRoute);

export { app };
