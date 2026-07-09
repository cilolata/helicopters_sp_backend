import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { GetAircraftExportUseCase } from "../get-aircraft-export-use-case";

export function makeGetAircraftExportUseCase(): GetAircraftExportUseCase {
  return new GetAircraftExportUseCase(new AircraftsRepository());
}
