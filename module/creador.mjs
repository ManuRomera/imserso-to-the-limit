/**
 * Asistente de creación de jubilados (pp. 32-41): creación libre, por arquetipo o al azar.
 * También genera extras al azar. Aplica sobre una ficha existente o crea una nueva.
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { IMSERSO, RUTA, defaultSkills, labelForAttribute, labelForSkill, normalizeSkills } from "./config.mjs";
import * as R from "./reglas.mjs";
import { ARQUETIPOS, archetypeSkills, archetypeSystem, archetypeTalentItem, arquetipoByKey } from "./arquetipos-data.mjs";
import { getAchaque, rollAchaqueIndexes } from "./reglas-data.mjs";
import { publicar } from "./chat.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clon = v => foundry.utils.deepClone(v);
const mezclar = lista => { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const elegir = lista => lista[Math.floor(Math.random() * lista.length)];

const RANDOM = {
  nombres: [
    "Amparo", "Anselmo", "Antonia", "Aurelio", "Benita", "Bonifacio", "Carmela", "Ceferino",
    "Dolores", "Eliodoro", "Encarnita", "Eusebio", "Fermina", "Fortunata", "Gregorio", "Herminia",
    "Isidro", "Jacinta", "Lorenzo", "Manuela", "Marcelino", "Nati", "Pascual", "Prudencia",
    "Raimundo", "Rosario", "Sebastiana", "Silvestra", "Teodoro", "Vicenta"
  ],
  apodos: [
    "la del tercero", "el de la boina", "la de Correos", "el fino", "la incansable", "el municipal",
    "la de la radio", "el del bastón", "la del bingo", "el de los recados", "la terremoto", "el silencioso"
  ],
  lugares: [
    "Villarriba", "Villabajo", "Móstoles", "Albacete", "Cádiz", "Cuenca", "Benidorm", "Torrelavega",
    "La Línea", "Mérida", "Murcia", "Zamora", "Alcalá de Henares", "El Puerto de Santa María",
    "un pueblo que ya no sale ni en los mapas", "la barriada de toda la vida"
  ],
  anos: ["60 largos", "65 recién cumplidos", "68 muy llevaderos", "71 oficiales", "74 de calendario", "77 con papeles", "80 y pocos", "Demasiados"],
  profesiones: [
    "Conserje", "Maestra", "Taxista", "Carnicera", "Fontanero", "Costurera", "Guardia urbano",
    "Administrativa", "Pescadero", "Cocinera", "Agricultor", "Peluquera", "Cartero", "Electricista",
    "Tendero", "Conductora de autobús", "Bibliotecaria", "Jefe de almacén", "Enfermera", "Mecánico"
  ],
  familias: [
    "Tres hijos, siete nietos y una guerra abierta por el grupo familiar.",
    "Un nieto favorito y varios que se presentan cuando huelen croquetas.",
    "Familia repartida por media España; todos llaman cuando hay que montar muebles.",
    "Dice que no se mete en la vida de nadie, pero lleva una libreta de incidencias.",
    "Una hija que insiste en que use el móvil y un yerno bajo vigilancia permanente.",
    "Tantos sobrinos y nietos que ya los clasifica por mote y no por nombre."
  ],
  pertenencias: [
    "Bolso grande, pañuelos, caramelos de eucalipto, llaves antiguas y una libreta.",
    "Bastón recio, gorra, navajita multiusos y tickets de hace meses.",
    "Riñonera, pastillero, botella de agua, abanico y cargador del móvil.",
    "Mochila ligera, bocadillo envuelto en servilleta, gafas de repuesto y rosario.",
    "Carrito plegable, paraguas, monedero con calderilla y una bolsa dentro de otra bolsa.",
    "Chaqueta con demasiados bolsillos, linterna pequeña, sonotone y bolígrafo promocional."
  ],
  vidas: [
    "Ha sobrevivido a varias mudanzas, a dos comunidades de vecinos y a todos los cuñados.",
    "Conoce media ciudad, recuerda deudas de 1987 y nunca pierde una cola.",
    "Ha visto pasar alcaldes, modas y programas de tarde sin cambiar demasiado de opinión.",
    "Se apunta a toda excursión donde haya desayuno incluido y posibilidad de quejarse.",
    "Afirma que antes todo era más difícil, pero llevaba mejor ritmo.",
    "Tiene una mezcla peligrosa de tiempo libre, orgullo y buena memoria."
  ],
  rolesExtra: [
    "PNJ civil", "Matón de ocasión", "Empleado cansado", "Vecino curioso", "Autoridad local",
    "Sanitario", "Turista despistado", "Organizador", "Secuaz", "Testigo"
  ],
  bandosExtra: ["Neutral", "Aliado", "Hostil", "Dudoso", "Obstáculo", "Víctima", "Oposición menor"],
  descripcionesExtra: [
    "Quiere acabar la escena con el mínimo lío posible.",
    "Habla mucho, mira poco y se pone nervioso si alguien le exige concreción.",
    "Tiene prisa, una explicación incompleta y pocas ganas de colaborar.",
    "Parece inofensivo hasta que se le toca el tema que domina.",
    "Está metido en el problema, aunque quizá no entiende del todo cómo.",
    "Sirve para mover la escena, dar una pista o poner presión sin convertirlo todo en combate."
  ]
};


const PASOS = [
  { id: "modo", etiqueta: "Método" }, { id: "datos", etiqueta: "Datos" }, { id: "reglas", etiqueta: "Reglas" },
  { id: "achaques", etiqueta: "Achaques" }, { id: "resumen", etiqueta: "Resumen" }
];

const nombreAleatorio = () => `${elegir(RANDOM.nombres)} ${elegir(RANDOM.apodos)}`;
const nombreVacio = nombre => !nombre || /^(nuevo|nueva|jubilado|actor|extra|pnj)\b/i.test(nombre.trim());

function desdeActor(actor) {
  const s = actor?.system ?? {};
  const arq = arquetipoByKey(s.datos?.arquetipo);
  const habs = actor ? normalizeSkills(s.habilidades) : defaultSkills(1);
  return {
    modo: arq ? "arquetipo" : "libre", paso: 0, nombre: actor && !nombreVacio(actor.name) ? actor.name : "", img: actor?.img ?? "icons/svg/mystery-man.svg",
    arquetipoKey: arq?.key ?? "", tiradaPartido: "", tiradaSalud: 0,
    datos: {
      jugador: s.datos?.jugador || game.user.name, lugarNacimiento: s.datos?.lugarNacimiento ?? "", anos: s.datos?.anos ?? "",
      antiguaProfesion: s.datos?.antiguaProfesion ?? "", partido: s.datos?.partido ?? "", familiaNietos: s.datos?.familiaNietos ?? "",
      pertenencias: s.datos?.pertenencias ?? "", vidaMilagros: s.datos?.vidaMilagros ?? ""
    },
    atributos: actor ? { ...Object.fromEntries(Object.keys(IMSERSO.atributos).map(k => [k, n(s.atributos?.[k])])) } : { cac: 0, gra: 2, pre: 4, rob: 6 },
    habilidades: habs,
    achaques: { mayor: s.achaques?.mayor ?? "", menor: s.achaques?.menor ?? "" }
  };
}

export class Creador extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "imserso-creador", classes: ["imserso", "ims-creador"], tag: "form",
    position: { width: 700, height: 740 },
    window: { icon: "fa-solid fa-wand-magic-sparkles", resizable: true },
    form: { handler: Creador.#leer, submitOnChange: true, closeOnSubmit: false },
    actions: {
      paso: Creador.#paso, siguiente: Creador.#siguiente, anterior: Creador.#anterior, aplicar: Creador.#aplicar,
      partido: Creador.#partido, salud: Creador.#salud, achaques: Creador.#achaques, aleatorio: Creador.#aleatorio, modo: Creador.#modo
    }
  };

  static MEMORIA = "creador";
  static SCROLL_MEMORIA = [".ims-cuerpo"];
  static PARTS = { cuerpo: { template: `${RUTA}/templates/apps/creador.hbs`, scrollable: [".ims-cuerpo"] } };

  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.e = desdeActor(actor);
  }

  get title() { return this.actor ? `Asistente · ${this.actor.name}` : "Asistente de creación de jubilados"; }

  /** Lo que valdría la ficha con el método y las elecciones actuales. */
  _construir() {
    const e = this.e;
    const arq = e.modo === "arquetipo" ? arquetipoByKey(e.arquetipoKey) : null;
    const atributos = arq ? clon(arq.attrs) : { ...e.atributos };
    const habilidades = arq ? archetypeSkills(arq) : normalizeSkills(e.habilidades);
    const rob = n(atributos.rob), cac = n(atributos.cac), pre = n(atributos.pre);
    const base = arq ? arq.saludBase : R.saludBase(rob);
    return {
      arq, atributos, habilidades, yayos: arq ? arq.yayos : R.yayosIniciales(cac, rob), bemoles: R.bemoles(cac),
      nervio: R.nervio(habilidades.gimnasia.dados, pre), jamacuco: arq ? arq.jamacuco : R.jamacuco(rob),
      saludBase: base, salud: base + n(e.tiradaSalud)
    };
  }

  _avisos(c) {
    const e = this.e;
    const av = [];
    if (!e.nombre.trim()) av.push("Falta el nombre del PJ (mejor del glosario del manual: nada de Hugo ni Jessica).");
    if (e.modo === "arquetipo" && !c.arq) av.push("Elige un arquetipo.");
    if (e.modo !== "arquetipo") {
      const r = R.repartoLibre(c.atributos, c.habilidades);
      if (!r.atributosOk) av.push("Reparte una vez cada bonificador: 0, +2, +4 y +6.");
      if (r.d3 !== 4) av.push(`Hacen falta exactamente 4 habilidades a 3D (ahora ${r.d3}).`);
      if (r.d2 !== 6) av.push(`Hacen falta exactamente 6 habilidades a 2D (ahora ${r.d2}).`);
    }
    if (!e.datos.partido.trim()) av.push("Falta el partido político (2D6).");
    if (c.arq && e.datos.partido && !R.partidosPermitidos(c.arq.partido).includes(e.datos.partido)) av.push(`Ese partido no encaja con el arquetipo (vale: ${R.partidosPermitidos(c.arq.partido).join(", ")}).`);
    if (!e.achaques.mayor.trim() || !e.achaques.menor.trim()) av.push("Faltan los dos achaques.");
    if (!e.tiradaSalud) av.push("Falta tirar la Salud inicial (1D6).");
    return av;
  }

  async _prepareContext() {
    const e = this.e;
    const c = this._construir();
    const dados = h => n(e.habilidades[h]?.dados, 1);
    const cuentas = { d3: Object.values(e.habilidades).filter(h => n(h.dados) === 3).length, d2: Object.values(e.habilidades).filter(h => n(h.dados) === 2).length };
    return {
      e, c, actorExistente: Boolean(this.actor), paso: PASOS[e.paso].id, pasos: PASOS.map((p, i) => ({ ...p, i, activo: i === e.paso, hecho: i < e.paso })),
      primero: e.paso === 0, ultimo: e.paso === PASOS.length - 1,
      arquetipos: ARQUETIPOS.map(a => ({ ...a, activo: a.key === e.arquetipoKey, d3t: a.d3.map(labelForSkill).join(", "), d2t: a.d2.map(labelForSkill).join(", ") })),
      elegido: c.arq && { ...c.arq, d3t: c.arq.d3.map(labelForSkill).join(", "), d2t: c.arq.d2.map(labelForSkill).join(", "), permitidos: R.partidosPermitidos(c.arq.partido).join(", ") },
      partidos: R.PARTIDOS, libre: e.modo !== "arquetipo",
      atributos: Object.entries(IMSERSO.atributos).map(([k, a]) => ({ k, ...a, valor: n(e.atributos[k]), opciones: R.BONIFICADORES })),
      habilidades: Object.entries(IMSERSO.habilidades).map(([k, h]) => ({ k, etiqueta: h.label, atr: labelForAttribute(h.atributo), dados: dados(k), bloq3: cuentas.d3 >= 4 && dados(k) !== 3, bloq2: cuentas.d2 >= 6 && dados(k) !== 2 })),
      cuentas, avisos: this._avisos(c), listo: this._avisos(c).length === 0,
      resumenHabilidades: { d3: Object.entries(c.habilidades).filter(([, h]) => h.dados === 3).map(([k]) => labelForSkill(k)).join(", "), d2: Object.entries(c.habilidades).filter(([, h]) => h.dados === 2).map(([k]) => labelForSkill(k)).join(", ") }
    };
  }

  /** Formulario → estado. Un bonificador repetido intercambia su valor con el atributo que ya lo tenía. */
  static async #leer(event, form, formData) {
    const d = foundry.utils.expandObject(formData.object);
    const e = this.e;
    if (d.nombre !== undefined) e.nombre = d.nombre;
    if (d.modo) e.modo = d.modo;
    if (d.arquetipoKey !== undefined && d.arquetipoKey !== e.arquetipoKey) {
      e.arquetipoKey = d.arquetipoKey;
      const a = arquetipoByKey(d.arquetipoKey);
      const ok = a ? R.partidosPermitidos(a.partido) : R.PARTIDOS;
      if (ok.length === 1) e.datos.partido = ok[0]; else if (!ok.includes(e.datos.partido)) e.datos.partido = "";
    }
    Object.assign(e.datos, d.datos ?? {});
    Object.assign(e.achaques, d.achaques ?? {});
    for (const [k, v] of Object.entries(d.atributos ?? {})) {
      const antes = e.atributos[k];
      const otro = Object.keys(e.atributos).find(o => o !== k && e.atributos[o] === n(v));
      e.atributos[k] = n(v);
      if (otro) e.atributos[otro] = antes;
    }
    for (const [k, v] of Object.entries(d.habilidades ?? {})) {
      const antes = n(e.habilidades[k].dados, 1), nuevo = n(v, 1);
      const cuenta = x => Object.values(e.habilidades).filter(h => n(h.dados) === x).length;
      e.habilidades[k] = { dados: nuevo };
      if ((nuevo === 3 && antes !== 3 && cuenta(3) > 4) || (nuevo === 2 && antes !== 2 && cuenta(2) > 6)) {
        e.habilidades[k] = { dados: antes };
        ui.notifications.warn(`Ya hay ${nuevo === 3 ? "4 habilidades a 3D" : "6 habilidades a 2D"}: baja otra antes.`);
      }
    }
    this.render();
  }

  static #paso(ev, b) { this.e.paso = n(b.dataset.i); this.render(); }
  static #siguiente() { this.e.paso = Math.min(PASOS.length - 1, this.e.paso + 1); this.render(); }
  static #anterior() { this.e.paso = Math.max(0, this.e.paso - 1); this.render(); }
  static #modo(ev, b) { this.e.modo = b.dataset.modo; if (b.dataset.modo === "aleatorio") return Creador.#aleatorio.call(this); this.render(); }

  static async #partido() {
    const roll = await new Roll("2d6").evaluate();
    const a = this.e.modo === "arquetipo" ? arquetipoByKey(this.e.arquetipoKey) : null;
    const ok = a ? R.partidosPermitidos(a.partido) : R.PARTIDOS;
    const p = R.partidoDe2d6(roll.total);
    this.e.datos.partido = ok.includes(p) ? p : ok[0];
    this.e.tiradaPartido = roll.total;
    await publicar({ tono: "aviso", icono: "fa-solid fa-landmark", etiqueta: "Partido político", titulo: this.e.datos.partido, texto: `2D6 = ${roll.total}${ok.includes(p) ? "" : ` (el arquetipo solo admite: ${ok.join(", ")})`}` }, { rolls: [roll], alias: "Asistente" });
    this.render();
  }

  static async #salud() {
    const roll = await new Roll("1d6").evaluate();
    this.e.tiradaSalud = roll.total;
    await publicar({ tono: "aviso", icono: "fa-solid fa-heart-pulse", etiqueta: "Salud inicial", titulo: `1D6 = ${roll.total}` }, { rolls: [roll], alias: "Asistente" });
    this.render();
  }

  static #achaques() {
    const r = rollAchaqueIndexes();
    this.e.achaques = { menor: getAchaque(r.menor), mayor: getAchaque(r.mayor) };
    this.render();
  }

  static async #aleatorio() {
    const g = await generarAleatorio(this.e);
    Object.assign(this.e, g, { modo: "aleatorio", paso: PASOS.findIndex(p => p.id === "resumen") });
    this.render();
  }

  static async #aplicar() {
    const e = this.e;
    if (e.modo === "aleatorio" && !R.repartoLibre(e.atributos, e.habilidades).ok) Object.assign(e, await generarAleatorio(e));
    const c = this._construir();
    const avisos = this._avisos(c);
    if (avisos.length) { ui.notifications.warn(avisos[0]); return this.render(); }
    const cambios = {
      name: e.nombre.trim(), img: e.img,
      ...Object.fromEntries(Object.entries(e.datos).map(([k, v]) => [`system.datos.${k}`, v])),
      "system.achaques.mayor": e.achaques.mayor, "system.achaques.menor": e.achaques.menor, "system.achaques.menorUsado": false,
      "system.yayopoints.valor": c.yayos, "system.yayopoints.inicial": c.yayos,
      "system.salud.valor": c.salud, "system.salud.max": c.salud,
      "system.jamacuco.valor": c.jamacuco, "system.jamacuco.primeraTirada": false,
      "system.jamacuco.umbrales": Object.fromEntries(R.UMBRALES.map(u => [u, false])),
      "system.atributos": c.atributos, "system.habilidades": c.habilidades
    };
    if (c.arq) Object.assign(cambios, archetypeSystem(c.arq, n(e.tiradaSalud, 1)), { "system.datos.partido": e.datos.partido });
    else Object.assign(cambios, { "system.datos.arquetipo": "Libre", "system.datos.talento": "" });
    const actor = this.actor ?? await Actor.create({ name: e.nombre.trim(), type: "jubilado", img: e.img });
    await actor.update(cambios);
    if (c.arq && !actor.items.some(i => i.type === "talento" && i.name === c.arq.talentName)) await actor.createEmbeddedDocuments("Item", [archetypeTalentItem(c.arq)]);
    await publicar({
      tono: "exito", icono: "fa-solid fa-person-cane", etiqueta: "Jubilado creado", titulo: actor.name,
      texto: `${c.arq ? `Arquetipo ${c.arq.name}` : "Creación libre"}: ${c.yayos} yayopoints, Salud ${c.salud}, Jamacuco ${c.jamacuco}.`
    }, { actor });
    actor.sheet.render(true);
    this.close();
  }
}

