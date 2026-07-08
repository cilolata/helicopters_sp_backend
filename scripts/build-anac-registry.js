#!/usr/bin/env node
/**
 * Processa o CSV de aeronaves da ANAC e gera prisma/data/anac-registry.json
 *
 * Uso:
 *   node scripts/build-anac-registry.js <dados_aeronaves.csv>
 *
 * Saída: { [MATRÍCULA]: { owner, model } }  — apenas helicópteros (CD_CLS começa com 'H')
 */

const { createReadStream, writeFileSync, existsSync } = require('fs');
const { createInterface }                             = require('readline');
const { join }                                        = require('path');

const csvPath = process.argv[2];
if (!csvPath || !existsSync(csvPath)) {
  console.error('Uso: node scripts/build-anac-registry.js <dados_aeronaves.csv>');
  process.exit(1);
}

function splitCsv(line) {
  const cols    = [];
  let   current = '';
  let   inQ     = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { current += '"'; i++; }
      else                             { inQ = !inQ; }
      continue;
    }
    if (ch === ';' && !inQ) { cols.push(current); current = ''; continue; }
    current += ch;
  }
  cols.push(current);
  return cols;
}

function extractOwner(str) {
  if (!str) return null;
  try {
    const list = JSON.parse(str);
    if (!Array.isArray(list) || list.length === 0) return null;
    return list
      .filter(p => p.NOME)
      .sort((a, b) => parseFloat(b.PERCENTUAL || 0) - parseFloat(a.PERCENTUAL || 0))[0]?.NOME ?? null;
  } catch { return null; }
}

async function main() {
  const rl = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });

  const registry = {};
  let lineNo = 0;
  let marcasIdx = -1, proprietariosIdx = -1, modeloIdx = -1, clsIdx = -1;

  for await (const raw of rl) {
    const line = raw.trimEnd();
    lineNo++;

    if (lineNo === 1) continue;

    if (lineNo === 2) {
      const cols      = line.split(';').map(c => c.replace(/"/g, '').trim().toUpperCase());
      marcasIdx        = cols.indexOf('MARCAS');
      proprietariosIdx = cols.indexOf('PROPRIETARIOS');
      modeloIdx        = cols.indexOf('DS_MODELO');
      clsIdx           = cols.indexOf('TP_POUSO');
      if (marcasIdx === -1 || clsIdx === -1) {
        console.error('Colunas não encontradas:', cols.join(', '));
        process.exit(1);
      }
      continue;
    }

    if (!line) continue;

    const cols  = splitCsv(line);
    const marca = cols[marcasIdx]?.trim().toUpperCase();
    const cls   = cols[clsIdx]?.trim().toUpperCase();

    if (marca && cls === 'HELICOPTERO') {
      registry[marca] = {
        owner: proprietariosIdx >= 0 ? extractOwner(cols[proprietariosIdx]) : null,
        model: modeloIdx >= 0        ? cols[modeloIdx]?.trim() || null       : null,
      };
    }
  }

  const outPath = join(__dirname, '../prisma/data/anac-registry.json');
  writeFileSync(outPath, JSON.stringify(registry));
  console.log(`${Object.keys(registry).length} helicópteros salvos em ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
