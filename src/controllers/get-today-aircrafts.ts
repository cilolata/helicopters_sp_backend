import { Request, Response } from 'express';
import { makeGetTodayAircraftsUseCase } from '../use-cases.ts/factory/make-get-today-aircrafts';

export const aircraftsToday = async (_req: Request, res: Response) => {
  try {
    const result = await makeGetTodayAircraftsUseCase().execute();
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/today]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
