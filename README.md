# Helicopters Radar SP — Backend

API Node.js/Express que coleta sinais ADS-B de um receptor dump1090 local, persiste as posições em PostgreSQL e serve os dados para o frontend.

---

## Fluxo de dados

```
dump1090 (/data/aircraft.json)
        │
        │  HTTP GET a cada 5 s (scheduler.ts)
        ▼
SaveAircraftUseCase
  ├─ valida (hex + lat/lon + ≥1 msg)
  ├─ filtra bounding box São Paulo
  ├─ descarta em solo (on_ground/ground)
  ├─ cruza com registro ANAC (callsign → owner/model/operator)
  │     └─ descarta aeronaves sem entrada no registro
  ├─ persiste → PostgreSQL
  │     ├─ positions (append)
  │     └─ aircraft  (upsert last_seen)
  └─ atualiza in-memory cache
        │
        ▼
GET /aircrafts → retorna cache (sem hit no banco por requisição)
```

---

## Registro ANAC

`prisma/data/anac-registry.json` é o filtro central do sistema: apenas aeronaves com matrícula presente nesse arquivo chegam à API. É carregado em um `Map<callsign, {owner, model, operator}>` na inicialização (`helicopter-registry.ts`). Atualizar o arquivo e reiniciar o servidor é suficiente para incluir novas matrículas.

---

## API

| Método | Rota | Rate limit | Descrição |
|---|---|---|---|
| GET | `/aircrafts` | 10 req / 10 s | Helicópteros ao vivo (cache) |
| GET | `/aircrafts/today` | 30 req / 60 s | Voos do dia (BRT) |
| GET | `/aircrafts/history?date=YYYY-MM-DD` | 30 req / 60 s | Voos de uma data |
| GET | `/aircrafts/export?date=YYYY-MM-DD` | 30 req / 60 s | Export com última posição (para PDF) |
| GET | `/aircrafts/:icao/route` | 30 req / 60 s | Rota do dia do ICAO (até 2 000 pontos) |

---

## Banco de dados

```
aircraft                               positions
──────────────────────────────         ───────────────────────────────
icao_hex      VARCHAR(6)   PK          id          SERIAL  PK
first_seen    TIMESTAMPTZ              icao_hex    VARCHAR(6)
last_seen     TIMESTAMPTZ  ← índice    lat         FLOAT
last_callsign VARCHAR(10)              lon         FLOAT
last_squawk   VARCHAR(4)               altitude    INT
operator      VARCHAR(200)             captured_at TIMESTAMPTZ ← índice
owner         VARCHAR(200)                         (icao_hex, captured_at DESC)
model         VARCHAR(100)
```

`positions` é append-only. O índice `(icao_hex, captured_at DESC)` serve as queries de rota e export. `cleanup.ts` apaga posições anteriores à meia-noite BRT diariamente (se reagenda via `setTimeout` para a próxima meia-noite).

### Timezone BRT

Todas as queries por data convertem o intervalo para UTC: `BRT 00:00` = `UTC 03:00` do mesmo dia, `BRT 23:59:59` = `UTC 02:59:59` do dia seguinte.

---

## Estrutura

```
src/
  app.ts                        Express + rotas + middlewares
  server.ts                     Ponto de entrada (listen)
  env/index.ts                  Variáveis de ambiente validadas
  utils/
    scheduler.ts                Loop de coleta (setInterval + flag running)
    cleanup.ts                  Limpeza diária de positions
  use-cases.ts/
    save-aircrafts.ts           Filtragem, persistência e atualização do cache
    get-helicopters-use-case.ts Lê o cache
    get-today-aircrafts-use-case.ts  Delega ao repositório
    factory/                    Wiring de dependências
  lib/
    aircraft-cache.ts           Array de módulo (LiveAircraft[]) — cache in-memory
    helicopter-registry.ts      Carrega anac-registry.json no startup
  repositories/db/aircrafts.ts  Queries Prisma (findByDate, findRoute, savePosition…)
  controllers/aircrafts.ts      Handlers Express
  entities/models/              Interfaces TypeScript (AircraftRaw, AircraftDB…)
  config/database.ts            Instância do Prisma Client
```

---

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env`:

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | — | Connection string Prisma (pooler) |
| `DIRECT_URL` | — | Connection string direta (migrations) |
| `PORT` | `3000` | Porta do servidor Express |
| `DUMP1090_URL` | `http://192.168.15.18/dump1090/data/aircraft.json` | Feed ADS-B |
| `POLL_INTERVAL_MS` | `5000` | Intervalo de coleta em ms |
| `CORS_ORIGIN` | `*` | Origem permitida pelo CORS |

---

## Comandos

```bash
npm run dev    # nodemon com hot-reload
npm run build  # tsc → dist/
npm start      # node dist/server.js
```
