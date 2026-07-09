import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { GetAircraftRouteUseCase } from "../get-aircraft-route-use-case";

export function makeGetAircraftRouteUseCase(): GetAircraftRouteUseCase {
  return new GetAircraftRouteUseCase(new AircraftsRepository());
}
