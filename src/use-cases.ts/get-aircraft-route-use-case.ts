import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";

export class GetAircraftRouteUseCase {
  constructor(private repository: IAircraftsRepository) {}

  async execute(icao: string) {
    return this.repository.findRoute(icao);
  }
}
