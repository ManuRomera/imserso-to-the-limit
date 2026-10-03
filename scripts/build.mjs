/**
 * Compila los compendios a LevelDB desde las fuentes legibles del repositorio:
 * - arquetipos-objetos: module/arquetipos-data.mjs
 * - reglas-diarios y achaques: module/reglas-data.mjs
 */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { ClassicLevel } from "classic-level";
import { ARQUETIPO_ITEMS } from "../module/arquetipos-data.mjs";
import { buildReglasJournals, buildAchaquesTables } from "../module/reglas-data.mjs";

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const RAIZ = { JournalEntry: "journal", Item: "items", RollTable: "tables" };
const EMBEBIDOS = { JournalEntry: ["pages"], Item: ["effects"], RollTable: ["results"] };
const id = texto => createHash("sha1").update(texto).digest("hex").slice(0, 16);
const stats = { systemId: manifiesto.id, systemVersion: manifiesto.version, coreVersion: manifiesto.compatibility.verified, createdTime: null, modifiedTime: null, lastModifiedBy: null };

function arquetipos() {
  return ARQUETIPO_ITEMS.map((a, i) => ({
    _id: id(`arquetipo-${a.system.arquetipoKey}`), name: a.name, type: "arquetipo", img: a.img, system: a.system, effects: [],
    folder: null, sort: (i + 1) * 1000, ownership: { default: 0 }, flags: {}, _stats: stats
  }));
}

function reglas() {
  return buildReglasJournals().map((j, i) => ({
    _id: id(`diario-${j.name}`), name: j.name, folder: null, sort: (i + 1) * 1000, ownership: { default: 0 }, flags: {}, _stats: stats,
    pages: j.pages.map((p, k) => ({
      _id: id(`pagina-${j.name}-${p.name}`), name: p.name, type: "text", title: p.title ?? { show: true, level: 1 }, text: p.text,
      sort: (k + 1) * 1000, ownership: { default: -1 }, flags: {}, _stats: stats
    }))
  }));
}

function achaques() {
  return buildAchaquesTables().map((t, i) => ({
    _id: id(`tabla-${t.name}`), name: t.name, img: t.img, description: t.description, formula: t.formula, replacement: true, displayRoll: true,
    folder: null, sort: (i + 1) * 1000, ownership: { default: 0 }, flags: {}, _stats: stats,
    results: t.results.map((r, k) => ({
      _id: id(`resultado-${t.name}-${k}`), type: "text", name: "", description: r.text ?? r.description ?? "", img: r.img ?? null,
      weight: r.weight ?? 1, range: r.range, drawn: false, flags: {}
    }))
  }));
}

const FUENTES = { "arquetipos-objetos": arquetipos, "reglas-diarios": reglas, achaques };

/** Compilar con Foundry abierto destruye los packs: LevelDB recupera la base vacía. Se comprueba antes. */
async function comprobarCerrados(packs) {
  const bloqueados = [];
  for (const pack of packs) {
    if (!(await fs.stat(pack.path).catch(() => null))) continue;
    const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
    try { await db.open(); await db.close(); }
    catch (error) {
      if ((error.cause?.code ?? error.code) === "LEVEL_LOCKED") bloqueados.push(pack.name);
      else throw error;
    }
  }
  if (bloqueados.length) throw new Error(`Foundry tiene abiertos estos packs: ${bloqueados.join(", ")}.\nCierra el mundo (o Foundry) antes de compilar.`);
}

await comprobarCerrados(manifiesto.packs);
await fs.mkdir("packs", { recursive: true });

for (const pack of manifiesto.packs) {
  const documentos = FUENTES[pack.name]();
  const raiz = RAIZ[pack.type];
  await fs.rm(pack.path, { recursive: true, force: true });
  const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
  for (const origen of documentos) {
    const doc = structuredClone(origen);
    for (const coleccion of EMBEBIDOS[pack.type] ?? []) {
      const filas = doc[coleccion] ?? [];
      // El padre guarda solo los ids; cada hijo va en su propia clave.
      doc[coleccion] = filas.map(f => f._id);
      for (const fila of filas) await db.put(`!${raiz}.${coleccion}!${doc._id}.${fila._id}`, fila);
    }
    await db.put(`!${raiz}!${doc._id}`, doc);
  }
  await db.close();
  console.log(`pack ${pack.name}: ${documentos.length} documentos`);
}
