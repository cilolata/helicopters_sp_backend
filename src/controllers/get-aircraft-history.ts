import { Request, Response } from 'express';
import { makeGetAircraftHistoryUseCase } from '../use-cases.ts/factory/make-get-aircraft-history';
import { parseDateParam } from './validators';

export const aircraftsHistory = async (req: Request, res: Response) => {
  try {
    const date = parseDateParam(req);
    if (!date) {
      res.status(400).json({ error: 'Parâmetro date inválido. Use YYYY-MM-DD.' });
      return;
    }
    const result = await makeGetAircraftHistoryUseCase().execute(date);
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/history]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
