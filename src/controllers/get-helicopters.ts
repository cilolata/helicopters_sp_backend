import { Request, Response } from 'express';
import { makeGetHelicoptersUseCase } from '../use-cases.ts/factory/make-save-helicopters';

export const aircrafts = async (_req: Request, res: Response) => {
  try {
    const result = await makeGetHelicoptersUseCase().execute();
    res.json(result);
  } catch (err) {
    console.error('[aircrafts]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
