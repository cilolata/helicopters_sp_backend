import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { SaveAircraftUseCase } from "../save-aircrafts";
import { helicopterRegistry } from "../../lib/helicopter-registry";

export function makeSaveAircraftUseCase(): SaveAircraftUseCase {
  return new SaveAircraftUseCase(new AircraftsRepository(), helicopterRegistry);
}