/** Jubilado al azar con las reglas de creación libre. */
async function generarAleatorio(base = {}) {
  const valores = mezclar(R.BONIFICADORES);
  const atributos = Object.fromEntries(Object.keys(IMSERSO.atributos).map((k, i) => [k, valores[i]]));
  const claves = mezclar(Object.keys(IMSERSO.habilidades));
  const habilidades = defaultSkills(1);
  claves.slice(0, 4).forEach(k => { habilidades[k] = { dados: 3 }; });
  claves.slice(4, 10).forEach(k => { habilidades[k] = { dados: 2 }; });
  const partido = await new Roll("2d6").evaluate();
  const salud = await new Roll("1d6").evaluate();
  const a = rollAchaqueIndexes();
  return {
    nombre: nombreVacio(base.nombre) ? nombreAleatorio() : base.nombre, atributos, habilidades,
    tiradaPartido: partido.total, tiradaSalud: salud.total, achaques: { menor: getAchaque(a.menor), mayor: getAchaque(a.mayor) },
    datos: {
      ...(base.datos ?? {}), jugador: base.datos?.jugador || game.user.name, lugarNacimiento: elegir(RANDOM.lugares), anos: elegir(RANDOM.anos),
      antiguaProfesion: elegir(RANDOM.profesiones), partido: R.partidoDe2d6(partido.total), familiaNietos: elegir(RANDOM.familias),
      pertenencias: elegir(RANDOM.pertenencias), vidaMilagros: elegir(RANDOM.vidas)
    }
  };
}

