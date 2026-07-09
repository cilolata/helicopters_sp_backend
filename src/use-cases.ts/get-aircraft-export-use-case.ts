import { IAircraftsRepository } from "../repositories/aircrafts.repository.interface";

export class GetAircraftExportUseCase {
  constructor(private repository: IAircraftsRepository) {}

  async execute(date: string) {
    return this.repository.findForExport(date);
  }
}
