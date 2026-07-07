import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";

export class GetTodayAircraftsUseCase {
  constructor(private repository: IAircraftsRepository) {}

  async execute() {
    return this.repository.findToday();
  }
}
