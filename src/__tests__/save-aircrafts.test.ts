import { SaveAircraftUseCase } from '../use-cases.ts/save-aircrafts';
import { IAircraftsRepository } from '../repositories/aircrafts.repository.interface';
import { Dump1090Response } from '../entities/models/aircraft.interface';
import { getCache } from '../lib/aircraft-cache';

const testRegistry = new Map([
  ['PPAIS', { owner: 'LUCAS MARTINS CARDOSO', model: 'R44',  operator: null }],
  ['PPDUM', { owner: 'DU MOTOS LTDA',          model: 'R66',  operator: null }],
  ['PRAEL', { owner: 'EMPRESA AEREA LTDA',      model: 'S61',  operator: null }],
]);

const mockRepo: IAircraftsRepository = {
  savePosition:       jest.fn().mockResolvedValue(undefined),
  saveAircraft:       jest.fn().mockResolvedValue(undefined),
  saveDailyFlight:    jest.fn().mockResolvedValue(undefined),
  findToday:          jest.fn().mockResolvedValue([]),
  findByDate:         jest.fn().mockResolvedValue([]),
  findForExport:      jest.fn().mockResolvedValue([]),
  findRoute:          jest.fn().mockResolvedValue([]),
  deleteOldPositions: jest.fn().mockResolvedValue(0),
};

// Helicóptero válido dentro de São Paulo
const validHelicopter = {
  hex:      'e48832',
  flight:   'PP-AIS',
  lat:      -23.55,
  lon:      -46.63,
  messages: 5,
  gs:       60,
  alt_baro: 800,
  track:    90,
};

function makeResponse(overrides = {}): Dump1090Response {
  return { aircraft: [{ ...validHelicopter, ...overrides }] };
}

describe('SaveAircraftUseCase — filtragem de helicópteros', () => {
  let useCase: SaveAircraftUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SaveAircraftUseCase(mockRepo, testRegistry);
  });

  it('aceita aeronave com matrícula ANAC de helicóptero (PP-AIS → PPAIS)', async () => {
    await useCase.execute(makeResponse());
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(1);
    expect(mockRepo.saveAircraft).toHaveBeenCalledTimes(1);
  });

  it('normaliza matrícula com hífen (PP-AIS = PPAIS)', async () => {
    await useCase.execute(makeResponse({ flight: 'PP-AIS' }));
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(1);
  });

  it('normaliza matrícula em minúsculo (ppais = PPAIS)', async () => {
    await useCase.execute(makeResponse({ flight: 'ppais' }));
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(1);
  });

  it('rejeita aeronave cuja matrícula não está no registro ANAC', async () => {
    await useCase.execute(makeResponse({ flight: 'GOLTESTE' }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave sem callsign/matrícula', async () => {
    await useCase.execute(makeResponse({ flight: '' }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave em solo (ground = true)', async () => {
    await useCase.execute(makeResponse({ ground: true }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave em solo (on_ground = true)', async () => {
    await useCase.execute(makeResponse({ on_ground: true }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave sem lat/lon', async () => {
    await useCase.execute(makeResponse({ lat: null, lon: null }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave sem hex', async () => {
    await useCase.execute(makeResponse({ hex: '' }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave com 0 mensagens ADS-B', async () => {
    await useCase.execute(makeResponse({ messages: 0 }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave fora dos limites de São Paulo (norte)', async () => {
    await useCase.execute(makeResponse({ lat: -22.0, lon: -46.63 }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('rejeita aeronave fora dos limites de São Paulo (leste)', async () => {
    await useCase.execute(makeResponse({ lat: -23.55, lon: -45.0 }));
    expect(mockRepo.savePosition).not.toHaveBeenCalled();
  });

  it('aceita aeronave nos limites extremos de São Paulo', async () => {
    // Sul-oeste extremo (dentro)
    await useCase.execute(makeResponse({ lat: -23.99, lon: -46.80 }));
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(1);
  });

  it('inclui owner e model corretos no cache ao vivo', async () => {
    await useCase.execute(makeResponse({ flight: 'PPAIS' }));
    const cache = getCache();
    expect(cache[0].owner).toBe('LUCAS MARTINS CARDOSO');
    expect(cache[0].model).toBe('R44');
  });

  it('preenche owner e model de outro helicóptero do registro', async () => {
    await useCase.execute(makeResponse({ flight: 'PP-DUM', hex: 'abc123' }));
    const cache = getCache();
    expect(cache[0].owner).toBe('DU MOTOS LTDA');
    expect(cache[0].model).toBe('R66');
  });

  it('padeia ICAO hex para 6 caracteres', async () => {
    await useCase.execute(makeResponse({ hex: '1a2' }));
    expect(mockRepo.savePosition).toHaveBeenCalledWith('0001A2', expect.any(Number), expect.any(Number), expect.anything());
  });

  it('processa múltiplas aeronaves e filtra corretamente', async () => {
    const response: Dump1090Response = {
      aircraft: [
        { ...validHelicopter, flight: 'PPAIS', hex: 'aaa111' },   // válido
        { ...validHelicopter, flight: 'DESCONHECIDO', hex: 'bbb222' }, // rejeitado
        { ...validHelicopter, flight: 'PP-DUM', hex: 'ccc333' },   // válido
        { ...validHelicopter, flight: 'PPAIS', ground: true, hex: 'ddd444' }, // rejeitado (solo)
      ],
    };
    await useCase.execute(response);
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(2);
    const cache = getCache();
    expect(cache).toHaveLength(2);
  });

  it('usa fonte alternativa "ac" (formato adsb.fi)', async () => {
    const response: Dump1090Response = {
      ac: [{ ...validHelicopter }],
    };
    await useCase.execute(response);
    expect(mockRepo.savePosition).toHaveBeenCalledTimes(1);
  });
});

describe('SaveAircraftUseCase — integridade dos dados salvos', () => {
  let useCase: SaveAircraftUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SaveAircraftUseCase(mockRepo, testRegistry);
  });

  it('salva posição com lat/lon/altitude corretos', async () => {
    await useCase.execute(makeResponse({ alt_geom: 1200 }));
    expect(mockRepo.savePosition).toHaveBeenCalledWith(
      expect.any(String),
      -23.55,
      -46.63,
      1200,
    );
  });

  it('usa alt_baro quando alt_geom está ausente', async () => {
    await useCase.execute(makeResponse({ alt_geom: undefined, alt_baro: 900 }));
    expect(mockRepo.savePosition).toHaveBeenCalledWith(expect.any(String), expect.any(Number), expect.any(Number), 900);
  });

  it('salva altitude null quando aeronave reporta "ground"', async () => {
    await useCase.execute(makeResponse({ alt_baro: 'ground', alt_geom: 'ground' }));
    expect(mockRepo.savePosition).toHaveBeenCalledWith(expect.any(String), expect.any(Number), expect.any(Number), null);
  });
});
