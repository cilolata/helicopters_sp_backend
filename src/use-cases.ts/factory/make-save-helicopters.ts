import { GetAllAircraftsUseCase } from "../get-helicopters-use-case";

export function makeGetHelicoptersUseCase(): GetAllAircraftsUseCase {
  return new GetAllAircraftsUseCase();
}
