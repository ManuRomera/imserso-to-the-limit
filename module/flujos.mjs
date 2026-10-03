/**
 * Flujos con estado en el chat: tiradas (con repetición por yayopoint, achaques y Ojo de Halcón),
 * daño y curación pendientes de aplicar, miedo, umbrales de Jamacuco y persecuciones.
 * Las reglas numéricas viven en reglas.mjs; aquí solo se orquesta Foundry.
 */
import { ID, IMSERSO, labelForSkill } from "./config.mjs";
import * as R from "./reglas.mjs";
import { publicar, guardar, registrarVista, registrarAccion } from "./chat.mjs";
import { pedirDatos } from "./dialogos.mjs";

const esc = foundry.utils.escapeHTML;
const sig = n => (n > 0 ? `+${n}` : `${n}`);

/** Hace visibles en el tablero (Dice So Nice) los dados de una repetición. */
async function mostrar(roll) {
  if (!roll || !game.dice3d?.showForRoll) return;
  try { await game.dice3d.showForRoll(roll, game.user, true, null, false); } catch (e) { console.warn("IMSERSO | Dice So Nice", e); }
}

async function rolar(n) {
  if (n <= 0) return [];
  const roll = await new Roll(`${n}d6`).evaluate();
  await mostrar(roll);
  return roll.dice[0].results.map(r => r.result);
}

const resolverObjetivo = async s =>
  (s.tokenUuid && (await fromUuid(s.tokenUuid))?.actor) || (await fromUuid(s.objetivoUuid));

/* ------------------------------------------------------------------ */
/* Tiradas                                                            */
/* ------------------------------------------------------------------ */

function resultado(e) {
  const r = R.evaluar({ caras: e.caras, atributo: e.atributo, bonus: e.bonus, dificultad: e.dificultad, tipo: e.tipo });
  return e.mejora ? { ...r, ...R.mejorarResultado(r) } : r;
}

function vistaTirada(e) {
  const r = resultado(e);
  const actor = fromUuidSync(e.actorUuid);
  const jubilado = actor?.type === "jubilado";
  const tono = r.critico ? "critico" : r.pifia ? "pifia" : r.exito ? "exito" : "fallo";
  const botones = [];
  if (jubilado && !r.exito && !e.repeticion && e.dados > 0 && ["habilidad", "jamacuco"].includes(e.tipo)) {
    botones.push({ accion: "yayo", etiqueta: "Repetir con yayopoint", icono: "fa-solid fa-capsules", quien: "dueno", uuid: e.actorUuid, principal: true });
  }
  if (jubilado && e.tipo === "habilidad" && !e.achaque) {
    const a = actor.system.achaques;
    botones.push({ accion: "achaque-mayor", etiqueta: `Achaque mayor${a.mayor ? `: ${a.mayor}` : ""}`, icono: "fa-solid fa-crutch", quien: "gm" });
    if (!a.menorUsado) botones.push({ accion: "achaque-menor", etiqueta: `Achaque menor${a.menor ? `: ${a.menor}` : ""}`, icono: "fa-solid fa-bandage", quien: "gm" });
  }
  if (jubilado && !e.mejora && e.clave === "lentesProgresivas" && R.TALENTOS["Ojo de Halcón"] && actor.tieneTalento("Ojo de Halcón")) {
    botones.push({ accion: "ojo", etiqueta: "Ojo de Halcón (1 yayopoint)", icono: "fa-solid fa-eye", quien: "dueno", uuid: e.actorUuid });
  }
  const lineas = e.notas.map(texto => ({ texto: esc(texto), icono: "fa-solid fa-angle-right" }));
  if (e.ataque) lineas.unshift({ texto: `<strong>${esc(e.ataque.etiqueta)}</strong> contra ${esc(e.ataque.objetivoNombre)} (Nervio ${e.dificultad})`, icono: "fa-solid fa-burst" });
  const formula = `${e.dados}D6 ${sig(e.atributo)}${e.bonus ? ` ${sig(e.bonus)}` : ""}`.replace("+-", "-");
  return {
    tono, icono: e.tipo === "jamacuco" ? "fa-solid fa-heart-pulse" : "fa-solid fa-dice-six", etiqueta: e.etiqueta,
    subtitulo: e.flavor, resultado: r.critico ? "Éxito crítico" : r.pifia ? "Pifia" : r.exito ? "Éxito" : "Fallo",
    dados: e.caras.map((v, i) => ({ v, c: e.marcas?.[i] ?? "n", seis: v === 6 })),
    conTotal: true, total: r.total, dificultad: e.dificultad, formula: e.repeticion ? `${formula} · repetida` : formula, lineas, botones
  };
}

