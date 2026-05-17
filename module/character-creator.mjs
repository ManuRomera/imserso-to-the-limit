import { IMSERSO, defaultSkills, labelForAttribute, labelForSkill, normalizeSkills } from "./config.mjs";
import { ARQUETIPOS, archetypeSkills, archetypeSystem, archetypeTalentItem, arquetipoByKey } from "./arquetipos-data.mjs";
import { getAchaque, rollAchaqueIndexes } from "./reglas-data.mjs";

const ApplicationV1 = foundry.appv1?.api?.Application ?? globalThis.Application;

const PARTIDOS = [
  "Con Franco se vivía mejor",
  "PEPÉ",
  "Ciutadanos",
  "SOE",
  "El del Coletas"
];

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

const STEPS = [
  { key: "modo", label: "Método" },
  { key: "datos", label: "Datos" },
  { key: "reglas", label: "Reglas" },
  { key: "achaques", label: "Achaques" },
  { key: "resumen", label: "Resumen" }
];

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  return foundry.utils.deepClone(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function partyFromRoll(total) {
  if (total <= 2) return "Con Franco se vivía mejor";
  if (total <= 6) return "PEPÉ";
  if (total <= 8) return "Ciutadanos";
  if (total <= 11) return "SOE";
  return "El del Coletas";
}

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function choice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomName() {
  return `${choice(RANDOM.nombres)} ${choice(RANDOM.apodos)}`;
}

function keepExistingName(name) {
  const value = String(name ?? "").trim();
  if (!value) return "";
  if (/^(nuevo|nueva|jubilado|actor|extra|pnj)\b/i.test(value)) return "";
  return value;
}

function legalDefaultAttributes() {
  return { cac: 0, gra: 2, pre: 4, rob: 6 };
}

function normalizeAttributes(source = {}, { useLegalDefault = true } = {}) {
  const fallback = useLegalDefault ? legalDefaultAttributes() : { cac: 0, gra: 0, pre: 0, rob: 0 };
  const attrs = {};
  for (const key of Object.keys(IMSERSO.atributos)) attrs[key] = number(source?.[key], fallback[key]);
  return attrs;
}

function allowedParties(arquetipo) {
  const partido = arquetipo?.partido ?? "Cualquiera";
  if (!partido.startsWith("Cualquiera")) return [partido];
  if (!partido.includes("salvo")) return PARTIDOS;
  const denied = partido.split("salvo")[1].split(/,| y /).map((part) => part.trim()).filter(Boolean);
  return PARTIDOS.filter((part) => !denied.includes(part));
}

function dataFromActor(actor) {
  const sys = actor?.system ?? {};
  const currentArquetipo = arquetipoByKey(sys.datos?.arquetipo);
  return {
    name: actor?.name ?? "Nuevo jubilado",
    img: actor?.img ?? "icons/svg/mystery-man.svg",
    mode: currentArquetipo ? "arquetipo" : "libre",
    step: 0,
    arquetipoKey: currentArquetipo?.key ?? "",
    partidoRoll: "",
    healthRoll: "",
    datos: {
      jugador: sys.datos?.jugador ?? game.user.name ?? "",
      lugarNacimiento: sys.datos?.lugarNacimiento ?? "",
      anos: sys.datos?.anos ?? "",
      antiguaProfesion: sys.datos?.antiguaProfesion ?? "",
      partido: sys.datos?.partido ?? "",
      familiaNietos: sys.datos?.familiaNietos ?? "",
      pertenencias: sys.datos?.pertenencias ?? "",
      vidaMilagros: sys.datos?.vidaMilagros ?? ""
    },
    atributos: normalizeAttributes(sys.atributos),
    habilidades: normalizeSkills(sys.habilidades && Object.keys(sys.habilidades).length ? sys.habilidades : defaultSkills(1)),
    achaques: {
      mayor: sys.achaques?.mayor ?? "",
      menor: sys.achaques?.menor ?? ""
    }
  };
}

export async function generateRandomJubiladoState(base = {}) {
  const attrValues = shuffle([0, 2, 4, 6]);
  const attrKeys = Object.keys(IMSERSO.atributos);
  const atributos = Object.fromEntries(attrKeys.map((key, index) => [key, attrValues[index]]));
  const skillKeys = shuffle(Object.keys(IMSERSO.habilidades));
  const habilidades = defaultSkills(1);
  for (const key of skillKeys.slice(0, 4)) habilidades[key] = { dados: 3 };
  for (const key of skillKeys.slice(4, 10)) habilidades[key] = { dados: 2 };
  const partyRoll = await new Roll("2d6").evaluate({ async: true });
  const healthRoll = await new Roll("1d6").evaluate({ async: true });
  const aches = rollAchaqueIndexes();
  return {
    name: keepExistingName(base.name) || randomName(),
    atributos,
    habilidades,
    partyRoll,
    healthRoll,
    achaques: {
      menor: getAchaque(aches.menor),
      mayor: getAchaque(aches.mayor)
    },
    datos: {
      jugador: base.datos?.jugador ?? game.user.name ?? "",
      lugarNacimiento: choice(RANDOM.lugares),
      anos: choice(RANDOM.anos),
      antiguaProfesion: choice(RANDOM.profesiones),
      partido: partyFromRoll(partyRoll.total),
      familiaNietos: choice(RANDOM.familias),
      pertenencias: choice(RANDOM.pertenencias),
      vidaMilagros: choice(RANDOM.vidas)
    },
    skills3: skillKeys.slice(0, 4),
    skills2: skillKeys.slice(4, 10)
  };
}

export async function applyRandomExtra(actor) {
  if (!actor || actor.type !== "extra") return null;
  const attrValues = shuffle([0, 1, 2, 3]);
  const attrKeys = Object.keys(IMSERSO.atributos);
  const atributos = Object.fromEntries(attrKeys.map((key, index) => [key, attrValues[index]]));
  const skillKeys = shuffle(Object.keys(IMSERSO.habilidades));
  const habilidades = defaultSkills(1);
  for (const key of skillKeys.slice(0, 2)) habilidades[key] = { dados: 3 };
  for (const key of skillKeys.slice(2, 7)) habilidades[key] = { dados: 2 };
  const attackType = choice(Object.keys(IMSERSO.ataqueTipos));
  const attack = IMSERSO.ataqueTipos[attackType] ?? IMSERSO.ataqueTipos.sinArmas;
  const health = 8 + (Number(atributos.rob) || 0) * 2 + Math.floor(Math.random() * 5);
  const bemoles = 7 + (Number(atributos.cac) || 0);
  const nervio = (Number(habilidades.gimnasia?.dados) || 1) * 3 + (Number(atributos.pre) || 0);
  const name = randomName();
  const rol = choice(RANDOM.rolesExtra);
  const bando = choice(RANDOM.bandosExtra);
  const descripcion = choice(RANDOM.descripcionesExtra);
  await actor.update({
    name,
    "system.rol": rol,
    "system.bando": bando,
    "system.descripcion": descripcion,
    "system.notas": `Generado automaticamente. Especialidades: ${skillKeys.slice(0, 7).map(labelForSkill).join(", ")}.`,
    "system.atributos": atributos,
    "system.habilidades": habilidades,
    "system.salud.valor": health,
    "system.salud.max": health,
    "system.bemoles.valor": bemoles,
    "system.bemoles.manual": false,
    "system.nervio.valor": nervio,
    "system.nervio.manual": false,
    "system.ataque.tipo": attackType,
    "system.ataque.nombre": attack.label,
    "system.ataque.habilidad": attack.habilidad,
    "system.ataque.dano": attack.dano
  });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="ims-chat-card">
        <h3>Extra generado</h3>
        <p><strong>${escapeHtml(name)}</strong> queda preparado como ${escapeHtml(rol)} (${escapeHtml(bando)}).</p>
        <p><strong>Ataque:</strong> ${escapeHtml(attack.label)} · ${escapeHtml(labelForSkill(attack.habilidad))} · Daño ${attack.dano}.</p>
      </div>`
  });
  actor.sheet?.render(false);
  return actor;
}

export class ImsersoCharacterCreator extends ApplicationV1 {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.state = dataFromActor(actor);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "imserso-character-creator",
      classes: ["imserso", "ims-creator-app"],
      title: "Creador guiado de jubilados",
      template: `systems/${IMSERSO.ID}/templates/apps/character-creator.hbs`,
      width: 920,
      height: 720,
      resizable: true
    });
  }

  get title() {
    return this.actor ? `Creador guiado · ${this.actor.name}` : "Creador guiado de jubilados";
  }

  async _render(force, options) {
    if (this._resetCreatorScroll) {
      await super._render(force, options);
      this._resetCreatorScroll = false;
      this._scrollCreatorToTop();
      return;
    }
    this._captureCreatorScroll();
    await super._render(force, options);
    this._restoreCreatorScroll();
  }

  getData() {
    const arquetipo = arquetipoByKey(this.state.arquetipoKey);
    const effective = this._effectiveBuild();
    const selectedCounts = this._selectedSkillCounts();
    const skillRows = Object.entries(IMSERSO.habilidades).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      attr: labelForAttribute(cfg.atributo),
      dice: number(this.state.habilidades?.[key]?.dados, 1),
      is3: number(this.state.habilidades?.[key]?.dados, 1) === 3,
      is2: number(this.state.habilidades?.[key]?.dados, 1) === 2,
      lock2: selectedCounts.d2 >= 6 && number(this.state.habilidades?.[key]?.dados, 1) !== 2,
      lock3: selectedCounts.d3 >= 4 && number(this.state.habilidades?.[key]?.dados, 1) !== 3
    }));
    const steps = STEPS.map((step, index) => ({
      ...step,
      index,
      active: index === this.state.step,
      done: index < this.state.step
    }));
    const selected3 = selectedCounts.d3;
    const selected2 = selectedCounts.d2;
    return {
      state: this.state,
      actor: this.actor,
      steps,
      stepKey: STEPS[this.state.step]?.key ?? "modo",
      arquetipos: ARQUETIPOS.map((entry) => ({
        ...entry,
        selected: entry.key === this.state.arquetipoKey,
        skill3: entry.d3.map(labelForSkill).join(", "),
        skill2: entry.d2.map(labelForSkill).join(", ")
      })),
      selectedArquetipo: arquetipo ? {
        ...arquetipo,
        skill3: arquetipo.d3.map(labelForSkill).join(", "),
        skill2: arquetipo.d2.map(labelForSkill).join(", "),
        allowedParties: allowedParties(arquetipo).join(", ")
      } : null,
      partidos: PARTIDOS.map((name) => ({ name, selected: this.state.datos.partido === name })),
      atributos: Object.entries(IMSERSO.atributos).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        short: cfg.short,
        value: number(this.state.atributos?.[key], 0),
        options: [0, 2, 4, 6].map((value) => ({
          value,
          label: value ? `+${value}` : "0"
        }))
      })),
      habilidades: skillRows,
      selected3,
      selected2,
      effective,
      warnings: this._warnings(effective, selected3, selected2)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-creator-step]").on("click", (event) => this._goTo(Number(event.currentTarget.dataset.creatorStep)));
    html.find("[data-creator-mode]").on("change", async (event) => {
      this._readForm();
      this.state.mode = event.currentTarget.value;
      if (this.state.mode === "aleatorio") {
        await this._randomCharacter({ readForm: false });
        return;
      }
      this.render(false);
    });
    html.find("[data-creator-next]").on("click", () => this._next());
    html.find("[data-creator-prev]").on("click", () => this._prev());
    html.find("[data-creator-apply]").on("click", () => this._apply());
    html.find("[data-roll-party]").on("click", () => this._rollParty());
    html.find("[data-roll-health]").on("click", () => this._rollHealth());
    html.find("[data-roll-aches]").on("click", () => this._rollAches());
    html.find("[data-random-character]").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._randomCharacter();
    });
    html.find("[data-attribute-bonus]").on("change", (event) => {
      const key = event.currentTarget.dataset.attributeBonus;
      const previous = number(this.state.atributos?.[key], 0);
      this._readForm();
      const selected = number(this.state.atributos?.[key], previous);
      const swapKey = Object.keys(IMSERSO.atributos).find((otherKey) => otherKey !== key && number(this.state.atributos?.[otherKey], -1) === selected);
      if (swapKey) this.state.atributos[swapKey] = previous;
      this.render(false);
    });
    html.find("[name='arquetipoKey']").on("change", () => {
      this._readForm();
      const arquetipo = arquetipoByKey(this.state.arquetipoKey);
      const allowed = allowedParties(arquetipo);
      if (allowed.length === 1) this.state.datos.partido = allowed[0];
      if (this.state.datos.partido && !allowed.includes(this.state.datos.partido)) this.state.datos.partido = "";
      this.render(false);
    });
    html.find("[data-skill-rank]").on("change", (event) => {
      const key = event.currentTarget.dataset.skillRank;
      const previous = number(this.state.habilidades?.[key]?.dados, 1);
      this._readForm();
      const rank = Number(event.currentTarget.value) || 1;
      this.state.habilidades[key] = { dados: rank };
      const counts = this._selectedSkillCounts();
      if (rank === 3 && previous !== 3 && counts.d3 > 4) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn("Ya hay 4 habilidades a 3D. Baja otra habilidad antes de subir esta.");
      }
      if (rank === 2 && previous !== 2 && counts.d2 > 6) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn("Ya hay 6 habilidades a 2D. Baja otra habilidad antes de subir esta.");
      }
      this.render(false);
    });
  }

  _selectedSkillCounts(habilidades = this.state.habilidades) {
    const rows = Object.values(habilidades ?? {});
    return {
      d3: rows.filter((row) => number(row?.dados, 1) === 3).length,
      d2: rows.filter((row) => number(row?.dados, 1) === 2).length
    };
  }

  _hasLegalFreeBuild() {
    const values = Object.values(this.state.atributos ?? {}).map((value) => number(value, -1));
    const counts = this._selectedSkillCounts();
    return new Set(values).size === 4
      && [0, 2, 4, 6].every((value) => values.includes(value))
      && counts.d3 === 4
      && counts.d2 === 6
      && !!this.state.datos.partido?.trim()
      && !!this.state.achaques.mayor?.trim()
      && !!this.state.achaques.menor?.trim()
      && !!this.state.healthRoll;
  }

  _readForm() {
    const form = this.element?.[0]?.querySelector("form");
    if (!form) return;
    const data = new FormData(form);
    this.state.name = String(data.get("name") ?? this.state.name);
    this.state.mode = String(data.get("mode") ?? this.state.mode);
    this.state.arquetipoKey = String(data.get("arquetipoKey") ?? this.state.arquetipoKey);
    for (const key of Object.keys(this.state.datos)) {
      this.state.datos[key] = String(data.get(`datos.${key}`) ?? this.state.datos[key] ?? "");
    }
    for (const key of Object.keys(IMSERSO.atributos)) {
      const field = `atributos.${key}`;
      if (data.has(field)) this.state.atributos[key] = number(data.get(field), this.state.atributos[key]);
    }
    for (const key of Object.keys(IMSERSO.habilidades)) {
      const field = `habilidades.${key}`;
      if (data.has(field)) this.state.habilidades[key] = { dados: number(data.get(field), this.state.habilidades[key]?.dados ?? 1) };
    }
    this.state.achaques.mayor = String(data.get("achaques.mayor") ?? this.state.achaques.mayor ?? "");
    this.state.achaques.menor = String(data.get("achaques.menor") ?? this.state.achaques.menor ?? "");
  }

  _captureCreatorScroll() {
    const root = this.element?.[0];
    if (!root) return;
    const main = root.querySelector(".ims-creator-main");
    const content = root.closest(".window-app")?.querySelector(".window-content");
    this._creatorScrollState = {
      mainTop: main?.scrollTop ?? 0,
      mainLeft: main?.scrollLeft ?? 0,
      contentTop: content?.scrollTop ?? 0,
      contentLeft: content?.scrollLeft ?? 0
    };
  }

  _restoreCreatorScroll() {
    const state = this._creatorScrollState;
    if (!state) return;
    window.setTimeout(() => {
      const root = this.element?.[0];
      if (!root) return;
      const main = root.querySelector(".ims-creator-main");
      const content = root.closest(".window-app")?.querySelector(".window-content");
      if (main) {
        main.scrollTop = state.mainTop;
        main.scrollLeft = state.mainLeft;
      }
      if (content) {
        content.scrollTop = state.contentTop;
        content.scrollLeft = state.contentLeft;
      }
    }, 0);
  }

  _scrollCreatorToTop() {
    window.setTimeout(() => {
      const root = this.element?.[0];
      if (!root) return;
      const main = root.querySelector(".ims-creator-main");
      const content = root.closest(".window-app")?.querySelector(".window-content");
      if (main) main.scrollTop = 0;
      if (content) content.scrollTop = 0;
    }, 0);
  }

  _goTo(step) {
    this._readForm();
    this.state.step = Math.min(STEPS.length - 1, Math.max(0, step));
    if (STEPS[this.state.step]?.key === "resumen" && this.state.mode === "libre" && !this._hasLegalFreeBuild()) {
      this._syncLegalManualFromActor();
    }
    this._resetCreatorScroll = true;
    this.render(false);
  }

  _next() {
    this._readForm();
    this.state.step = Math.min(STEPS.length - 1, this.state.step + 1);
    if (STEPS[this.state.step]?.key === "resumen" && this.state.mode === "libre" && !this._hasLegalFreeBuild()) {
      this._syncLegalManualFromActor();
    }
    this._resetCreatorScroll = true;
    this.render(false);
  }

  _prev() {
    this._readForm();
    this.state.step = Math.max(0, this.state.step - 1);
    this._resetCreatorScroll = true;
    this.render(false);
  }

  async _rollParty() {
    this._readForm();
    const roll = await new Roll("2d6").evaluate({ async: true });
    const party = partyFromRoll(roll.total);
    const arquetipo = arquetipoByKey(this.state.arquetipoKey);
    const allowed = this.state.mode === "arquetipo" ? allowedParties(arquetipo) : PARTIDOS;
    this.state.partidoRoll = `${roll.total}`;
    this.state.datos.partido = allowed.includes(party) ? party : allowed[0] ?? party;
    await roll.toMessage({
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador IMSERSO" },
      flavor: `<div class="ims-chat-card"><h3>Partido político</h3><p>Resultado 2D6: <strong>${roll.total}</strong>. Partido: <strong>${escapeHtml(this.state.datos.partido)}</strong>.</p></div>`
    });
    this.render(false);
  }

  async _rollHealth() {
    this._readForm();
    const roll = await new Roll("1d6").evaluate({ async: true });
    this.state.healthRoll = roll.total;
    await roll.toMessage({
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador IMSERSO" },
      flavor: `<div class="ims-chat-card"><h3>Salud inicial</h3><p>Resultado 1D6: <strong>${roll.total}</strong>.</p></div>`
    });
    this.render(false);
  }

  _rollAches() {
    this._readForm();
    const rolled = rollAchaqueIndexes();
    this.state.achaques.menor = getAchaque(rolled.menor);
    this.state.achaques.mayor = getAchaque(rolled.mayor);
    ChatMessage.create({
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador IMSERSO" },
      content: `
        <div class="ims-chat-card">
          <h3>Achaques generados</h3>
          <p><strong>Mayor:</strong> ${escapeHtml(this.state.achaques.mayor)}</p>
          <p><strong>Menor:</strong> ${escapeHtml(this.state.achaques.menor)}</p>
        </div>`
    });
    this.render(false);
  }

  _effectiveBuild() {
    const arquetipo = arquetipoByKey(this.state.arquetipoKey);
    const isArchetype = this.state.mode === "arquetipo" && arquetipo;
    const attrs = isArchetype ? clone(arquetipo.attrs) : normalizeAttributes(this.state.atributos);
    const skills = isArchetype ? archetypeSkills(arquetipo) : normalizeSkills(this.state.habilidades);
    const rob = number(attrs.rob, 0);
    const cac = number(attrs.cac, 0);
    const pre = number(attrs.pre, 0);
    const healthBase = isArchetype ? arquetipo.saludBase : rob * 2 + 10;
    const healthRoll = number(this.state.healthRoll, 0);
    return {
      arquetipo,
      attrs,
      skills,
      yayos: isArchetype ? arquetipo.yayos : Math.floor((cac + rob) / 2) + 2,
      bemoles: cac + 7,
      nervio: number(skills.gimnasia?.dados, 1) * 3 + pre,
      jamacuco: isArchetype ? arquetipo.jamacuco : 12 - rob,
      healthBase,
      healthRoll,
      health: healthBase + (healthRoll || 0),
      talentName: isArchetype ? arquetipo.talentName : "",
      talent: isArchetype ? arquetipo.talent : ""
    };
  }

  _warnings(effective, selected3, selected2) {
    const warnings = [];
    if (!this.state.name.trim()) warnings.push("Falta el nombre del PJ.");
    if (this.state.mode === "arquetipo" && !effective.arquetipo) warnings.push("Selecciona un arquetipo.");
    if (this.state.mode === "arquetipo" && effective.arquetipo && this.state.datos.partido && !allowedParties(effective.arquetipo).includes(this.state.datos.partido)) {
      warnings.push(`El partido no encaja con el arquetipo. Opciones permitidas: ${allowedParties(effective.arquetipo).join(", ")}.`);
    }
    if (["libre", "aleatorio"].includes(this.state.mode)) {
      const values = Object.values(this.state.atributos).map((value) => number(value, -1));
      if (new Set(values).size !== 4 || ![0, 2, 4, 6].every((value) => values.includes(value))) warnings.push("En creación libre hay que repartir una vez cada bonificador: 0, +2, +4 y +6.");
      if (selected3 !== 4) warnings.push(`Selecciona exactamente 4 habilidades a 3D. Ahora: ${selected3}.`);
      if (selected2 !== 6) warnings.push(`Selecciona exactamente 6 habilidades a 2D. Ahora: ${selected2}.`);
    }
    if (!this.state.datos.partido.trim()) warnings.push("Falta determinar el partido.");
    if (!this.state.achaques.mayor.trim() || !this.state.achaques.menor.trim()) warnings.push("Faltan los dos achaques.");
    if (!this.state.healthRoll) warnings.push("Falta tirar la Salud inicial con 1D6.");
    return warnings;
  }

  _syncLegalManualFromActor() {
    if (!this.actor || !["libre", "aleatorio"].includes(this.state.mode)) return false;
    const attrs = normalizeAttributes(this.actor.system?.atributos);
    const skills = normalizeSkills(this.actor.system?.habilidades);
    const values = Object.values(attrs).map((value) => number(value, -1));
    const counts = this._selectedSkillCounts(skills);
    const legal = new Set(values).size === 4
      && [0, 2, 4, 6].every((value) => values.includes(value))
      && counts.d3 === 4
      && counts.d2 === 6;
    if (!legal) return false;
    this.state.atributos = attrs;
    this.state.habilidades = skills;
    return true;
  }

  async _randomCharacter({ readForm = true, render = true, announce = true } = {}) {
    if (readForm) this._readForm();
    const generated = await generateRandomJubiladoState(this.state);
    this.state.mode = "aleatorio";
    this.state.name = generated.name;
    this.state.atributos = generated.atributos;
    this.state.habilidades = generated.habilidades;
    this.state.datos = { ...this.state.datos, ...generated.datos };
    this.state.partidoRoll = `${generated.partyRoll.total}`;
    this.state.healthRoll = generated.healthRoll.total;
    this.state.achaques = generated.achaques;
    this.state.step = STEPS.findIndex((step) => step.key === "resumen");

    const selected3 = generated.skills3.map(labelForSkill).join(", ");
    const selected2 = generated.skills2.map(labelForSkill).join(", ");
    if (announce) {
      await ChatMessage.create({
        speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador IMSERSO" },
        content: `
          <div class="ims-chat-card">
            <h3>Jubilado aleatorio preparado</h3>
            <p><strong>${escapeHtml(this.state.name)}</strong> · ${escapeHtml(this.state.datos.antiguaProfesion)} de ${escapeHtml(this.state.datos.lugarNacimiento)}.</p>
            <p><strong>Partido:</strong> ${escapeHtml(this.state.datos.partido)} (${generated.partyRoll.total} en 2D6).</p>
            <p><strong>Salud inicial:</strong> ${generated.healthRoll.total} en 1D6.</p>
            <p><strong>Habilidades 3D:</strong> ${escapeHtml(selected3)}.</p>
            <p><strong>Habilidades 2D:</strong> ${escapeHtml(selected2)}.</p>
          </div>`
      });
    }
    if (render) this.render(false);
  }

  async _apply() {
    this._readForm();
    if (this.state.mode === "aleatorio" && !this._hasLegalFreeBuild()) {
      await this._randomCharacter({ readForm: false, render: false });
    }
    if (this.state.mode === "libre") this._syncLegalManualFromActor();
    if (!this.state.healthRoll) await this._rollHealth();
    const effective = this._effectiveBuild();
    const skillRows = Object.values(this.state.habilidades);
    const selected3 = skillRows.filter((row) => number(row.dados, 1) === 3).length;
    const selected2 = skillRows.filter((row) => number(row.dados, 1) === 2).length;
    const warnings = this._warnings(effective, selected3, selected2);
    if (warnings.length) {
      ui.notifications.warn(warnings[0]);
      this.render(false);
      return null;
    }

    const updateData = {
      name: this.state.name.trim(),
      img: this.state.img,
      "system.datos.jugador": this.state.datos.jugador,
      "system.datos.lugarNacimiento": this.state.datos.lugarNacimiento,
      "system.datos.anos": this.state.datos.anos,
      "system.datos.antiguaProfesion": this.state.datos.antiguaProfesion,
      "system.datos.partido": this.state.datos.partido,
      "system.datos.familiaNietos": this.state.datos.familiaNietos,
      "system.datos.pertenencias": this.state.datos.pertenencias,
      "system.datos.vidaMilagros": this.state.datos.vidaMilagros,
      "system.achaques.mayor": this.state.achaques.mayor,
      "system.achaques.menor": this.state.achaques.menor,
      "system.achaques.menorUsado": false,
      "system.yayopoints.valor": effective.yayos,
      "system.yayopoints.inicial": effective.yayos,
      "system.salud.valor": effective.health,
      "system.salud.max": effective.health,
      "system.jamacuco.valor": effective.jamacuco,
      "system.jamacuco.primeraTirada": false,
      "system.jamacuco.umbrales": { 15: false, 10: false, 6: false, 3: false, 1: false },
      "system.atributos": effective.attrs,
      "system.habilidades": effective.skills
    };

    if (effective.arquetipo) {
      foundry.utils.mergeObject(updateData, archetypeSystem(effective.arquetipo, number(this.state.healthRoll, 1)));
      updateData["system.datos.partido"] = this.state.datos.partido;
    } else {
      updateData["system.datos.arquetipo"] = "Libre";
      updateData["system.datos.talento"] = "";
    }

    const actor = this.actor ?? await Actor.create({ name: this.state.name.trim(), type: "jubilado", img: this.state.img });
    await actor.update(updateData);
    if (effective.arquetipo) {
      const existingTalent = actor.items.find((item) => item.type === "talento" && item.name === effective.arquetipo.talentName);
      if (!existingTalent) await actor.createEmbeddedDocuments("Item", [archetypeTalentItem(effective.arquetipo)]);
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="ims-chat-card">
          <h3>Jubilado creado</h3>
          <p><strong>${escapeHtml(actor.name)}</strong> queda preparado con ${effective.yayos} yayopoints, Salud ${effective.health} y Jamacuco ${effective.jamacuco}.</p>
          <p><strong>Método:</strong> ${effective.arquetipo ? `Arquetipo ${escapeHtml(effective.arquetipo.name)}` : "Creación libre"}.</p>
        </div>`
    });
    this.actor = actor;
    actor.sheet?.render(true);
    this.close();
    return actor;
  }
}

export function openCharacterCreator(actor = null) {
  return new ImsersoCharacterCreator(actor).render(true);
}
