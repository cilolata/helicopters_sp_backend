import { env } from "../env";
import { makeSaveAircraftUseCase } from "../use-cases.ts/factory/make-save-aircrafts";

const FETCH_TIMEOUT_MS = 25_000;

async function init(): Promise<void> {
  const useCase = await makeSaveAircraftUseCase();

  let running = false;

  async function collect(): Promise<void> {
    if (running) return; // skip tick if previous request is still in flight
    running = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(env.dump1090Url, { signal: controller.signal });
      if (!res.ok) {
        console.error(`❌ Erro na coleta: HTTP ${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      await useCase.execute(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error(`❌ Erro na coleta: timeout após ${FETCH_TIMEOUT_MS}ms`);
      } else {
        console.error(`❌ Erro na coleta:`, err?.cause ?? err?.message ?? err);
      }
    } finally {
      clearTimeout(timer);
      running = false;
    }
  }

  collect();
  setInterval(collect, env.pollIntervalMs);
}

init().catch(err => {
  console.error('❌ Falha ao inicializar scheduler:', err);
  process.exit(1);
});