/** Efectos posteriores a cada resolución: yayopoints por crítico, tarjeta de daño. */
async function tras(mensaje, e) {
  const r = resultado(e);
  const actor = await fromUuid(e.actorUuid);
  if (r.critico && actor?.type === "jubilado" && e.tipo === "habilidad" && !e.premiado && game.settings.get(ID, "yayoCritico")) {
    const puntos = actor.tieneTalento("Carpe diem") ? 2 : 1;
    await actor.ganarYayo(puntos);
    e.premiado = true;
    e.notas.push(`Crítico: +${puntos} yayopoint${puntos > 1 ? "s" : ""}`);
  }
  if (e.tipo === "jamacuco" && actor) {
    // Fallar es morir; si un yayopoint da la vuelta a la tirada, se revive. Superarla marca la tirada obligatoria.
    if (!r.exito && !actor.system.estado.muerto) { await actor.update({ "system.estado.muerto": true }); e.muerte = true; }
    else if (r.exito && e.muerte) { await actor.update({ "system.estado.muerto": false }); e.muerte = false; e.notas = e.notas.filter(t => t !== "¡Ha estirado la pata!"); }
    if (r.exito && !e.umbral && !actor.system.jamacuco.primeraTirada) await actor.update({ "system.jamacuco.primeraTirada": true });
    if (e.muerte && !e.notas.includes("¡Ha estirado la pata!")) e.notas.push("¡Ha estirado la pata!");
  }
  if (e.ataque && r.exito && !e.danoId) e.danoId = (await crearDano(e, r))?.id ?? null;
  else if (e.ataque && !r.exito && e.danoId) await cancelarDano(e);
  await guardar(mensaje, e);
}

export async function lanzar({ actor, token, clave = "", etiqueta, dados, atributo = 0, bonus = 0, dificultad = 8, tipo = "habilidad", flavor = "", notas = [], ataque = null, umbral = false }) {
  const n = Math.max(0, Math.min(8, dados));
  const roll = n ? await new Roll(`${n}d6`).evaluate() : null;
  const caras = roll ? roll.dice[0].results.map(r => r.result) : [];
  const estado = {
    actorUuid: actor.uuid, tokenUuid: token?.document?.uuid ?? "", etiqueta, clave, flavor, tipo, dificultad, atributo, bonus,
    dados: n, caras, marcas: caras.map(() => "n"), notas: [...notas], repeticion: null, achaque: null, mejora: 0,
    ataque, danoId: null, premiado: false, umbral, muerte: false
  };
  const mensaje = await publicar(vistaTirada(estado), { actor, token, rolls: roll ? [roll] : [], flujo: { tipo: "tirada", estado } });
  await tras(mensaje, estado);
  return { mensaje, estado, resultado: resultado(estado) };
}

registrarVista("tirada", vistaTirada);

async function elegirDados(e) {
  const datos = await pedirDatos({
    titulo: `Repetir con yayopoint: ${e.etiqueta}`,
    intro: "<p>Marca los dados que quieres volver a tirar. Los demás se quedan como están.</p>",
    filas: e.caras.map((v, i) => ({ nombre: `d${i}`, tipo: "check", etiqueta: `Dado ${i + 1}: ${v}`, valor: v < 5 })),
    ok: "Gastar y repetir"
  });
  return datos ? e.caras.map((_, i) => i).filter(i => datos[`d${i}`]) : null;
}

registrarAccion("yayo", async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  if (resultado(e).exito || e.repeticion) return ui.notifications.warn("Esta tirada ya no se puede repetir con yayopoint.");
  if (!actor.puedeGastarYayo(1)) return;
  const elegidos = await elegirDados(e);
  if (!elegidos?.length) return;
  await actor.gastarYayo(1);
  const nuevas = await rolar(elegidos.length);
  elegidos.forEach((idx, i) => { e.caras[idx] = nuevas[i]; });
  e.marcas = e.caras.map((_, i) => (elegidos.includes(i) ? "r" : "k"));
  e.repeticion = "yayo";
  e.notas.push("Repetida con 1 yayopoint");
  await tras(mensaje, e);
});

