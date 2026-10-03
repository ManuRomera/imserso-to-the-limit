/**
 * Reglas de YayoSystem como funciones puras (sin Foundry): se prueban con `npm test`.
 * Cada función cita el apartado del manual de IMSERSO to the limit del que sale.
 */

export const UMBRALES = [15, 10, 6, 3, 1];
export const BONIFICADORES = [0, 2, 4, 6];
export const PARTIDOS = ["Con Franco se vivía mejor", "PEPÉ", "Ciutadanos", "SOE", "El del Coletas"];

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Salud → dados de penalización (p. 26): -1D bajo 11, -2D bajo 7, -3D bajo 4. */
export const penalizadorSalud = salud => (salud < 4 ? 3 : salud < 7 ? 2 : salud < 11 ? 1 : 0);

/** Valores fijos (pp. 19-20, 26, 33). */
export const bemoles = cac => n(cac) + 7;
export const nervio = (dadosGimnasia, pre) => 3 * n(dadosGimnasia, 1) + n(pre);
export const jamacuco = rob => 12 - n(rob);
export const saludBase = rob => 2 * n(rob) + 10;
export const yayosIniciales = (cac, rob) => Math.floor((n(cac) + n(rob)) / 2) + 2;

/** Partido político con 2D6 (p. 33). */
export function partidoDe2d6(total) {
  if (total <= 2) return PARTIDOS[0];
  if (total <= 6) return PARTIDOS[1];
  if (total <= 8) return PARTIDOS[2];
  if (total <= 11) return PARTIDOS[3];
  return PARTIDOS[4];
}

/** Partidos válidos para un arquetipo: «Cualquiera», «Cualquiera salvo X y Y» o una lista cerrada. */
export function partidosPermitidos(texto = "Cualquiera") {
  if (!texto.startsWith("Cualquiera")) {
    const cerrados = PARTIDOS.filter(p => texto.includes(p));
    return cerrados.length ? cerrados : [texto];
  }
  const resto = texto.split("salvo")[1];
  return resto ? PARTIDOS.filter(p => !resto.includes(p)) : [...PARTIDOS];
}

/**
 * Resultado de una tirada (pp. 9-10). Crítico: 2 o más seises, siempre éxito.
 * Pifia: todos los dados son 1, siempre fallo. La iniciativa y el miedo no tienen críticos ni pifias.
 */
export function evaluar({ caras = [], atributo = 0, bonus = 0, dificultad = 8, tipo = "habilidad" }) {
  const total = caras.reduce((a, c) => a + c, 0) + n(atributo) + n(bonus);
  const seises = caras.filter(c => c === 6).length;
  const especial = !["iniciativa", "miedo"].includes(tipo);
  const critico = especial && seises >= 2;
  const pifia = especial && caras.length > 0 && caras.every(c => c === 1);
  const exito = critico || (!pifia && total >= n(dificultad, 8));
  return { total, seises, critico, pifia, exito };
}

/**
 * Dados reales de una tirada de habilidad. `base` son los de la ficha;
 * se suman extras y se restan sacrificados, penalizador de salud, achaque mayor, cogorza y capote prestado.
 */
export function dadosDeTirada({ base, extra = 0, sacrificados = 0, penalizador = 0, achaqueMayor = false, cogorza = false, prestados = 0 }) {
  return Math.max(0, n(base) + n(extra) - n(sacrificados) - n(penalizador) - (achaqueMayor ? 1 : 0) - (cogorza ? 1 : 0) - n(prestados));
}

/** Acciones al alimón: +1D por ayudante, máximo +3D (p. 14). */
export const alimon = ayudantes => Math.min(3, Math.max(0, n(ayudantes)));

/** Umbrales de Jamacuco que se cruzan por primera vez al pasar de `antes` a `despues` (p. 27). */
export function umbralesCruzados(antes, despues, yaTirados = {}) {
  return UMBRALES.filter(u => antes > u && despues <= u && !yaTirados[u]);
}

