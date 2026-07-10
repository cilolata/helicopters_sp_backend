#!/usr/bin/env node
/**
 * Carga única: lê prisma/data/anac-registry.json e popula anac_registry no banco.
 * Execute apenas uma vez após rodar `npm run db:migrate`.
 *
 * Uso:
 *   node scripts/seed-anac-from-json.js
 */

const { readFileSync, existsSync } = require('fs');
const { join }                     = require('path');
const { PrismaClient }             = require('@prisma/client');

const jsonPath = join(__dirname, '../prisma/data/anac-registry.json');
if (!existsSync(jsonPath)) {
  console.error(`Arquivo não encontrado: ${jsonPath}`);
  process.exit(1);
}

async function main() {
  const raw      = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const entries  = Object.entries(raw);
  const prisma   = new PrismaClient();

  const rows = entries.map(([registration, data]) => ({
    registration,
    owner:    data.owner    ?? null,
    model:    data.model    ?? null,
    operator: data.operator ?? null,
  }));

  console.log(`${rows.length} registros encontrados — inserindo em batch...`);

  try {
    // Limpa a tabela antes para evitar conflitos com dados parciais de tentativa anterior
    await prisma.anacRegistry.deleteMany({});

    const result = await prisma.anacRegistry.createMany({ data: rows });
    console.log(`✅ ${result.count} registros salvos em anac_registry`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