const achaque = mayor => async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  if (!mayor && actor.system.achaques.menorUsado) return ui.notifications.warn("El achaque menor ya se activó en esta sesión.");
  const n = mayor ? Math.max(0, e.dados - 1) : e.dados;
  e.caras = await rolar(n);
  e.dados = n;
  e.marcas = e.caras.map(() => "r");
  e.repeticion = "achaque";
  e.achaque = mayor ? "mayor" : "menor";
  if (mayor) {
    await actor.ganarYayo(1);
    e.notas.push("Achaque mayor: se repite con 1D menos y se entrega 1 yayopoint");
  } else {
    await actor.update({ "system.achaques.menorUsado": true });
    e.notas.push("Achaque menor: se repite sin yayopoint a cambio");
  }
  await tras(mensaje, e);
};
registrarAccion("achaque-mayor", achaque(true));
registrarAccion("achaque-menor", achaque(false));

registrarAccion("ojo", async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  if (!actor.puedeGastarYayo(1)) return;
  await actor.gastarYayo(1);
  e.mejora = 1;
  e.notas.push("Ojo de Halcón: el resultado mejora un grado");
  await tras(mensaje, e);
});

/* ------------------------------------------------------------------ */
/* Efectos pendientes: daño, curación y miedo                         */
/* ------------------------------------------------------------------ */

const ESTADOS = { pendiente: "Pendiente", aplicado: "Aplicado", cancelado: "Cancelado", evitado: "Evitado", resistido: "Resistido", espera: "Sin tirar" };

function vistaEfecto(s) {
  const cura = s.clase === "cura";
  const miedo = s.clase === "miedo";
  const botones = [];
  const uuid = s.objetivoUuid;
  if (s.estado === "pendiente") {
    if (s.defensa) botones.push({ accion: "defensa", etiqueta: `Defensa activa (${s.defensa.dificultad})`, icono: "fa-solid fa-shield-halved", quien: "dueno", uuid });
    botones.push({ accion: "aplicar", etiqueta: cura ? "Aplicar curación" : "Aplicar daño", icono: cura ? "fa-solid fa-heart" : "fa-solid fa-burst", quien: "dueno", uuid, principal: true });
    botones.push({ accion: "cancelar", etiqueta: "Cancelar", quien: "dueno", uuid });
  }
  if (s.estado === "espera") {
    botones.push({ accion: "reforzar", etiqueta: "Reforzar Bemoles (yayopoints)", icono: "fa-solid fa-capsules", quien: "dueno", uuid });
    botones.push({ accion: "tirar-miedo", etiqueta: "Tirar miedo", icono: "fa-solid fa-dice", quien: "gm", principal: true });
  }
  const lineas = [];
  if (s.detalle) lineas.push({ texto: esc(s.detalle), icono: "fa-solid fa-calculator" });
  for (const t of s.lineas ?? []) lineas.push({ texto: esc(t) });
  if (s.texto) lineas.push({ texto: esc(s.texto), icono: "fa-solid fa-circle-info" });
  return {
    tono: cura ? "cura" : s.estado === "evitado" || s.estado === "resistido" ? "exito" : "dano",
    icono: cura ? "fa-solid fa-heart-pulse" : miedo ? "fa-solid fa-ghost" : "fa-solid fa-burst",
    etiqueta: s.etiqueta, subtitulo: s.objetivo, resultado: ESTADOS[s.estado],
    titulo: s.estado === "espera" ? `${s.dados}D6 contra Bemoles ${s.bemoles}` : `${s.cantidad} de ${cura ? "curación" : "Salud"}`,
    conTotal: s.total !== undefined, dados: s.caras?.map(v => ({ v, c: "n" })), total: s.total,
    lineas, botones
  };
}
registrarVista("efecto", vistaEfecto);

/** Publica una tarjeta de daño/curación pendiente. `s` ya trae objetivo y cantidad. */
export function publicarEfecto(s, op = {}) {
  const estado = { estado: "pendiente", lineas: [], ...s };
  return publicar(vistaEfecto(estado), { ...op, flujo: { tipo: "efecto", estado } });
}

async function crearDano(e, r) {
  const a = e.ataque;
  const actor = await fromUuid(e.actorUuid);
  const extra = R.dadosApuntar(a.sacrificados, a.fuego) + a.yayoDano;
  const roll = extra ? await new Roll(`${extra}d6`).evaluate() : null;
  const cantidad = R.danoAtaque({ base: a.dano, bonoAtributo: a.bono, dadosExtra: roll?.total ?? 0, critico: r.critico });
  const s = {
    clase: "dano", objetivoUuid: a.objetivoUuid, tokenUuid: a.tokenUuid, objetivo: a.objetivoNombre,
    cantidad, original: cantidad, etiqueta: a.etiqueta, fuego: a.fuego, habilidad: a.habilidad,
    detalle: `${a.dano} + ${a.atributoEtiqueta} ${a.bono}${roll ? ` + ${roll.total} (dados extra)` : ""}${r.critico ? " ×2 crítico" : ""}`,
    defensa: { dificultad: R.dificultadDefensa({ fuego: a.fuego, critico: r.critico, apuntado: a.sacrificados > 0 }) }
  };
  return publicarEfecto(s, { actor, rolls: roll ? [roll] : [] });
}

