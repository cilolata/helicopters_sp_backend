import { Request, Response } from 'express';
import { makeGetAircraftExportUseCase } from '../use-cases.ts/factory/make-get-aircraft-export';
import { parseDateParam } from './validators';

export const aircraftsExport = async (req: Request, res: Response) => {
  try {
    const date = parseDateParam(req);
    if (!date) {
      res.status(400).json({ error: 'Parâmetro date inválido. Use YYYY-MM-DD.' });
      return;
    }
    const result = await makeGetAircraftExportUseCase().execute(date);
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/export]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
