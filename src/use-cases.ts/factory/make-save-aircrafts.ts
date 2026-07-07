import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { SaveAircraftUseCase } from "../save-aircrafts";

export function makeSaveAircraftUseCase(): SaveAircraftUseCase {
  const repository = new AircraftsRepository();
  return new SaveAircraftUseCase(repository);
}