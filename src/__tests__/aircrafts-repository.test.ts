/**
 * Testa os cálculos de timezone (BRT = UTC-3) no repositório.
 * Prisma é mockado para inspecionar os parâmetros de consulta.
 */

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    aircraft: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert:   jest.fn().mockResolvedValue({}),
    },
    position: {
      create:   jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import prisma from '../config/database';
import { AircraftsRepository } from '../repositories/db/aircrafts';

const aircraftFindMany = prisma.aircraft.findMany as jest.Mock;
const positionFindMany = prisma.position.findMany as jest.Mock;

describe('AircraftsRepository — timezone BRT (UTC-3)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('findByDate', () => {
    it('define início do dia como 03:00 UTC (meia-noite BRT)', async () => {
      const repo = new AircraftsRepository();
      await repo.findByDate('2025-07-07');

      const { where } = aircraftFindMany.mock.calls[0][0];
      const start: Date = where.last_seen.gte;

      expect(start.getUTCHours()).toBe(3);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCDate()).toBe(7);
      expect(start.getUTCMonth()).toBe(6); // julho = 6 (0-based)
    });

    it('define fim do dia como 02:59:59 UTC do dia seguinte (23:59 BRT)', async () => {
      const repo = new AircraftsRepository();
      await repo.findByDate('2025-07-07');

      const { where } = aircraftFindMany.mock.calls[0][0];
      const end: Date = where.last_seen.lte;

      expect(end.getUTCDate()).toBe(8);    // dia 8 UTC
      expect(end.getUTCHours()).toBe(2);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });

    it('trata corretamente virada de mês (31/07 → 01/08)', async () => {
      const repo = new AircraftsRepository();
      await repo.findByDate('2025-07-31');

      const { where } = aircraftFindMany.mock.calls[0][0];
      const end: Date = where.last_seen.lte;

      expect(end.getUTCMonth()).toBe(7);  // agosto
      expect(end.getUTCDate()).toBe(1);
    });

    it('trata corretamente virada de ano (31/12 → 01/01)', async () => {
      const repo = new AircraftsRepository();
      await repo.findByDate('2025-12-31');

      const { where } = aircraftFindMany.mock.calls[0][0];
      const end: Date = where.last_seen.lte;

      expect(end.getUTCFullYear()).toBe(2026);
      expect(end.getUTCMonth()).toBe(0); // janeiro
      expect(end.getUTCDate()).toBe(1);
    });

    it('ordena por last_seen decrescente', async () => {
      const repo = new AircraftsRepository();
      await repo.findByDate('2025-07-07');
      const { orderBy } = aircraftFindMany.mock.calls[0][0];
      expect(orderBy).toEqual({ last_seen: 'desc' });
    });
  });

  describe('findRoute', () => {
    it('busca posições a partir da meia-noite BRT de hoje (03:00 UTC)', async () => {
      const repo = new AircraftsRepository();
      await repo.findRoute('AABBCC');

      const { where } = positionFindMany.mock.calls[0][0];
      const start: Date = where.captured_at.gte;

      expect(start.getUTCHours()).toBe(3);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);
    });

    it('ordena posições por captured_at ascendente', async () => {
      const repo = new AircraftsRepository();
      await repo.findRoute('AABBCC');
      const { orderBy } = positionFindMany.mock.calls[0][0];
      expect(orderBy).toEqual({ captured_at: 'asc' });
    });
  });
});
