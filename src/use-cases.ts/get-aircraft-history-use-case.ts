import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";

export class GetAircraftHistoryUseCase {
  constructor(private repository: IAircraftsRepository) {}

  async execute(date: string) {
    return this.repository.findByDate(date);
  }
}
