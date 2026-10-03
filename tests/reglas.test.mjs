import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/reglas.mjs";
import { ARQUETIPOS } from "../module/arquetipos-data.mjs";

test("penalizador de salud: umbrales 11, 7 y 4", () => {
  assert.deepEqual([28, 11, 10, 7, 6, 4, 3, 1].map(R.penalizadorSalud), [0, 0, 1, 1, 2, 2, 3, 3]);
});

test("valores derivados (p. 19-20, 26, 33)", () => {
  assert.equal(R.bemoles(4), 11);
  assert.equal(R.nervio(3, 6), 15);
  assert.equal(R.jamacuco(6), 6);
  assert.equal(R.saludBase(4), 18);
  assert.equal(R.yayosIniciales(4, 2), 5);
});

test("los 14 arquetipos cuadran con las fórmulas del manual", () => {
  assert.equal(ARQUETIPOS.length, 14);
  for (const a of ARQUETIPOS) {
    assert.equal(a.yayos, R.yayosIniciales(a.attrs.cac, a.attrs.rob), `${a.name}: yayopoints`);
    assert.equal(a.saludBase, R.saludBase(a.attrs.rob), `${a.name}: salud`);
    assert.equal(a.d3.length, 4, `${a.name}: 4 habilidades a 3D`);
    assert.equal(a.d2.length, 6, `${a.name}: 6 habilidades a 2D`);
    assert.deepEqual(Object.values(a.attrs).sort((x, y) => x - y), [0, 2, 4, 6], `${a.name}: bonificadores`);
  }
});

test("críticos y pifias", () => {
  assert.equal(R.evaluar({ caras: [6, 6, 1], dificultad: 24 }).critico, true);
  assert.equal(R.evaluar({ caras: [6, 6], dificultad: 24 }).exito, true);
  assert.equal(R.evaluar({ caras: [1], atributo: 6, dificultad: 4 }).exito, false);
  assert.equal(R.evaluar({ caras: [1, 1, 1], atributo: 6, dificultad: 4 }).pifia, true);
  assert.equal(R.evaluar({ caras: [], atributo: 6, dificultad: 4 }).pifia, false);
  assert.equal(R.evaluar({ caras: [6, 6], tipo: "iniciativa" }).critico, false);
  assert.equal(R.evaluar({ caras: [3, 2], atributo: 2, dificultad: 8 }).exito, false);
  assert.equal(R.evaluar({ caras: [3, 3], atributo: 2, dificultad: 8 }).exito, true);
});

test("dados de tirada: nunca bajan de 0", () => {
  assert.equal(R.dadosDeTirada({ base: 1, penalizador: 3 }), 0);
  assert.equal(R.dadosDeTirada({ base: 3, extra: 1, achaqueMayor: true, penalizador: 1 }), 2);
  assert.equal(R.alimon(5), 3);
});

test("umbrales de Jamacuco: solo la primera vez y varios de golpe", () => {
  assert.deepEqual(R.umbralesCruzados(16, 14), [15]);
  assert.deepEqual(R.umbralesCruzados(16, 5, {}), [15, 10, 6]);
  assert.deepEqual(R.umbralesCruzados(16, 5, { 15: true }), [10, 6]);
  assert.deepEqual(R.umbralesCruzados(5, 2, {}), [3]);
  assert.deepEqual(R.umbralesCruzados(10, 9), []);
});

test("daño, apuntar y defensa", () => {
  assert.equal(R.danoAtaque({ base: 4, bonoAtributo: 4, dadosExtra: 3 }), 11);
  assert.equal(R.danoAtaque({ base: 4, bonoAtributo: 4, critico: true }), 16);
  assert.equal(R.dadosApuntar(2, true), 4);
  assert.equal(R.dadosApuntar(2, false), 2);
  assert.equal(R.dificultadDefensa({ fuego: true, critico: true, apuntado: true }), 25);
  assert.equal(R.dificultadDefensa({}), 10);
  assert.equal(R.tope(9), 3);
});

test("Nervio efectivo", () => {
  assert.equal(R.nervioEfectivo({ base: 15, sorprendido: true }), 7);
  assert.equal(R.nervioEfectivo({ base: 10, reservando: true, refuerzo: 3 }), 15);
});

test("daño reglado", () => {
  assert.equal(R.dano.caida(4), 12);
  assert.equal(R.dano.hambre(24), 4);
  assert.equal(R.dano.sed(11), 2);
  assert.deepEqual([10, 15, 20].map(R.dano.cogorza), [1, 3, 5]);
});

test("curación: una vez por día o sesión y fuentes que no se acumulan", () => {
  assert.equal(R.curacionDisponible("siesta", { sesion: ["siesta"] }).ok, false);
  assert.equal(R.curacionDisponible("masaje", { sesion: ["siesta"] }).ok, true);
  assert.equal(R.curacionDisponible("casa", { dia: ["hospital"] }).ok, false);
  assert.equal(R.curacionDisponible("botiquin", { dia: ["hospital"] }).ok, true);
});

test("persecución: captura, huida y críticos", () => {
  assert.deepEqual(R.moverPersecucion({ distancia: 2, perseguidor: true, exito: true }), { distancia: 1, fin: null });
  assert.equal(R.moverPersecucion({ distancia: 1, perseguidor: true, exito: true }).fin, "captura");
  assert.equal(R.moverPersecucion({ distancia: 3, perseguidor: false, exito: true }).fin, "huida");
  assert.equal(R.moverPersecucion({ distancia: 3, perseguidor: true, exito: false }).fin, "huida");
  assert.equal(R.moverPersecucion({ distancia: 3, perseguidor: true, exito: true, critico: true }).distancia, 1);
});

test("partido político con 2D6 y restricciones de arquetipo", () => {
  assert.deepEqual([2, 3, 6, 7, 8, 9, 11, 12].map(R.partidoDe2d6), ["Con Franco se vivía mejor", "PEPÉ", "PEPÉ", "Ciutadanos", "Ciutadanos", "SOE", "SOE", "El del Coletas"]);
  assert.deepEqual(R.partidosPermitidos("Cualquiera salvo SOE y El del Coletas"), ["Con Franco se vivía mejor", "PEPÉ", "Ciutadanos"]);
  assert.deepEqual(R.partidosPermitidos("Con Franco se vivía mejor, PEPÉ o SOE"), ["Con Franco se vivía mejor", "PEPÉ", "SOE"]);
  assert.equal(R.partidosPermitidos("El del Coletas").length, 1);
});

test("reparto de la creación libre", () => {
  const habs = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`h${i}`, { dados: i < 4 ? 3 : i < 10 ? 2 : 1 }]));
  assert.equal(R.repartoLibre({ cac: 0, gra: 2, pre: 4, rob: 6 }, habs).ok, true);
  assert.equal(R.repartoLibre({ cac: 0, gra: 2, pre: 2, rob: 6 }, habs).ok, false);
});

test("Ojo de Halcón mejora un grado", () => {
  assert.deepEqual(R.mejorarResultado({ exito: false, critico: false }), { exito: true, critico: false });
  assert.deepEqual(R.mejorarResultado({ exito: true, critico: false }), { exito: true, critico: true });
});

test("automatismos: alias del módulo de aventura", () => {
  assert.equal(R.automatismoDe({ system: { automatismo: "visor-bionico" } }), "visor-de-cyborg");
  assert.equal(R.automatismoDe({ system: { automatismo: "brazaletes" } }), "brazaletes-de-wonder-woman");
  assert.equal(R.automatismoDe({ name: "Traje de Batman", system: {} }), "traje-de-batman");
});