async function cancelarDano(e) {
  const m = game.messages.get(e.danoId);
  const s = m?.getFlag(ID, "estado");
  if (s?.estado === "pendiente") await guardar(m, { ...s, estado: "cancelado", texto: "La tirada de ataque ya no impacta." });
  e.danoId = null;
}

registrarAccion("aplicar", async ({ mensaje, estado: s }) => {
  if (s.estado !== "pendiente") return;
  const objetivo = await resolverObjetivo(s);
  if (!objetivo) return ui.notifications.warn("No encuentro al objetivo.");
  if (s.clase === "cura") await objetivo.curar(s.cantidad);
  else if (s.fuego && objetivo.tieneAutomatismo("traje-superman")) {
    s.cantidad = 0;
    s.texto = `${objetivo.name} lleva el Traje de Superman: las balas normales no le hacen daño.`;
  } else await objetivo.aplicarDano(s.cantidad);
  s.estado = "aplicado";
  await guardar(mensaje, s);
});

registrarAccion("cancelar", async ({ mensaje, estado: s }) => {
  s.estado = "cancelado";
  await guardar(mensaje, s);
});

registrarAccion("defensa", async ({ mensaje, estado: s }) => {
  const objetivo = await resolverObjetivo(s);
  const res = await objetivo?.tirarHabilidad("gimnasia", { dificultad: s.defensa.dificultad, notas: ["Defensa activa"] });
  if (!res) return;
  if (res.resultado.exito) {
    s.estado = "evitado";
    s.texto = `${objetivo.name} se defiende activamente y evita el daño.`;
  } else if (res.resultado.pifia) {
    s.cantidad = s.original * 2;
    s.texto = `${objetivo.name} pifia la defensa activa: el daño se dobla a ${s.cantidad}.`;
  } else s.texto = `${objetivo.name} falla la defensa activa; el daño sigue pendiente.`;
  s.defensa = null;
  await guardar(mensaje, s);
});

/* Miedo (p. 29): el Sr. Ministro tira 1-5D6 contra los Bemoles; sin críticos ni pifias. */
export async function lanzarMiedo(objetivos, dados) {
  for (const objetivo of objetivos) {
    await publicarEfecto({
      clase: "miedo", estado: "espera", objetivoUuid: objetivo.uuid, objetivo: objetivo.name, etiqueta: "Miedo", dados, bemoles: objetivo.bemolesValor,
      lineas: ["Los yayopoints gastados antes de tirar suman +3 a los Bemoles cada uno."]
    }, { alias: "Sr. Ministro" });
  }
}

registrarAccion("reforzar", async ({ mensaje, estado: s }) => {
  const objetivo = await resolverObjetivo(s);
  if (!objetivo || await objetivo.reforzar("bemoles") === null) return;
  s.bemoles = objetivo.bemolesValor;
  await guardar(mensaje, s);
});

