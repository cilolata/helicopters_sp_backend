import { Request, Response } from 'express';
import { makeGetHelicoptersUseCase } from '../use-cases.ts/factory/make-save-helicopters';
import { makeGetTodayAircraftsUseCase } from '../use-cases.ts/factory/make-get-today-aircrafts';
import { AircraftsRepository } from '../repositories/db/aircrafts';

export const aircrafts = async (_req: Request, res: Response) => {
  try {
    const result = await makeGetHelicoptersUseCase().execute();
    res.json(result);
  } catch (err) {
    console.error('[aircrafts]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const aircraftsToday = async (_req: Request, res: Response) => {
  try {
    const result = await makeGetTodayAircraftsUseCase().execute();
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/today]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const ICAO_RE = /^[0-9A-Fa-f]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const aircraftsHistory = async (req: Request, res: Response) => {
  try {
    const date = String(req.query.date ?? '');
    if (!DATE_RE.test(date)) {
      res.status(400).json({ error: 'Parâmetro date inválido. Use YYYY-MM-DD.' });
      return;
    }
    const repo = new AircraftsRepository();
    const result = await repo.findByDate(date);
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/history]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const aircraftRoute = async (req: Request, res: Response) => {
  try {
    const icao = String(req.params.icao);
    if (!ICAO_RE.test(icao)) {
      res.status(400).json({ error: 'ICAO inválido' });
      return;
    }
    const repo = new AircraftsRepository();
    const result = await repo.findRoute(icao.toUpperCase());
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/route]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
