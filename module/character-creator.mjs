import { IMSERSO, defaultSkills, labelForAttribute, labelForSkill } from "./config.mjs";
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
    atributos: clone(sys.atributos ?? { cac: 0, gra: 2, pre: 4, rob: 6 }),
    habilidades: clone(sys.habilidades && Object.keys(sys.habilidades).length ? sys.habilidades : defaultSkills(1)),
    achaques: {
      mayor: sys.achaques?.mayor ?? "",
      menor: sys.achaques?.menor ?? ""
    }
  };
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

  getData() {
    const arquetipo = arquetipoByKey(this.state.arquetipoKey);
    const effective = this._effectiveBuild();
    const skillRows = Object.entries(IMSERSO.habilidades).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      attr: labelForAttribute(cfg.atributo),
      dice: number(this.state.habilidades?.[key]?.dados, 1),
      is3: number(this.state.habilidades?.[key]?.dados, 1) === 3,
      is2: number(this.state.habilidades?.[key]?.dados, 1) === 2
    }));
    const steps = STEPS.map((step, index) => ({
      ...step,
      index,
      active: index === this.state.step,
      done: index < this.state.step
    }));
    const selected3 = skillRows.filter((row) => row.is3).length;
    const selected2 = skillRows.filter((row) => row.is2).length;
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
      attrOptions: [0, 2, 4, 6].map((value) => ({ value, label: value ? `+${value}` : "0" })),
      atributos: Object.entries(IMSERSO.atributos).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        short: cfg.short,
        value: number(this.state.atributos?.[key], 0)
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
    html.find("[data-creator-mode]").on("change", (event) => {
      this._readForm();
      this.state.mode = event.currentTarget.value;
      this.render(false);
    });
    html.find("[data-creator-next]").on("click", () => this._next());
    html.find("[data-creator-prev]").on("click", () => this._prev());
    html.find("[data-creator-apply]").on("click", () => this._apply());
    html.find("[data-roll-party]").on("click", () => this._rollParty());
    html.find("[data-roll-health]").on("click", () => this._rollHealth());
    html.find("[data-roll-aches]").on("click", () => this._rollAches());
    html.find("[name='arquetipoKey']").on("change", () => {
      this._readForm();
      const arquetipo = arquetipoByKey(this.state.arquetipoKey);
      const allowed = allowedParties(arquetipo);
      if (allowed.length === 1) this.state.datos.partido = allowed[0];
      if (this.state.datos.partido && !allowed.includes(this.state.datos.partido)) this.state.datos.partido = "";
      this.render(false);
    });
    html.find("[data-skill-rank]").on("change", (event) => {
      this._readForm();
      const key = event.currentTarget.dataset.skillRank;
      const rank = Number(event.currentTarget.value) || 1;
      this.state.habilidades[key] = { dados: rank };
      this.render(false);
    });
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
      this.state.atributos[key] = number(data.get(`atributos.${key}`), this.state.atributos[key]);
    }
    for (const key of Object.keys(IMSERSO.habilidades)) {
      this.state.habilidades[key] = { dados: number(data.get(`habilidades.${key}`), this.state.habilidades[key]?.dados ?? 1) };
    }
    this.state.achaques.mayor = String(data.get("achaques.mayor") ?? this.state.achaques.mayor ?? "");
    this.state.achaques.menor = String(data.get("achaques.menor") ?? this.state.achaques.menor ?? "");
  }

  _goTo(step) {
    this._readForm();
    this.state.step = Math.min(STEPS.length - 1, Math.max(0, step));
    this.render(false);
  }

  _next() {
    this._readForm();
    this.state.step = Math.min(STEPS.length - 1, this.state.step + 1);
    this.render(false);
  }

  _prev() {
    this._readForm();
    this.state.step = Math.max(0, this.state.step - 1);
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
    const attrs = isArchetype ? clone(arquetipo.attrs) : clone(this.state.atributos);
    const skills = isArchetype ? archetypeSkills(arquetipo) : clone(this.state.habilidades);
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
    if (this.state.mode === "libre") {
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

  async _apply() {
    this._readForm();
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