registrarAccion("tirar-miedo", async ({ mensaje, estado: s }) => {
  const objetivo = await resolverObjetivo(s);
  const roll = await new Roll(`${s.dados}d6`).evaluate();
  await mostrar(roll);
  s.caras = roll.dice[0].results.map(r => r.result);
  s.total = roll.total;
  s.bemoles = objetivo?.bemolesValor ?? s.bemoles;
  const cae = s.total >= s.bemoles;
  s.cantidad = s.original = cae ? s.dados : 0;
  s.estado = cae ? "pendiente" : "resistido";
  s.texto = cae ? `${s.total} iguala o supera los Bemoles ${s.bemoles}: pierde ${s.dados} de Salud.` : `${s.total} no llega a los Bemoles ${s.bemoles}: aguanta el susto.`;
  await objetivo?.update({ "system.combate.refuerzoBemoles": 0 });
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Umbrales de Jamacuco                                               */
/* ------------------------------------------------------------------ */

function vistaUmbrales(s) {
  const botones = s.umbrales.filter(u => !s.tirados.includes(u) && !s.fallo).map(u => ({
    accion: "umbral", etiqueta: `Tirar Jamacuco · umbral ${u}`, icono: "fa-solid fa-heart-pulse", quien: "dueno", uuid: s.actorUuid, datos: { umbral: u }, principal: true
  }));
  return {
    tono: s.fallo ? "pifia" : "aviso", icono: "fa-solid fa-heart-crack", etiqueta: "Umbral de Jamacuco", subtitulo: s.nombre,
    resultado: s.fallo ? "Ha estirado la pata" : s.tirados.length === s.umbrales.length ? "Superados" : "Hay que tirar",
    lineas: [{ texto: `Cruza por primera vez: <strong>${s.umbrales.join(", ")}</strong>. Una tirada de Jamacuco por cada umbral; fallar una es morir.` }],
    botones
  };
}
registrarVista("umbrales", vistaUmbrales);

export const publicarUmbrales = (actor, umbrales) => {
  const estado = { actorUuid: actor.uuid, nombre: actor.name, umbrales, tirados: [], fallo: null };
  return publicar(vistaUmbrales(estado), { actor, flujo: { tipo: "umbrales", estado } });
};

registrarAccion("umbral", async ({ mensaje, estado: s, datos }) => {
  const u = Number(datos.umbral);
  if (s.tirados.includes(u)) return;
  const actor = await fromUuid(s.actorUuid);
  const res = await actor.tirarJamacuco({ motivo: `umbral ${u}`, umbral: true });
  if (!res) return;
  s.tirados.push(u);
  if (!res.resultado.exito) s.fallo = u;
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Persecuciones (pp. 30-31)                                          */
/* ------------------------------------------------------------------ */

const DISTANCIAS = ["¡Capturado!", "Corta", "Media", "Larga", "¡Ha huido!"];

function vistaPersecucion(s) {
  const pips = [1, 2, 3].map(d => (d === s.distancia ? "●" : "○")).join(" ");
  const botones = s.fin ? [] : [{ accion: "turno-persecucion", etiqueta: "Tirar este turno", icono: "fa-solid fa-person-running", quien: "dueno", uuid: s.actorUuid, principal: true }];
  return {
    tono: s.fin ? (s.fin === (s.perseguidor ? "captura" : "huida") ? "exito" : "pifia") : "aviso", icono: "fa-solid fa-person-running",
    etiqueta: "Persecución", subtitulo: `${s.nombre} ${s.perseguidor ? "persigue a" : "huye de"} ${s.objetivo}`, resultado: DISTANCIAS[s.distancia],
    titulo: `Distancia: ${pips}`,
    lineas: [
      { texto: `Cada turno se tira Gimnasia (a pie, bici o patinete) o Archiperres (con motor) contra el Nervio ${s.nervio} del otro. ${s.perseguidor ? "Bajar de corta es capturar." : "Pasar de larga es escapar."}` },
      ...s.historial.map(h => ({ texto: esc(h) }))
    ],
    botones
  };
}
registrarVista("persecucion", vistaPersecucion);

export const publicarPersecucion = (actor, { objetivo, nervio, perseguidor }) => {
  const estado = { actorUuid: actor.uuid, nombre: actor.name, objetivo, nervio, perseguidor, distancia: 2, fin: null, historial: [] };
  return publicar(vistaPersecucion(estado), { actor, flujo: { tipo: "persecucion", estado } });
};

registrarAccion("turno-persecucion", async ({ mensaje, estado: s }) => {
  const actor = await fromUuid(s.actorUuid);
  const datos = await pedirDatos({
    titulo: "Turno de persecución",
    filas: [
      { nombre: "clave", tipo: "sel", etiqueta: "Habilidad", valor: "gimnasia", opciones: [{ valor: "gimnasia", etiqueta: "Gimnasia (a pie, bici, patinete)" }, { valor: "archiperres", etiqueta: "Archiperres (motor)" }] },
      { nombre: "dificultad", tipo: "num", etiqueta: "Nervio del otro", valor: s.nervio, min: 1, max: 40 }
    ],
    ok: "Tirar"
  });
  if (!datos) return;
  s.nervio = datos.dificultad;
  const res = await actor.tirarHabilidad(datos.clave, { dificultad: s.nervio, dialogo: true });
  if (!res) return;
  const { exito, critico, pifia } = res.resultado;
  const mov = R.moverPersecucion({ distancia: s.distancia, perseguidor: s.perseguidor, exito, critico });
  s.distancia = mov.distancia;
  s.fin = mov.fin;
  s.historial.push(`Turno ${s.historial.length + 1}: ${critico ? "crítico, gana una distancia extra" : pifia ? "pifia: accidente (el Sr. Ministro decide el daño)" : exito ? "éxito" : "fallo"} → ${DISTANCIAS[s.distancia]}.`);
  await guardar(mensaje, s);
});

export { vistaEfecto, vistaTirada, resultado };
