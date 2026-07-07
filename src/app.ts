import express from "express";
import cors from "cors";
import helmet from "helmet";
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

app.get("/aircrafts", aircrafts);
app.get("/aircrafts/today", aircraftsToday);
app.get("/aircrafts/history", aircraftsHistory);
app.get("/aircrafts/:icao/route", aircraftRoute);

export { app };
