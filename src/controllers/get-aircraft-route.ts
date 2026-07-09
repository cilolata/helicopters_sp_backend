import { Request, Response } from 'express';
import { makeGetAircraftRouteUseCase } from '../use-cases.ts/factory/make-get-aircraft-route';
import { ICAO_RE } from './validators';

export const aircraftRoute = async (req: Request, res: Response) => {
  try {
    const icao = String(req.params.icao);
    if (!ICAO_RE.test(icao)) {
      res.status(400).json({ error: 'ICAO inválido' });
      return;
    }
    const result = await makeGetAircraftRouteUseCase().execute(icao.toUpperCase());
    res.json(result);
  } catch (err) {
    console.error('[aircrafts/route]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
