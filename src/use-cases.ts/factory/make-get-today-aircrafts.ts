import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { GetTodayAircraftsUseCase } from "../get-today-aircrafts-use-case";

export function makeGetTodayAircraftsUseCase(): GetTodayAircraftsUseCase {
  return new GetTodayAircraftsUseCase(new AircraftsRepository());
}
