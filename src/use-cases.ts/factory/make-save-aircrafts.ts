import { AircraftsRepository } from "../../repositories/db/aircrafts";
import { SaveAircraftUseCase } from "../save-aircrafts";
import { loadHelicopterRegistry } from "../../lib/helicopter-registry";

export async function makeSaveAircraftUseCase(): Promise<SaveAircraftUseCase> {
  const registry = await loadHelicopterRegistry();
  return new SaveAircraftUseCase(new AircraftsRepository(), registry);
}
