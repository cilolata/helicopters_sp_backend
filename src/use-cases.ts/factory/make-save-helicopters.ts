import { GetHelicoptersUseCase } from "../get-helicopters-use-case";

export function makeGetHelicoptersUseCase(): GetHelicoptersUseCase {
  return new GetHelicoptersUseCase();
}