/** Extra al azar: bonificadores libres, 2 habilidades a 3D y 5 a 2D. */
export async function extraAleatorio(actor) {
  if (actor?.type !== "extra") return null;
  const v = mezclar([0, 1, 2, 3]);
  const atributos = Object.fromEntries(Object.keys(IMSERSO.atributos).map((k, i) => [k, v[i]]));
  const claves = mezclar(Object.keys(IMSERSO.habilidades));
  const habilidades = defaultSkills(1);
  claves.slice(0, 2).forEach(k => { habilidades[k] = { dados: 3 }; });
  claves.slice(2, 7).forEach(k => { habilidades[k] = { dados: 2 }; });
  const tipo = elegir(Object.keys(IMSERSO.ataqueTipos));
  const ataque = IMSERSO.ataqueTipos[tipo];
  const salud = 8 + atributos.rob * 2 + Math.floor(Math.random() * 5);
  const nombre = nombreAleatorio(), rol = elegir(RANDOM.rolesExtra), bando = elegir(RANDOM.bandosExtra);
  await actor.update({
    name: nombre, "system.rol": rol, "system.bando": bando, "system.descripcion": elegir(RANDOM.descripcionesExtra),
    "system.notas": `Generado al azar. Especialidades: ${claves.slice(0, 7).map(labelForSkill).join(", ")}.`,
    "system.atributos": atributos, "system.habilidades": habilidades, "system.salud.valor": salud, "system.salud.max": salud,
    "system.bemoles.manual": false, "system.nervio.manual": false,
    "system.ataque.tipo": tipo, "system.ataque.nombre": ataque.label, "system.ataque.habilidad": ataque.habilidad, "system.ataque.dano": ataque.dano
  });
  return actor;
}

export const abrirCreador = actor => new Creador(actor).render({ force: true });
