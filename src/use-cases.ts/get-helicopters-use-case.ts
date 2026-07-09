import { getCache } from "../lib/aircraft-cache";

export class GetHelicoptersUseCase {
  async execute() {
    return getCache();
  }
}