/** Iniciativa (pp. 21-22): bonificador por arma. */
export const INICIATIVA_ARMA = { sinArmas: 0, cuerpo: 2, fuegoPequena: 5, fuegoGrande: 5 };

/** Daño fijo de un ataque (p. 22). `dadosExtra` es lo ya tirado (yayopoints + apuntar). */
export function danoAtaque({ base, bonoAtributo = 0, dadosExtra = 0, critico = false }) {
  const subtotal = n(base) + n(bonoAtributo) + n(dadosExtra);
  return critico ? subtotal * 2 : subtotal;
}

/** Dados extra de daño al apuntar: 1D6 por dado sacrificado, 2D6 con armas de fuego (p. 22). */
export const dadosApuntar = (sacrificados, fuego) => n(sacrificados) * (fuego ? 2 : 1);

/** Yayopoints máximos por golpe (p. 12). */
export const tope = (yayos, max = 3) => Math.min(max, Math.max(0, n(yayos)));

/** Dificultad de la defensa activa (p. 23): 10 cuerpo a cuerpo, 15 fuego; +5 crítico, +5 apuntado. */
export const dificultadDefensa = ({ fuego = false, critico = false, apuntado = false }) =>
  (fuego ? 15 : 10) + (critico ? 5 : 0) + (apuntado ? 5 : 0);

/** Nervio efectivo: reservar acción +2, yayopoints +3 cada uno; sorprendido → mitad redondeando abajo. */
export function nervioEfectivo({ base, sorprendido = false, reservando = false, refuerzo = 0 }) {
  const sumado = n(base) + (reservando ? 2 : 0) + n(refuerzo);
  return sorprendido ? Math.floor(sumado / 2) : sumado;
}

/** Fuentes de daño reglado (pp. 24-25). */
export const dano = {
  caida: metros => 3 * n(metros),
  hambre: horas => 2 * Math.floor(n(horas) / 12),
  sed: horas => 2 * Math.floor(n(horas) / 6),
  cogorza: dificultad => (dificultad >= 20 ? 5 : dificultad >= 15 ? 3 : 1),
  aguanteRespiracion: rob => n(rob) + 5
};

/**
 * Curación (p. 30). `frecuencia`: «dia» se repite cada día de juego; «sesion» una vez por sesión.
 * `grupo`: las fuentes de un mismo grupo no se acumulan.
 */
export const CURACION = {
  hospital: { etiqueta: "Jornada en el hospital", frecuencia: "dia", grupo: "reposo", cantidad: 6 },
  casa: { etiqueta: "Jornada tranquila en casa u hotel", frecuencia: "dia", grupo: "reposo", cantidad: 3 },
  mesaCamilla: { etiqueta: "Tarde de cartas o mesa camilla", frecuencia: "dia", grupo: "reposo", cantidad: 2 },
  botiquin: { etiqueta: "Cura con botiquín", frecuencia: "dia", cantidad: 2, critico: 4, habilidad: "ambulatorio", dificultad: 10 },
  buffet: { etiqueta: "Ganar el buffet del desayuno", frecuencia: "dia", cantidad: 2, habilidad: "ingesta", dificultad: 12 },
  porrete: { etiqueta: "Fumarse un porrete", frecuencia: "dia", cantidad: 1 },
  siesta: { etiqueta: "Siesta reparadora (3 h)", frecuencia: "sesion", cantidad: 1 },
  masaje: { etiqueta: "Recibir un masaje", frecuencia: "sesion", cantidad: 1 },
  balneario: { etiqueta: "Remojo en el balneario", frecuencia: "sesion", cantidad: 1 },
  restoran: { etiqueta: "Comida abundante en un restorán", frecuencia: "sesion", cantidad: 2, critico: 4, habilidad: "ingesta", dificultad: 10 },
  casquete: { etiqueta: "Casquete con un ligue del viaje", frecuencia: "sesion", cantidad: 3 },
  juegos: { etiqueta: "Bingo, cinquillo, mus o dominó", frecuencia: "sesion", cantidad: 1 }
};

