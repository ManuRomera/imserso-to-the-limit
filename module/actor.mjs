import { IMSERSO, normalizeSkills, labelForAttribute, labelForSkill } from "./config.mjs";
import { arquetipoByKey, archetypeSystem, archetypeTalentItem } from "./arquetipos-data.mjs";
import { rollYayo, simpleDialog, rollFlavorForSkill } from "./dice.mjs";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function healthPenalty(salud) {
  const value = number(salud, 0);
  if (value < 4) return 3;
  if (value < 7) return 2;
  if (value < 11) return 1;
  return 0;
}

function calcBemoles(system) {
  return number(system.atributos?.cac, 0) + 7;
}

function calcNervio(system) {
  const gimnasia = number(system.habilidades?.gimnasia?.dados, 1);
  return (gimnasia * 3) + number(system.atributos?.pre, 0);
}

function calcJamacuco(system) {
  return 12 - number(system.atributos?.rob, 0);
}

function clampDice(value) {
  return Math.min(3, Math.max(1, number(value, 1)));
}

function automationKey(item) {
  const raw = item?.system?.automatismo || item?.system?.uso || item?.name || "";
  return String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function equippedItems(actor) {
  return actor.items?.filter((item) => item.system?.equipado) ?? [];
}

function equippedWeapon(actor) {
  return actor.items?.find((item) => item.type === "arma" && item.system?.equipado) ?? null;
}

function hasTalent(actor, talentName) {
  const normalized = String(talentName ?? "").toLowerCase();
  return String(actor.system?.datos?.talento ?? "").toLowerCase().includes(normalized)
    || actor.items?.some((item) => item.type === "talento" && String(item.name ?? "").toLowerCase() === normalized);
}

function emptyModifiers() {
  return {
    atributos: {},
    habilidadesAdd: {},
    habilidadesMin: {},
    nervioMin: 0,
    sinArmasDano: null,
    notas: []
  };
}

function addAttr(mods, key, value) {
  mods.atributos[key] = number(mods.atributos[key], 0) + value;
}

function addSkill(mods, key, value) {
  mods.habilidadesAdd[key] = number(mods.habilidadesAdd[key], 0) + value;
}

function minSkill(mods, key, value) {
  mods.habilidadesMin[key] = Math.max(number(mods.habilidadesMin[key], 0), value);
}

function modifiersForItem(item) {
  const mods = emptyModifiers();
  switch (automationKey(item)) {
    case "traje-superman":
      addAttr(mods, "pre", 2);
      addAttr(mods, "rob", 4);
      ["gimnasia", "lentesProgresivas", "mulaParda", "silbido", "sonotone", "tollinas"].forEach((skill) => minSkill(mods, skill, 3));
      mods.sinArmasDano = 4;
      mods.notas.push("Traje de Superman");
      break;
    case "traje-batman":
      addAttr(mods, "cac", 4);
      addAttr(mods, "gra", 2);
      addAttr(mods, "rob", 2);
      ["gimnasia", "petanca"].forEach((skill) => minSkill(mods, skill, 3));
      ["archiperres", "internes", "memoria", "tollinas"].forEach((skill) => addSkill(mods, skill, 1));
      mods.notas.push("Traje de Batman");
      break;
    case "traje-flash":
      addAttr(mods, "cac", 2);
      addAttr(mods, "pre", 2);
      addAttr(mods, "rob", 2);
      minSkill(mods, "gimnasia", 3);
      addSkill(mods, "tollinas", 1);
      mods.notas.push("Traje de Flash");
      break;
    case "traje-wonder-woman":
      addAttr(mods, "cac", 2);
      addAttr(mods, "gra", 2);
      addAttr(mods, "rob", 2);
      minSkill(mods, "gimnasia", 3);
      addSkill(mods, "petanca", 1);
      minSkill(mods, "tollinas", 3);
      mods.notas.push("Traje de Wonder Woman");
      break;
    case "traje-cyborg":
      addAttr(mods, "rob", 2);
      addAttr(mods, "pre", 2);
      addSkill(mods, "gimnasia", 1);
      ["lentesProgresivas", "petanca", "tollinas"].forEach((skill) => minSkill(mods, skill, 3));
      mods.notas.push("Traje de Cyborg");
      break;
    case "visor-de-cyborg":
    case "punteria":
      ["lentesProgresivas", "petanca"].forEach((skill) => minSkill(mods, skill, 3));
      mods.notas.push("Visor de Cyborg");
      break;
    case "brazaletes-de-wonder-woman":
    case "defensa":
      mods.nervioMin = 21;
      mods.notas.push("Brazaletes de Wonder Woman");
      break;
  }
  return mods;
}

function mergeModifiers(actor) {
  const merged = emptyModifiers();
  for (const item of equippedItems(actor)) {
    const mods = modifiersForItem(item);
    for (const [key, value] of Object.entries(mods.atributos)) addAttr(merged, key, value);
    for (const [key, value] of Object.entries(mods.habilidadesAdd)) addSkill(merged, key, value);
    for (const [key, value] of Object.entries(mods.habilidadesMin)) minSkill(merged, key, value);
    merged.nervioMin = Math.max(merged.nervioMin, mods.nervioMin);
    if (mods.sinArmasDano !== null) merged.sinArmasDano = Math.max(number(merged.sinArmasDano, 0), mods.sinArmasDano);
    merged.notas.push(...mods.notas);
  }
  return merged;
}

function effectiveSystem(actor) {
  const base = actor.system;
  const mods = mergeModifiers(actor);
  const atributos = foundry.utils.deepClone(base.atributos ?? {});
  for (const [key, value] of Object.entries(mods.atributos)) atributos[key] = number(atributos[key], 0) + value;
  const habilidades = foundry.utils.deepClone(base.habilidades ?? {});
  for (const key of Object.keys(IMSERSO.habilidades)) {
    const current = clampDice(habilidades[key]?.dados ?? 1);
    const added = current + number(mods.habilidadesAdd[key], 0);
    habilidades[key] = { dados: Math.max(clampDice(added), number(mods.habilidadesMin[key], 0)) };
    habilidades[key].dados = clampDice(habilidades[key].dados);
  }
  return { atributos, habilidades, mods };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function firstTargetToken() {
  return game.user.targets.first() ?? null;
}

function stepper(name, value, { min = 0, max = 99, step = 1 } = {}) {
  return `
    <div class="ims-stepper" data-min="${min}" data-max="${max}" data-step="${step}">
      <button type="button" data-ims-step="-1"><i class="fas fa-minus"></i></button>
      <input type="number" name="${name}" value="${value}" min="${min}" max="${max}" step="${step}" readonly>
      <button type="button" data-ims-step="1"><i class="fas fa-plus"></i></button>
    </div>`;
}

function actorNervio(actor) {
  if (!actor) return 8;
  const base = actor.type === "extra" ? number(actor.system.nervio?.valor, 8) : number(actor.system.nervio, 8);
  return actor.system.combate?.sorprendido ? Math.ceil(base / 2) : base;
}

function damageCard(data) {
  const status = data.applied ? "Daño aplicado" : data.defended ? "Defensa conseguida" : "Impacto pendiente";
  const buttons = data.applied || data.defended ? "" : `
    <div class="ims-chat-actions">
      <button type="button" class="ims-chat-action" data-ims-action="active-defense">Defensa activa</button>
      <button type="button" class="ims-chat-action" data-ims-action="apply-damage">Aplicar daño</button>
      <button type="button" class="ims-chat-action secondary" data-ims-action="cancel-damage">Cancelar</button>
    </div>`;
  return `
    <div class="ims-chat-card ims-damage-card">
      <header><h3>${escapeHtml(data.attackLabel)}</h3><strong>${status}</strong></header>
      <p><strong>${escapeHtml(data.attackerName)}</strong> impacta a <strong>${escapeHtml(data.targetName)}</strong>.</p>
      <p>Daño calculado: <strong>${data.damage}</strong> (${escapeHtml(data.formulaText)})</p>
      ${data.defenseText ? `<p>${escapeHtml(data.defenseText)}</p>` : `<p>Defensa activa: Gimnasia contra dificultad ${data.defenseDifficulty}.</p>`}
      ${buttons}
    </div>`;
}

function hazardCard(data) {
  const status = data.applied ? "Daño aplicado" : data.damage > 0 ? "Daño pendiente" : "Sin daño";
  const buttons = data.applied || data.damage <= 0 ? "" : `
    <div class="ims-chat-actions">
      <button type="button" class="ims-chat-action" data-ims-action="apply-hazard-damage">Aplicar daño</button>
    </div>`;
  return `
    <div class="ims-chat-card ims-damage-card">
      <header><h3>${escapeHtml(data.label)}</h3><strong>${status}</strong></header>
      <p><strong>${escapeHtml(data.targetName)}</strong>: ${escapeHtml(data.summary)}</p>
      ${data.details ? `<p>${escapeHtml(data.details)}</p>` : ""}
      ${data.damage > 0 ? `<p>Daño calculado: <strong>${data.damage}</strong> Salud.</p>` : "<p>No pierde Salud por esta resolución.</p>"}
      ${buttons}
    </div>`;
}

export class ImsersoActor extends Actor {
  prepareBaseData() {
    super.prepareBaseData();
    this.system.habilidades = normalizeSkills(this.system.habilidades);
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const sys = this.system;
    if (this.type === "jubilado") this._prepareJubilado(sys);
    if (this.type === "extra") this._prepareExtra(sys);
  }

  _prepareJubilado(sys) {
    const effective = effectiveSystem(this);
    const derived = { ...sys, atributos: effective.atributos, habilidades: effective.habilidades };
    sys.efectivos = effective;
    sys.bemoles = calcBemoles(derived);
    sys.nervio = Math.max(calcNervio(derived), number(effective.mods.nervioMin, 0));
    sys.jamacuco ??= {};
    if (!sys.jamacuco?.valor) sys.jamacuco.valor = calcJamacuco(derived);
    sys.jamacuco.efectivo = calcJamacuco(derived);
    sys.penalizadorDados = healthPenalty(sys.salud?.valor);
    sys.inconscienteAuto = number(sys.salud?.valor, 0) === 1;
    sys.muertoAuto = number(sys.salud?.valor, 0) <= 0;
  }

  _prepareExtra(sys) {
    const effective = effectiveSystem(this);
    const derived = { ...sys, atributos: effective.atributos, habilidades: effective.habilidades };
    sys.efectivos = effective;
    if (!sys.bemoles?.manual) sys.bemoles.valor = calcBemoles(derived);
    if (!sys.nervio?.manual) sys.nervio.valor = Math.max(calcNervio(derived), number(effective.mods.nervioMin, 0));
  }

  async applyArchetype(key, itemSystem = null) {
    if (this.type !== "jubilado") {
      ui.notifications.warn("Los arquetipos solo se aplican a fichas de jubilado.");
      return null;
    }
    const baseArquetipo = arquetipoByKey(key);
    const arquetipo = this._archetypeFromItemSystem(baseArquetipo, itemSystem, key);
    if (!arquetipo) {
      ui.notifications.warn("Selecciona un arquetipo valido antes de aplicarlo.");
      return null;
    }
    const confirmed = await Dialog.confirm({
      title: `Aplicar arquetipo: ${arquetipo.name}`,
      content: `
        <form class="ims-dialog">
          <p>Esto ajustara atributos, habilidades, partido, talento, Yayopoints, Salud y Jamacuco segun el arquetipo.</p>
          <p>No cambia el nombre del PJ, jugador, fotografia ni biografia.</p>
        </form>`,
      yes: "Aplicar arquetipo",
      no: "Cancelar",
      defaultYes: false
    });
    if (!confirmed) return null;

    const healthRoll = await new Roll("1d6").evaluate({ async: true });
    await this.update(archetypeSystem(arquetipo, healthRoll.total));
    const existingTalent = this.items.find((item) => item.type === "talento" && item.name === arquetipo.talentName);
    if (!existingTalent) await this.createEmbeddedDocuments("Item", [archetypeTalentItem(arquetipo)]);
    const skills3 = arquetipo.d3.map((key) => labelForSkill(key)).join(", ");
    const skills2 = arquetipo.d2.map((key) => labelForSkill(key)).join(", ");
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [healthRoll],
      content: `
        <div class="ims-chat-card">
          <header><h3>Arquetipo aplicado</h3><strong>${escapeHtml(arquetipo.name)}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> adopta el arquetipo <strong>${escapeHtml(arquetipo.name)}</strong>.</p>
          <p>Salud inicial: ${arquetipo.saludBase} + 1d6 (${healthRoll.total}) = <strong>${arquetipo.saludBase + healthRoll.total}</strong>. Yayopoints iniciales: <strong>${arquetipo.yayos}</strong>. Jamacuco: <strong>${arquetipo.jamacuco}</strong>.</p>
          <p><strong>3D:</strong> ${escapeHtml(skills3)}.</p>
          <p><strong>2D:</strong> ${escapeHtml(skills2)}.</p>
          <p><strong>Talento:</strong> ${escapeHtml(arquetipo.talentName)}. ${escapeHtml(arquetipo.talent)}</p>
        </div>`
    });
  }

  _archetypeFromItemSystem(baseArquetipo, itemSystem, key) {
    if (!itemSystem) return baseArquetipo;
    const attrs = itemSystem.atributos && Object.keys(itemSystem.atributos).length
      ? foundry.utils.deepClone(itemSystem.atributos)
      : foundry.utils.deepClone(baseArquetipo?.attrs ?? {});
    const d3 = Array.isArray(itemSystem.habilidades3d) && itemSystem.habilidades3d.length
      ? itemSystem.habilidades3d
      : (baseArquetipo?.d3 ?? []);
    const d2 = Array.isArray(itemSystem.habilidades2d) && itemSystem.habilidades2d.length
      ? itemSystem.habilidades2d
      : (baseArquetipo?.d2 ?? []);
    if (!baseArquetipo && !Object.keys(attrs).length) return null;
    return {
      key: itemSystem.arquetipoKey || baseArquetipo?.key || key,
      name: baseArquetipo?.name || key,
      genero: itemSystem.genero || baseArquetipo?.genero || "",
      partido: itemSystem.partido || baseArquetipo?.partido || "",
      attrs,
      yayos: number(itemSystem.yayopoints, baseArquetipo?.yayos ?? 0),
      jamacuco: number(itemSystem.jamacuco, baseArquetipo?.jamacuco ?? 10),
      saludBase: number(itemSystem.saludBase, baseArquetipo?.saludBase ?? 10),
      d3,
      d2,
      talentName: itemSystem.talentoNombre || baseArquetipo?.talentName || "Talento",
      talent: itemSystem.talento || baseArquetipo?.talent || "",
      description: itemSystem.descripcion || baseArquetipo?.description || ""
    };
  }

  async rollSkill(skillKey, options = {}) {
    const skill = IMSERSO.habilidades[skillKey];
    if (!skill) return;
    const attrKey = skill.atributo;
    const attr = number(this.system.efectivos?.atributos?.[attrKey], this.system.atributos?.[attrKey]);
    const baseDice = number(this.system.efectivos?.habilidades?.[skillKey]?.dados, this.system.habilidades?.[skillKey]?.dados);
    const defaults = {
      dificultad: options.dificultad ?? 8,
      extraDados: options.extraDados ?? 0,
      bonus: options.bonus ?? 0,
      profesion: options.profesion ?? false,
      yayoDado: options.yayoDado ?? false,
      flashback: options.flashback ?? false,
      achaqueMayor: options.achaqueMayor ?? false,
      achaqueMenor: options.achaqueMenor ?? false,
      dadosSacrificados: options.dadosSacrificados ?? 0
    };
    const data = options.skipDialog ? defaults : await this._skillDialog(skillKey, defaults);
    if (!data) return;

    let bonus = number(data.bonus, 0) + (data.profesion ? 3 : 0);
    const usesYayoDado = this.type === "jubilado" && data.yayoDado;
    let extraDice = number(data.extraDados, 0) + (usesYayoDado ? 1 : 0) + (data.flashback ? 1 : 0);
    let dice = baseDice + extraDice - number(data.dadosSacrificados, 0);
    if (this.type === "jubilado") dice -= number(this.system.penalizadorDados, 0);
    if (data.achaqueMayor) dice -= 1;
    dice = Math.max(0, dice);

    if (usesYayoDado && !this.canSpendYayopoints(1)) return null;
    if (usesYayoDado) await this.spendYayopoints(1);
    if (data.flashback) await this.update({ "system.flashback.usado": true });
    if (data.achaqueMayor) await this.gainYayopoints(1);
    if (data.achaqueMenor) await this.update({ "system.achaques.menorUsado": true });

    const result = await rollYayo({
      actor: this,
      label: labelForSkill(skillKey),
      dice,
      atributo: attr,
      bonus,
      dificultad: number(data.dificultad, 8),
      flavor: rollFlavorForSkill(skillKey, attrKey),
      allowYayoReroll: !data.achaqueMayor && !data.achaqueMenor
    });

    if (result.critico && this.type === "jubilado") {
      const points = hasTalent(this, "Carpe diem") ? 2 : 1;
      await this.gainYayopoints(points, false);
    }
    return result;
  }

  async rollJamacuco(options = {}) {
    const defaults = { dificultad: this.system.jamacuco?.efectivo ?? this.system.jamacuco?.valor ?? calcJamacuco(this.system), extraDados: 0, flashback: false };
    const data = options.skipDialog ? defaults : await simpleDialog({
      title: `Jamacuco: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Hay que igualar o superar el valor de Jamacuco. Si falla, el jubilado estira la pata.</p>
          <label>Valor de Jamacuco ${stepper("dificultad", defaults.dificultad, { min: 1, max: 30 })}</label>
          <label>Dados extra ${stepper("extraDados", 0, { min: -3, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="flashback" ${this.system.flashback?.usado ? "disabled" : ""}> Es que yo a tus años... (+1D)</label>
        </form>`
    });
    if (!data) return;
    let dice = 3 + number(data.extraDados, 0) - number(this.system.penalizadorDados, 0) + (data.flashback ? 1 : 0);
    dice = Math.max(0, dice);
    const updates = {};
    if (data.flashback) updates["system.flashback.usado"] = true;
    if (!options.reason) updates["system.jamacuco.primeraTirada"] = true;
    if (Object.keys(updates).length) await this.update(updates);
    const result = await rollYayo({
      actor: this,
      label: "Jamacuco",
      dice,
      atributo: 0,
      bonus: 0,
      dificultad: number(data.dificultad, defaults.dificultad),
      flavor: options.reason ? `3D6 modificado por Salud · ${options.reason}` : "3D6 modificado por Salud",
      tipo: "jamacuco"
    });
    if (!result.exito) await this.update({ "system.estado.muerto": true });
    return result;
  }

  async rollInitiativeYayo(options = {}) {
    if (this.system.combate?.sorprendido) {
      const content = `
        <div class="ims-chat-card">
          <header><h3>Iniciativa</h3><strong>Pillado por sorpresa</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> pierde la iniciativa y no puede actuar en este primer turno. Su Nervio cuenta a la mitad hasta que deje de estar sorprendido.</p>
        </div>`;
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content });
      const combatant = game.combat?.combatants?.find((c) => c.actor?.id === this.id);
      if (combatant) await game.combat.setInitiative(combatant.id, -999);
      return null;
    }
    const weapon = equippedWeapon(this);
    const type = options.tipo ?? weapon?.system?.tipo ?? this.system.combate?.armaIniciativa ?? this.system.ataque?.tipo ?? "sinArmas";
    const baseAttack = IMSERSO.ataqueTipos[type] ?? IMSERSO.ataqueTipos.sinArmas;
    const initiative = number(weapon?.system?.iniciativa, baseAttack.iniciativa);
    const roll = await new Roll(`1d6 + ${number(this.system.efectivos?.atributos?.pre, this.system.atributos?.pre)} + ${initiative}`).evaluate({ async: true });
    const die = roll.dice[0]?.results[0]?.result ?? 0;
    const content = await renderTemplate(`systems/${IMSERSO.ID}/templates/chat/initiative-card.hbs`, {
      actor: this,
      roll,
      die,
      extraAction: die === 6,
      type: weapon?.name ?? baseAttack.label,
      total: roll.total
    });
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), rolls: [roll], content });
    const combatant = game.combat?.combatants?.find((c) => c.actor?.id === this.id);
    if (combatant) await game.combat.setInitiative(combatant.id, roll.total);
    return roll;
  }

  async rollAttack(attackOptions = {}) {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor ?? null;
    if (!target) {
      ui.notifications.warn("Tarjetea un token antes de atacar para automatizar impacto, defensa y daño.");
      return null;
    }
    const item = attackOptions.item ?? equippedWeapon(this) ?? null;
    const currentType = item?.system?.tipo ?? this.system.combate?.ataque ?? this.system.ataque?.tipo ?? "sinArmas";
    const typeOptions = Object.entries(IMSERSO.ataqueTipos).map(([key, value]) => `<option value="${key}" ${key === currentType ? "selected" : ""}>${value.label}</option>`).join("");
    const targetName = target.name;
    const targetNervio = actorNervio(target);
    const data = await simpleDialog({
      title: item ? `Ataque: ${item.name}` : `Ataque: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Objetivo tarjeteado: <strong>${escapeHtml(targetName)}</strong>.</p>
          ${item ? `<p>Objeto usado: <strong>${escapeHtml(item.name)}</strong>.</p>` : ""}
          <label>Tipo de ataque<select name="tipo">${typeOptions}</select></label>
          <label>Nervio objetivo${stepper("dificultad", targetNervio, { min: 1, max: 30 })}</label>
          <label>Dados sacrificados para apuntar${stepper("dadosSacrificados", 0, { min: 0, max: 2 })}</label>
          <label>Dados extra/al alimón${stepper("extraDados", 0, { min: -3, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="yayoDado"> Gastar 1 yayopoint para +1D a impactar</label>
          <label>Yayopoints a daño (max 3)${stepper("yayoDano", 0, { min: 0, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="profesion"> Antigua profesión relacionada (+3)</label>
        </form>`
    });
    if (!data) return;
    const yays = this.type === "jubilado" ? Math.min(3, Math.max(0, number(data.yayoDano, 0))) : 0;
    const declaredYayos = yays + (this.type === "jubilado" && data.yayoDado ? 1 : 0);
    if (declaredYayos && !this.canSpendYayopoints(declaredYayos)) return null;
    if (yays) await this.spendYayopoints(yays);
    const baseAttack = IMSERSO.ataqueTipos[data.tipo] ?? IMSERSO.ataqueTipos.sinArmas;
    const actorAttack = this.type === "extra" ? this.system.ataque : null;
    const itemSkill = IMSERSO.habilidades[item?.system?.habilidad] ? item.system.habilidad : null;
    const actorSkill = IMSERSO.habilidades[actorAttack?.habilidad] ? actorAttack.habilidad : null;
    const itemDamageAttr = IMSERSO.atributos[item?.system?.atributoDano] ? item.system.atributoDano : null;
    const baseDamageDefault = data.tipo === "sinArmas" && this.system.efectivos?.mods?.sinArmasDano != null
      ? this.system.efectivos.mods.sinArmasDano
      : baseAttack.dano;
    const attack = {
      ...baseAttack,
      label: item?.name ?? actorAttack?.nombre ?? baseAttack.label,
      tipo: data.tipo,
      habilidad: itemSkill ?? actorSkill ?? baseAttack.habilidad,
      dano: number(item?.system?.danoBase, number(actorAttack?.dano, baseDamageDefault)),
      atributo: itemDamageAttr ?? baseAttack.atributo,
      iniciativa: number(item?.system?.iniciativa, baseAttack.iniciativa)
    };
    const result = await this.rollSkill(attack.habilidad, {
      skipDialog: true,
      dificultad: number(data.dificultad, 8),
      dadosSacrificados: number(data.dadosSacrificados, 0),
      extraDados: number(data.extraDados, 0),
      yayoDado: !!data.yayoDado,
      profesion: !!data.profesion
    });
    const attackContext = {
      attackerUuid: this.uuid,
      targetUuid: target?.uuid ?? "",
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      targetName,
      attack,
      attackData: {
        dadosSacrificados: number(data.dadosSacrificados, 0),
        yayoDano: number(data.yayoDano, 0)
      }
    };
    if (result?.message) {
      const rollData = foundry.utils.deepClone(result.message.getFlag(IMSERSO.ID, "rollData") ?? {});
      rollData.attackContext = attackContext;
      await result.message.setFlag(IMSERSO.ID, "rollData", rollData);
    }
    if (!result?.exito) return result;

    const attrDamage = number(this.system.efectivos?.atributos?.[attack.atributo], this.system.atributos?.[attack.atributo]);
    const aimedDice = number(data.dadosSacrificados, 0) * (attack.apuntar === "2d6" ? 2 : 1);
    const extraFormula = `${yays + aimedDice}d6`;
    const extraRoll = (yays + aimedDice) > 0 ? await new Roll(extraFormula).evaluate({ async: true }) : null;
    const subtotal = attack.dano + attrDamage + (extraRoll?.total ?? 0);
    const totalDamage = result.critico ? subtotal * 2 : subtotal;
    const aimed = number(data.dadosSacrificados, 0) > 0;
    const defenseDifficulty = (attack.habilidad === "petanca" ? 15 : 10) + (result.critico ? 5 : 0) + (aimed ? 5 : 0);
    const workflow = {
      attackerUuid: this.uuid,
      targetUuid: target?.uuid ?? "",
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      attackerName: this.name,
      targetName,
      attackLabel: attack.label,
      attackSkill: attack.habilidad,
      attackTipo: data.tipo,
      damage: totalDamage,
      originalDamage: totalDamage,
      formulaText: `${attack.dano} + ${attack.atributo.toUpperCase()} ${attrDamage}${extraRoll ? ` + ${extraRoll.total}` : ""}${result.critico ? " x2 crítico" : ""}`,
      defenseDifficulty,
      applied: false,
      defended: false,
      defenseText: ""
    };
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: extraRoll ? [extraRoll] : [],
      flags: { [IMSERSO.ID]: { attackWorkflow: workflow } },
      content: damageCard(workflow)
    });
    return result;
  }

  async boostDefenseYayo() {
    const data = await simpleDialog({
      title: `Yayopoints defensivos: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <label>Valor a reforzar
            <select name="valor"><option value="bemoles">Bemoles</option><option value="nervio">Nervio</option></select>
          </label>
          <label>Yayopoints a gastar${stepper("puntos", 1, { min: 1, max: 10 })}</label>
        </form>`,
      yes: "Anunciar"
    });
    if (!data) return;
    const points = Math.max(1, number(data.puntos, 1));
    if (!this.canSpendYayopoints(points)) return null;
    await this.spendYayopoints(points);
    const boost = points * 3;
    const base = data.valor === "bemoles" ? number(this.system.bemoles, this.system.bemoles?.valor) : number(this.system.nervio, this.system.nervio?.valor);
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Yayopoints defensivos</h3><strong>+${boost}</strong></header>
          <p>${this.name} gasta ${points} yayopoint(s): ${data.valor} pasa de ${base} a ${base + boost} durante un turno.</p>
        </div>`
    });
  }

  async applyDamage(amount) {
    const current = number(this.system.salud?.valor, 0);
    const next = Math.max(0, current - number(amount, 0));
    const crossed = this.type === "jubilado"
      ? IMSERSO.saludUmbrales.filter((t) => current > t && next <= t && !this.system.jamacuco?.umbrales?.[t])
      : [];
    const updates = { "system.salud.valor": next };
    for (const t of crossed) updates[`system.jamacuco.umbrales.${t}`] = true;
    if (next <= 0) updates["system.estado.muerto"] = true;
    if (next === 1) updates["system.estado.inconsciente"] = true;
    await this.update(updates);
    if (crossed.length) {
      ui.notifications.warn(`${this.name} cruza umbral(es) de Jamacuco: ${crossed.join(", ")}.`);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flags: {
          [IMSERSO.ID]: {
            jamacucoWorkflow: {
              actorUuid: this.uuid,
              actorName: this.name,
              thresholds: crossed,
              rolled: []
            }
          }
        },
        content: `
          <div class="ims-chat-card ims-jamacuco-card">
            <header><h3>Umbrales de Jamacuco</h3><strong>${this.name}</strong></header>
            <p>Cruza por primera vez: <strong>${crossed.join(", ")}</strong>. Hay que resolver una tirada de Jamacuco por cada umbral.</p>
            <div class="ims-chat-actions">
              ${crossed.map((threshold) => `<button type="button" class="ims-chat-action" data-ims-action="roll-jamacuco-threshold" data-threshold="${threshold}">Tirar umbral ${threshold}</button>`).join("")}
            </div>
          </div>`
      });
    }
  }

  async heal(amount) {
    const current = number(this.system.salud?.valor, 0);
    const max = number(this.system.salud?.max, current);
    return this.update({ "system.salud.valor": Math.min(max, current + number(amount, 0)) });
  }

  async useHealingItem(item) {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor ?? this;
    const result = await this.rollSkill("ambulatorio", { dificultad: 10 });
    if (!result) return null;
    const amount = result.critico ? 4 : result.exito ? 2 : 0;
    const workflow = {
      healerUuid: this.uuid,
      targetUuid: target.uuid,
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      healerName: this.name,
      targetName: target.name,
      itemName: item.name,
      amount,
      applied: false,
      failed: !result.exito
    };
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: { [IMSERSO.ID]: { healingWorkflow: workflow } },
      content: this._renderHealingCard(workflow)
    });
    return result;
  }

  async rollRulesHealing() {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor ?? this;
    const sources = {
      hospital: { label: "Hospital", amount: 6, skill: "" },
      casa: { label: "Casa y reposo", amount: 3, skill: "" },
      mesa: { label: "Comida en mesa", amount: 2, skill: "" },
      siesta: { label: "Siesta / masaje / balneario", amount: 1, skill: "" },
      casquete: { label: "Casquete terapeutico", amount: 3, skill: "" },
      bingo: { label: "Bingo ganado", amount: 1, skill: "" },
      botiquin: { label: "Botiquin", amount: 2, critAmount: 4, skill: "ambulatorio", difficulty: 10 },
      restoran: { label: "Restoran", amount: 2, critAmount: 4, skill: "ingesta", difficulty: 10 },
      buffet: { label: "Buffet del desayuno", amount: 2, skill: "ingesta", difficulty: 8 },
      porrete: { label: "Porrete", amount: 1, skill: "" }
    };
    const options = Object.entries(sources).map(([key, source]) => `<option value="${key}">${source.label}</option>`).join("");
    const data = await simpleDialog({
      title: `Curacion reglada: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Objetivo: <strong>${escapeHtml(target.name)}</strong>.</p>
          <label>Fuente de curacion<select name="source">${options}</select></label>
          <label>Dificultad si requiere tirada${stepper("difficulty", 10, { min: 1, max: 30 })}</label>
        </form>`,
      yes: "Preparar"
    });
    if (!data) return null;
    const source = sources[data.source] ?? sources.casa;
    let amount = source.amount;
    let failed = false;
    if (source.skill) {
      const result = await this.rollSkill(source.skill, { dificultad: number(data.difficulty, source.difficulty), skipDialog: false });
      if (!result) return null;
      failed = !result.exito;
      amount = result.critico ? (source.critAmount ?? source.amount) : source.amount;
    }
    const workflow = {
      healerUuid: this.uuid,
      targetUuid: target.uuid,
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      healerName: this.name,
      targetName: target.name,
      itemName: source.label,
      amount: failed ? 0 : amount,
      applied: false,
      failed
    };
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: { [IMSERSO.ID]: { healingWorkflow: workflow } },
      content: this._renderHealingCard(workflow)
    });
  }

  async rollHazardDamage() {
    const sources = {
      asfixia: "Asfixia",
      caida: "Caida",
      congelacion: "Congelacion",
      deslomarse: "Deslomarse",
      veneno: "Veneno",
      hambre: "Hambre",
      sed: "Sed",
      cogorza: "Cogorza",
      quemadura: "Quemadura"
    };
    const options = Object.entries(sources).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");
    const data = await simpleDialog({
      title: `Otras cosas que hacen daño: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <label>Fuente de daño<select name="source">${options}</select></label>
          <label>Metros de caída${stepper("metros", 1, { min: 0, max: 50 })}</label>
          <label>Daño / gravedad / horas${stepper("amount", 1, { min: 0, max: 30 })}</label>
          <label>Potencia o dificultad${stepper("difficulty", 10, { min: 1, max: 30 })}</label>
          <label>Daño menor${stepper("minorDamage", 0, { min: 0, max: 30 })}</label>
          <label>Daño mayor${stepper("majorDamage", 3, { min: 0, max: 30 })}</label>
        </form>`,
      yes: "Resolver"
    });
    if (!data) return null;

    const source = data.source;
    let damage = 0;
    let summary = "";
    let details = "";
    let roll = null;
    if (source === "asfixia") {
      roll = await this.rollSkill("mulaParda", { dificultad: 15 });
      damage = roll?.exito ? 0 : 3;
      summary = "tras agotar ROB + 5 turnos sin respirar, tira Mula parda a dificultad 15.";
      details = roll?.exito ? "Aguanta un turno mas." : "Falla: empieza a perder 3 puntos de Salud por turno.";
    } else if (source === "caida") {
      const metros = Math.max(0, number(data.metros, 1));
      damage = metros * 3;
      roll = await this.rollSkill("gimnasia", { dificultad: 10 });
      summary = `${metros} metro(s) de caída libre: 3 Salud por metro.`;
      details = roll?.exito ? "Supera Gimnasia dificultad 10: evita romperse la cadera." : "Falla Gimnasia dificultad 10: se rompe la cadera y no puede moverse durante el resto de la partida.";
    } else if (source === "congelacion") {
      damage = Math.max(0, number(data.amount, 1));
      summary = "frío intenso: normalmente 1 Salud por minuto de tiempo de juego.";
    } else if (source === "deslomarse") {
      roll = await this.rollSkill("mulaParda", { dificultad: 15 });
      damage = roll?.exito ? 0 : 3;
      summary = "esfuerzo físico extraordinario: Mula parda dificultad 15.";
      details = roll?.exito ? "Aguanta el esfuerzo." : "Algo cruje en la espalda: 3 puntos de daño.";
    } else if (source === "veneno") {
      const difficulty = Math.max(1, number(data.difficulty, 10));
      roll = await this.rollSkill("ingesta", { dificultad: difficulty });
      damage = roll?.exito ? number(data.minorDamage, 0) : number(data.majorDamage, 3);
      summary = `veneno POT ${difficulty}: Ingesta contra la potencia.`;
      details = roll?.exito ? "Supera la tirada: sufre el daño menor." : "Falla la tirada: sufre el daño mayor.";
    } else if (source === "hambre") {
      damage = Math.floor(number(data.amount, 12) / 12) * 2;
      summary = `${number(data.amount, 12)} hora(s) sin comer: 2 Salud por cada 12 horas.`;
    } else if (source === "sed") {
      damage = Math.floor(number(data.amount, 6) / 6) * 2;
      summary = `${number(data.amount, 6)} hora(s) sin beber: 2 Salud por cada 6 horas.`;
    } else if (source === "cogorza") {
      const difficulty = Math.max(10, number(data.difficulty, 10));
      const byDifficulty = difficulty >= 20 ? 5 : difficulty >= 15 ? 3 : 1;
      roll = await this.rollSkill("ingesta", { dificultad: difficulty });
      damage = roll?.exito ? 0 : byDifficulty;
      summary = `intoxicación etílica: Ingesta dificultad ${difficulty}.`;
      details = roll?.exito ? "Aguanta la cogorza." : "Pierde Salud y sufre -1D a todas las tiradas salvo Jamacuco durante 6 horas; anótalo en estado si procede.";
    } else if (source === "quemadura") {
      damage = Math.max(0, number(data.amount, 3));
      summary = "fuego abierto suele causar 3 Salud por turno; sol sin crema causa 1 Salud cada par de horas.";
    }

    const workflow = {
      targetUuid: this.uuid,
      targetName: this.name,
      label: sources[source] ?? "Daño reglado",
      summary,
      details,
      damage,
      applied: false
    };
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: roll?.roll ? [roll.roll] : [],
      flags: { [IMSERSO.ID]: { hazardWorkflow: workflow } },
      content: hazardCard(workflow)
    });
  }

  async worsenAttribute() {
    if (this.type !== "jubilado") return ui.notifications.warn("El empeoramiento solo se aplica a jubilados.");
    const attrs = Object.entries(IMSERSO.atributos)
      .filter(([key]) => number(this.system.atributos?.[key], 0) > 0)
      .map(([key, cfg]) => `<option value="${key}">${cfg.label} (${cfg.short}) ${number(this.system.atributos?.[key], 0)} → ${number(this.system.atributos?.[key], 0) - 1}</option>`)
      .join("");
    if (!attrs) return ui.notifications.warn(`${this.name} no tiene atributos por encima de 0.`);
    const data = await simpleDialog({
      title: `Empeoramiento: ${this.name}`,
      content: `<form class="ims-dialog"><label>Atributo a rebajar<select name="attr">${attrs}</select></label></form>`,
      yes: "Empeorar"
    });
    if (!data?.attr) return null;
    const before = number(this.system.atributos?.[data.attr], 0);
    const after = Math.max(0, before - 1);
    await this.update({ [`system.atributos.${data.attr}`]: after });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Empeoramiento</h3><strong>${escapeHtml(labelForAttribute(data.attr))}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> termina la aventura con vida y rebaja ${escapeHtml(labelForAttribute(data.attr))}: ${before} → ${after}.</p>
        </div>`
    });
  }

  async rollPursuit() {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor;
    if (!target) {
      ui.notifications.warn("Tarjetea a quien marca la dificultad de la persecucion.");
      return null;
    }
    const difficulty = actorNervio(target);
    const data = await simpleDialog({
      title: `Persecucion: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Referencia: <strong>${escapeHtml(target.name)}</strong>, Nervio ${difficulty}.</p>
          <label>Habilidad
            <select name="skill">
              <option value="gimnasia">Gimnasia</option>
              <option value="archiperres">Archiperres</option>
            </select>
          </label>
          <label>Dificultad${stepper("difficulty", difficulty, { min: 1, max: 30 })}</label>
        </form>`,
      yes: "Tirar"
    });
    if (!data) return null;
    const result = await this.rollSkill(data.skill, { dificultad: number(data.difficulty, difficulty), skipDialog: false });
    if (!result) return null;
    const title = result.critico ? "Exito critico" : result.pifia ? "Pifia" : result.exito ? "Exito" : "Fallo";
    const outcome = result.critico ? "exito critico: gana una distancia adicional."
      : result.pifia ? "pifia: se produce un percance o accidente."
        : result.exito ? "exito: mejora su posicion en la persecucion."
          : "fallo: pierde posicion en la persecucion.";
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Persecucion</h3><strong>${title}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> resuelve persecucion contra <strong>${escapeHtml(target.name)}</strong>: ${outcome}</p>
        </div>`
    });
  }

  async reserveAction() {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Accion reservada</h3><strong>+2 Nervio</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> reserva la accion: suma +2 a Nervio durante este turno y gana la iniciativa a extras que entren en alcance.</p>
        </div>`
    });
  }

  _renderHealingCard(data) {
    const status = data.failed ? "Sin efecto" : data.applied ? "Curacion aplicada" : "Curacion pendiente";
    const buttons = data.failed || data.applied ? "" : `
      <div class="ims-chat-actions">
        <button type="button" class="ims-chat-action" data-ims-action="apply-healing">Aplicar curacion</button>
      </div>`;
    return `
      <div class="ims-chat-card ims-healing-card">
        <header><h3>${escapeHtml(data.itemName)}</h3><strong>${status}</strong></header>
        <p><strong>${escapeHtml(data.healerName)}</strong> prepara curacion sobre <strong>${escapeHtml(data.targetName)}</strong>.</p>
        ${data.failed ? "<p>La tirada requerida falla: no se recupera Salud.</p>" : `<p>Recuperacion calculada: <strong>${data.amount}</strong> de Salud.</p>`}
        ${buttons}
      </div>`;
  }

  canSpendYayopoints(amount = 1) {
    if (this.type !== "jubilado") return true;
    const current = number(this.system.yayopoints?.valor, 0);
    if (current >= amount) return true;
    ui.notifications.warn(`${this.name} no tiene yayopoints suficientes (${current}/${amount}).`);
    return false;
  }

  async spendYayopoints(amount = 1) {
    if (this.type !== "jubilado") return;
    const current = number(this.system.yayopoints?.valor, 0);
    if (current < amount) {
      ui.notifications.warn(`${this.name} no tiene yayopoints suficientes (${current}/${amount}).`);
      return false;
    }
    const next = Math.max(0, current - amount);
    await this.update({ "system.yayopoints.valor": next });
    return this._announceYayopoints("gasta", amount, current, next);
  }

  async gainYayopoints(amount = 1, notify = true) {
    if (this.type !== "jubilado") return;
    const current = number(this.system.yayopoints?.valor, 0);
    if (notify) ui.notifications.info(`${this.name} gana ${amount} yayopoint.`);
    const next = current + amount;
    await this.update({ "system.yayopoints.valor": next });
    return this._announceYayopoints("gana", amount, current, next);
  }

  async _announceYayopoints(verb, amount, before, after) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Yayopoints</h3><strong>${after}</strong></header>
          <p><strong>${this.name}</strong> ${verb} ${amount} yayopoint(s): ${before} → ${after}.</p>
        </div>`
    });
  }

  async _skillDialog(skillKey, defaults) {
    const skill = IMSERSO.habilidades[skillKey];
    const op = skill.oposicion ? `<option value="${skill.oposicion}">Contra ${skill.oposicion}</option>` : "";
    return simpleDialog({
      title: `Tirada: ${labelForSkill(skillKey)}`,
      content: `
        <form class="ims-dialog">
          <div class="ims-dialog-grid">
            <label>Dificultad
              ${stepper("dificultad", defaults.dificultad, { min: 1, max: 30 })}
            </label>
            <label>Dados extra, al alimón o capote recibido/prestado
              ${stepper("extraDados", 0, { min: -3, max: 3 })}
            </label>
            <label>Modificador fijo
              ${stepper("bonus", 0, { min: -20, max: 20 })}
            </label>
            <label>Dados sacrificados al apuntar
              ${stepper("dadosSacrificados", 0, { min: 0, max: 2 })}
            </label>
          </div>
          <label class="check"><input type="checkbox" name="profesion"> Antigua profesión relacionada (+3)</label>
          <label class="check"><input type="checkbox" name="yayoDado"> Gastar 1 yayopoint antes de tirar (+1D)</label>
          <label class="check"><input type="checkbox" name="flashback" ${this.system.flashback?.usado ? "disabled" : ""}> Es que yo a tus años... (+1D)</label>
          <label class="check"><input type="checkbox" name="achaqueMayor"> Achaque mayor activado (-1D, +1 yayopoint)</label>
          <label class="check"><input type="checkbox" name="achaqueMenor" ${this.system.achaques?.menorUsado ? "disabled" : ""}> Achaque menor activado (repetición normal)</label>
          <select name="oposicion" hidden><option value="">Dificultad fija</option>${op}</select>
        </form>`
    });
  }
}
