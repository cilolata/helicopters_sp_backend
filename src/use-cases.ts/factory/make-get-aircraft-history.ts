import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { GetAircraftHistoryUseCase } from "../get-aircraft-history-use-case";

export function makeGetAircraftHistoryUseCase(): GetAircraftHistoryUseCase {
  return new GetAircraftHistoryUseCase(new AircraftsRepository());
}
