import { getCache } from "../lib/aircraft-cache";

export class GetAllAircraftsUseCase {
  async execute() {
    return getCache();
  }
}
