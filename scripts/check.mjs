/**
 * Validación estática antes de publicar: sintaxis, JSON, rutas de plantillas y recursos citados,
 * coherencia entre etiqueta y versión, e integridad de los datos de reglas.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const errores = [];
const listar = async dir => (await fs.readdir(dir, { recursive: true })).map(f => path.join(dir, f));
const existe = p => fs.stat(p).then(() => true, () => false);

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const etiqueta = process.env.RELEASE_TAG;
if (etiqueta && etiqueta !== `v${manifiesto.version}`) errores.push(`La etiqueta ${etiqueta} no coincide con la versión ${manifiesto.version}.`);
const paquete = JSON.parse(await fs.readFile("package.json"));
if (paquete.version !== manifiesto.version) errores.push(`package.json (${paquete.version}) y system.json (${manifiesto.version}) no coinciden.`);

const js = [...(await listar("module")), ...(await listar("scripts")), ...(await listar("tests"))].filter(f => f.endsWith(".mjs"));
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { errores.push(`${f}: ${e.stderr}`); }
}

for (const f of ["system.json", "lang/es.json", "package.json"]) {
  try { JSON.parse(await fs.readFile(f, "utf8")); }
  catch (e) { errores.push(`${f}: JSON inválido (${e.message})`); }
}

// Toda ruta systems/imserso-to-the-limit/... y toda plantilla citada deben existir.
const fuentes = [...js, ...(await listar("templates")), "system.json"].filter(f => /\.(mjs|hbs|json)$/.test(f));
for (const f of fuentes) {
  const texto = await fs.readFile(f, "utf8");
  for (const [, ruta] of texto.matchAll(/systems\/imserso-to-the-limit\/([\w\-/.]+\.(?:hbs|webp|png|svg|css|woff2))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
  for (const [, ruta] of texto.matchAll(/\$\{RUTA\}\/([\w\-/.]+\.(?:hbs|webp))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
}
for (const f of [...manifiesto.styles, ...manifiesto.esmodules, manifiesto.license]) if (!(await existe(f))) errores.push(`system.json: falta ${f}`);
const css = await fs.readFile("styles/imserso.css", "utf8");
for (const [, ruta] of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) if (!(await existe(ruta))) errores.push(`styles: falta ${ruta}`);

// Los datos de reglas (fuente de los compendios) deben ser coherentes.
const { ARQUETIPOS } = await import("../module/arquetipos-data.mjs");
const { IMSERSO } = await import("../module/config.mjs");
for (const a of ARQUETIPOS) {
  for (const k of [...a.d3, ...a.d2]) if (!IMSERSO.habilidades[k]) errores.push(`arquetipo ${a.name}: habilidad desconocida ${k}`);
}
const { buildReglasJournals, buildAchaquesTables } = await import("../module/reglas-data.mjs");
if (buildAchaquesTables()[0].results.length !== 100) errores.push("La tabla de achaques no tiene 100 entradas.");
if (!buildReglasJournals().length) errores.push("No hay diarios de reglas.");

if (errores.length) {
  console.error(errores.join("\n"));
  process.exit(1);
}
console.log(`Comprobación correcta: ${js.length} módulos, ${fuentes.length} fuentes revisadas.`);