/** ¿Se puede usar esta fuente hoy? `usadas` = {dia: [...], sesion: [...]}. */
export function curacionDisponible(clave, usadas = {}) {
  const f = CURACION[clave];
  if (!f) return { ok: false, motivo: "Fuente desconocida." };
  const lista = usadas[f.frecuencia] ?? [];
  if (lista.includes(clave)) return { ok: false, motivo: f.frecuencia === "dia" ? "Ya usada hoy." : "Ya usada en esta sesión." };
  const choca = f.grupo && lista.find(k => CURACION[k]?.grupo === f.grupo);
  if (choca) return { ok: false, motivo: `No se acumula con «${CURACION[choca].etiqueta}».` };
  return { ok: true };
}

/** Persecución (pp. 30-31). Distancias: 1 corta, 2 media, 3 larga; <1 captura, >3 huida. */
export function moverPersecucion({ distancia, perseguidor, exito, critico = false }) {
  const pasos = critico ? 2 : 1;
  const hacia = perseguidor === exito ? -1 : 1;
  const nueva = distancia + hacia * pasos;
  return { distancia: Math.min(4, Math.max(0, nueva)), fin: nueva < 1 ? "captura" : nueva > 3 ? "huida" : null };
}

/** Reparto legal de la creación libre (p. 33): bonificadores 0/+2/+4/+6 sin repetir; 4 habilidades a 3D y 6 a 2D. */
export function repartoLibre(atributos, habilidades) {
  const valores = Object.values(atributos).map(Number);
  const dados = Object.values(habilidades).map(h => n(h?.dados ?? h, 1));
  const d3 = dados.filter(d => d === 3).length;
  const d2 = dados.filter(d => d === 2).length;
  const atributosOk = valores.length === 4 && BONIFICADORES.every(b => valores.filter(v => v === b).length === 1);
  return { atributosOk, d3, d2, ok: atributosOk && d3 === 4 && d2 === 6 };
}

/** Talentos de arquetipo con efecto mecánico propio (tipo → qué automatiza el sistema). */
export const TALENTOS = {
  "Ooooommmmm": { tipo: "meditar" },
  "Hércules Farnesio": { tipo: "proeza" },
  "Sugar power": { tipo: "dulce" },
  "Aparejador de raza": { tipo: "mas3", sobre: "obra o infraestructura" },
  "Oyssss": { tipo: "mas3", sobre: "acción pedante" },
  "Carpe diem": { tipo: "pasivo" },
  "Ojo de Halcón": { tipo: "ojo", habilidad: "lentesProgresivas" },
  "Señor de las bestias": { tipo: "pasivo" }
};

/** Mejora un grado la calidad de un resultado (Ojo de Halcón): fallo → éxito → crítico. */
export function mejorarResultado({ exito, critico }) {
  if (critico) return { exito: true, critico: true };
  return exito ? { exito: true, critico: true } : { exito: true, critico: false };
}

/** Normaliza un texto a clave de automatismo (sin tildes, minúsculas, con guiones). */
export const claveAutomatismo = texto =>
  String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Alias: el módulo «Los Abuelos de la Justicia» nombra algunos automatismos distinto que la ficha. */
export const ALIAS_AUTOMATISMO = {
  brazaletes: "brazaletes-de-wonder-woman",
  defensa: "brazaletes-de-wonder-woman",
  "visor-bionico": "visor-de-cyborg",
  punteria: "visor-de-cyborg",
  curacion: "botiquin"
};

export const automatismoDe = item => {
  const clave = claveAutomatismo(item?.system?.automatismo || item?.system?.uso || item?.name);
  return ALIAS_AUTOMATISMO[clave] ?? clave;
};
