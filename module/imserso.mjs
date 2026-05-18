import { IMSERSO } from "./config.mjs";
import { ARQUETIPOS, ARQUETIPO_ITEMS } from "./arquetipos-data.mjs";
import { buildAchaquesTables, buildReglasJournals, getAchaque } from "./reglas-data.mjs";
import { ImsersoActor } from "./actor.mjs";
import { ImsersoItem } from "./item.mjs";
import { ImsersoActorSheet, ImsersoItemSheet } from "./sheets.mjs";
import { openCharacterCreator } from "./character-creator.mjs";

Hooks.once("init", async () => {
  console.log("IMSERSO to the limit | Inicializando YayoSystem");

  game.imserso = {
    config: IMSERSO,
    arquetipos: ARQUETIPOS,
    rollSkill: (actorId, skill) => game.actors.get(actorId)?.rollSkill(skill),
    rollJamacuco: (actorId) => game.actors.get(actorId)?.rollJamacuco(),
    openCharacterCreator,
    rollAchaques,
    rollMiedo
  };

  CONFIG.IMSERSO = IMSERSO;
  CONFIG.Actor.documentClass = ImsersoActor;
  CONFIG.Item.documentClass = ImsersoItem;

  const ActorsCls = foundry.documents.collections.Actors ?? globalThis.Actors;
  const ItemsCls = foundry.documents.collections.Items ?? globalThis.Items;
  const { ActorSheet, ItemSheet } = foundry.appv1.sheets;

  ActorsCls.unregisterSheet("core", ActorSheet);
  ActorsCls.registerSheet(IMSERSO.ID, ImsersoActorSheet, {
    types: ["jubilado", "extra"],
    makeDefault: true,
    label: "IMSERSO.HojaJubilado"
  });

  ItemsCls.unregisterSheet("core", ItemSheet);
  ItemsCls.registerSheet(IMSERSO.ID, ImsersoItemSheet, {
    makeDefault: true,
    label: "IMSERSO.HojaItem"
  });

  Handlebars.registerHelper("imsChecked", (value) => value ? "checked" : "");
  Handlebars.registerHelper("imsSelected", (a, b) => String(a) === String(b) ? "selected" : "");
  Handlebars.registerHelper("imsAttr", (key) => IMSERSO.atributos[key]?.short ?? key);
  Handlebars.registerHelper("imsSkill", (key) => IMSERSO.habilidades[key]?.label ?? key);
  Handlebars.registerHelper("eq", (a, b) => a === b);
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  await repairCoreSheetFlags();
  let seeded = 0;
  await cleanupLegacyArchetypeActorPack();
  const arquetiposResult = await seedPack({ name: "arquetipos-objetos", label: "Arquetipos de jubilado", documentName: "Item", data: ARQUETIPO_ITEMS });
  seeded += arquetiposResult.changes;

  const reglasResult = await seedPack({ name: "reglas-diarios", label: "Reglas y ayudas", documentName: "JournalEntry", data: buildReglasJournals() });
  seeded += reglasResult.changes;
  const achaquesResult = await seedPack({ name: "achaques", label: "Tabla de achaques", documentName: "RollTable", data: buildAchaquesTables() });
  seeded += achaquesResult.changes;
  seeded += await ensureCoreMacros();

  if (!game.user.getFlag(IMSERSO.ID, "welcomeShown")) {
    await ChatMessage.create({
      speaker: { alias: "IMSERSO to the limit" },
      content: `
        <div class="ims-chat-card">
          <h2>IMSERSO to the limit listo</h2>
          <p>Se han preparado las reglas del sistema, las hojas de personaje, arquetipos, tiradas de habilidad, Jamacuco, Salud, Yayopoints e iniciativa.</p>
          <p>El contenido de aventuras, personajes concretos, escenas y objetos se instala desde sus módulos.</p>
        </div>`
    });
    await game.user.setFlag(IMSERSO.ID, "welcomeShown", true);
  }
  if (seeded > 0) ui.notifications?.info(`IMSERSO to the limit: ${seeded} entradas preparadas en compendios.`);
});

Hooks.on("renderChatMessage", (message, html) => {
  if (html.find(".ims-chat-card").length) html.addClass("ims-chat-message");
  html.find("[data-ims-action]").on("click", (event) => handleChatAction(event, message));
});

Hooks.on("renderJournalSheet", (_sheet, html) => {
  html.find("[data-ims-action]").on("click", (event) => handleLooseAction(event));
});

Hooks.on("renderJournalPageSheet", (_sheet, html) => {
  html.find("[data-ims-action]").on("click", (event) => handleLooseAction(event));
});

Hooks.on("renderDialog", (_dialog, html) => {
  html.find(".ims-stepper [data-ims-step]").on("click", (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const stepper = button.closest(".ims-stepper");
    const input = stepper?.querySelector("input");
    if (!input) return;
    const direction = Number(button.dataset.imsStep) || 0;
    const step = Number(stepper.dataset.step) || Number(input.step) || 1;
    const min = Number(stepper.dataset.min ?? input.min ?? -Infinity);
    const max = Number(stepper.dataset.max ?? input.max ?? Infinity);
    const current = Number(input.value) || 0;
    input.value = Math.min(max, Math.max(min, current + (direction * step)));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

Hooks.on("renderActorDirectory", (_app, html) => {
  if (!game.user.isGM) return;
  if (html.find("[data-ims-create-jubilado]").length) return;
  const button = $(`<button type="button" data-ims-create-jubilado><i class="fas fa-person-cane"></i> Creador IMSERSO</button>`);
  button.on("click", () => openCharacterCreator());
  const createButton = html.find('[data-action="createEntry"], [data-action="createDocument"], .create-document, .create-entity').first();
  if (createButton.length) createButton.after(button);
  else {
    const footer = html.find(".directory-footer");
    if (footer.length) footer.prepend(button);
    else html.find(".directory-header").append(button);
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canUseActor(actor) {
  return game.user.isGM || actor?.isOwner;
}

function stepper(name, value, { min = 0, max = 99, step = 1 } = {}) {
  return `
    <div class="ims-stepper" data-min="${min}" data-max="${max}" data-step="${step}">
      <button type="button" data-ims-step="-1"><i class="fas fa-minus"></i></button>
      <input type="number" name="${name}" value="${value}" min="${min}" max="${max}" step="${step}" readonly>
      <button type="button" data-ims-step="1"><i class="fas fa-plus"></i></button>
    </div>`;
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

function hasEquippedAutomation(actor, key) {
  return actor?.items?.some((item) => item.system?.equipado && automationKey(item) === key);
}

function renderDamageCard(data) {
  const status = data.applied ? "Daño aplicado" : data.defended ? "Defensa conseguida" : data.cancelled ? "Cancelado" : "Impacto pendiente";
  const buttons = data.applied || data.defended || data.cancelled ? "" : `
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

async function handleChatAction(event, message) {
  event.preventDefault();
  const action = event.currentTarget.dataset.imsAction;
  if (action === "roll-achaques") return rollAchaques();
  if (action === "reroll-yayo") return rerollWithYayo(message);
  if (["apply-damage", "active-defense", "cancel-damage"].includes(action)) return handleDamageWorkflow(action, message);
  if (action === "apply-hazard-damage") return handleHazardWorkflow(message);
  if (action === "apply-fear-damage") return handleFearWorkflow(message);
  if (action === "apply-healing") return handleHealingWorkflow(message);
  if (action === "roll-jamacuco-threshold") return handleJamacucoThreshold(event, message);
}

async function handleLooseAction(event) {
  event.preventDefault();
  const action = event.currentTarget.dataset.imsAction;
  if (action === "roll-achaques") return rollAchaques();
}

async function rollAchaques() {
  const minorRoll = await new Roll("1d100").evaluate({ async: true });
  let majorRoll = await new Roll("1d100").evaluate({ async: true });
  if (majorRoll.total === minorRoll.total) majorRoll = await new Roll("1d100").evaluate({ async: true });
  const indexes = { menor: minorRoll.total, mayor: majorRoll.total };
  const menor = getAchaque(indexes.menor);
  const mayor = getAchaque(indexes.mayor);
  const content = `
    <div class="ims-chat-card ims-achaques-card">
      <header><h3>Achaques aleatorios</h3><strong>1d100 + 1d100</strong></header>
      <div class="ims-achaque-result minor">
        <span>Achaque menor</span>
        <b>${indexes.menor}</b>
        <p>${escapeHtml(menor)}</p>
      </div>
      <div class="ims-achaque-result major">
        <span>Achaque mayor</span>
        <b>${indexes.mayor}</b>
        <p>${escapeHtml(mayor)}</p>
      </div>
    </div>`;
  return ChatMessage.create({
    speaker: { alias: "IMSERSO to the limit" },
    rolls: [minorRoll, majorRoll],
    content
  });
}

async function rollMiedo() {
  if (!game.user.isGM) return ui.notifications.warn("Solo el GM puede lanzar miedo del Sr. Ministro.");
  const targets = Array.from(game.user.targets ?? []).map((token) => token.actor).filter(Boolean);
  if (!targets.length) return ui.notifications.warn("Tarjetea uno o varios jubilados antes de lanzar miedo.");
  const data = await Dialog.prompt({
    title: "Miedo del Sr. Ministro",
    content: `
      <form class="ims-dialog">
        <p>Se tiran dados contra los Bemoles de cada objetivo. Si iguala o supera, pierde Salud igual al numero de dados.</p>
        <label>Dados de miedo${stepper("dice", 1, { min: 1, max: 5 })}</label>
      </form>`,
    label: "Lanzar miedo",
    callback: (html) => {
      const form = html[0]?.querySelector("form") ?? html[0];
      return { dice: Number(new FormData(form).get("dice") ?? 1) };
    },
    rejectClose: false
  });
  if (!data) return null;
  const dice = Math.max(1, Math.min(5, Number(data.dice) || 1));
  for (const target of targets) {
    const bemoles = Number(target.system.bemoles?.valor ?? target.system.bemoles) || 8;
    const roll = await new Roll(`${dice}d6`).evaluate({ async: true });
    const success = roll.total >= bemoles;
    const workflow = {
      targetUuid: target.uuid,
      targetName: target.name,
      dice,
      bemoles,
      total: roll.total,
      damage: success ? dice : 0,
      failed: !success,
      applied: false
    };
    await ChatMessage.create({
      speaker: { alias: "Sr. Ministro" },
      rolls: [roll],
      flags: { [IMSERSO.ID]: { fearWorkflow: workflow } },
      content: renderFearCard(workflow)
    });
  }
}

function renderFearCard(data) {
  const status = data.failed ? "Resistido" : data.applied ? "Daño aplicado" : "Miedo pendiente";
  const buttons = data.failed || data.applied ? "" : `
    <div class="ims-chat-actions">
      <button type="button" class="ims-chat-action" data-ims-action="apply-fear-damage">Aplicar daño de miedo</button>
    </div>`;
  return `
    <div class="ims-chat-card ims-damage-card">
      <header><h3>Miedo del Sr. Ministro</h3><strong>${status}</strong></header>
      <p><strong>${escapeHtml(data.targetName)}</strong>: ${data.dice}D6 = <strong>${data.total}</strong> contra Bemoles ${data.bemoles}.</p>
      ${data.failed ? "<p>Resiste el miedo: no pierde Salud.</p>" : `<p>Daño de miedo calculado: <strong>${data.damage}</strong> Salud.</p>`}
      ${buttons}
    </div>`;
}

function renderHazardCard(data) {
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
      ${data.applied ? `<p>${escapeHtml(data.targetName)} recibe ${data.damage} de daño.</p>` : ""}
      ${buttons}
    </div>`;
}

async function rerollWithYayo(message) {
  const data = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "rollData") ?? {});
  if (!data?.canReroll || data.rerolled) return ui.notifications.warn("Esta tirada ya no se puede repetir con yayopoint.");
  const actor = await fromUuid(data.actorUuid);
  if (!canUseActor(actor)) return ui.notifications.warn("No tienes permisos sobre este personaje.");
  if ((actor.system.yayopoints?.valor ?? 0) < 1) return ui.notifications.warn(`${actor.name} no tiene yayopoints suficientes.`);
  const faces = Array.isArray(data.diceFaces) ? data.diceFaces.map(Number).filter(Number.isFinite) : [];
  if (!faces.length) return ui.notifications.warn("Esta tirada no conserva el detalle de dados necesario para elegir repetición.");
  const selected = await chooseRerollDice(data, faces);
  if (!selected?.length) return;
  await actor.spendYayopoints(1);
  const keptFaces = faces.filter((_, index) => !selected.includes(index));
  const reroll = await new Roll(`${selected.length}d6`).evaluate({ async: true });
  await showRollOnCanvas(reroll);
  const rerolledFaces = reroll.dice.flatMap((die) => die.results).map((r) => r.result);
  const finalFaces = mergeRerollFaces(faces, selected, rerolledFaces);
  const result = evaluateYayoFaces(data, finalFaces);
  const rerollContent = await renderSelectedReroll(actor, data, result, { keptFaces, rerolledFaces, finalFaces, reroll });
  data.rerolled = true;
  data.canReroll = false;
  data.selectedRerollDice = selected;
  await message.setFlag(IMSERSO.ID, "rollData", data);
  const workflow = result.exito && data.attackContext
    ? await buildAttackWorkflowFromReroll(actor, data.attackContext, result)
    : null;
  if (workflow) {
    await message.setFlag(IMSERSO.ID, "attackWorkflow", workflow);
    return message.update({ content: `${rerollContent}${renderDamageCard(workflow)}` });
  }
  return message.update({ content: rerollContent });
}

async function showRollOnCanvas(roll) {
  if (!roll || !game.dice3d?.showForRoll) return;
  try {
    await game.dice3d.showForRoll(roll, game.user, true, null, false);
  } catch (err) {
    console.warn("IMSERSO to the limit | No se pudo mostrar la repetición de dados en pantalla.", err);
  }
}

async function chooseRerollDice(data, faces) {
  const checks = faces.map((face, index) => `
    <label class="ims-die-choice">
      <input type="checkbox" name="die" value="${index}" ${face < 5 ? "checked" : ""}>
      <b aria-label="Resultado ${face}">${face}</b>
    </label>`).join("");
  return Dialog.prompt({
    title: `Repetir con yayopoint: ${escapeHtml(data.label)}`,
    content: `
      <form class="ims-dialog ims-reroll-dialog">
        <p>Marca los dados que quieres repetir. Los no marcados se quedan tal cual.</p>
        <div class="ims-die-choice-grid">${checks}</div>
      </form>`,
    label: "Gastar y repetir",
    callback: (html) => {
      const form = html[0]?.querySelector("form") ?? html[0];
      return Array.from(form.querySelectorAll("input[name='die']:checked")).map((input) => Number(input.value));
    },
    rejectClose: false
  });
}

function mergeRerollFaces(originalFaces, selected, rerolledFaces) {
  const selectedSet = new Set(selected);
  let rerollIndex = 0;
  return originalFaces.map((face, index) => selectedSet.has(index) ? rerolledFaces[rerollIndex++] : face);
}

function evaluateYayoFaces(data, finalFaces) {
  const atributo = Number(data.atributo) || 0;
  const bonus = Number(data.bonus) || 0;
  const dificultad = Number(data.dificultad) || 8;
  const diceTotal = finalFaces.reduce((total, face) => total + face, 0);
  const total = diceTotal + atributo + bonus;
  const sixes = finalFaces.filter((face) => face === 6).length;
  const pifia = finalFaces.length > 0 && finalFaces.every((face) => face === 1);
  const critico = data.tipo !== "iniciativa" && sixes >= 2;
  const exitoBase = total >= dificultad;
  const exito = critico || (!pifia && exitoBase);
  return {
    total,
    sixes,
    critico,
    pifia,
    exito,
    cssClass: critico ? "critico" : pifia ? "pifia" : exito ? "exito" : "fallo",
    title: critico ? "Éxito crítico" : pifia ? "Pifia" : exito ? "Éxito" : "Fallo"
  };
}

async function renderSelectedReroll(actor, data, result, details) {
  const formula = `${details.keptFaces.length} dados guardados + ${details.rerolledFaces.length}d6 + ${Number(data.atributo) || 0} + ${Number(data.bonus) || 0}`;
  return renderTemplate(`systems/${IMSERSO.ID}/templates/chat/roll-card.hbs`, {
    actor,
    label: `${data.label} · repetición con yayopoint`,
    roll: details.reroll,
    dice: details.finalFaces.length,
    atributo: data.atributo,
    bonus: data.bonus,
    dificultad: data.dificultad,
    flavor: `${data.flavor} · eliges dados guardados`,
    tipo: data.tipo,
    total: result.total,
    sixes: result.sixes,
    critico: result.critico,
    pifia: result.pifia,
    exito: result.exito,
    canReroll: false,
    cssClass: result.cssClass,
    title: result.title,
    diceFaces: details.finalFaces,
    keptFaces: details.keptFaces,
    rerolledFaces: details.rerolledFaces,
    rerollBreakdown: true,
    formula,
    tooltip: await details.reroll.getTooltip()
  });
}

async function buildAttackWorkflowFromReroll(actor, context, result) {
  const target = await resolveWorkflowTarget(context);
  if (!target) {
    ui.notifications.warn("La repetición impacta, pero no encuentro el objetivo para preparar el daño.");
    return null;
  }
  const attack = context.attack ?? {};
  const attackData = context.attackData ?? {};
  const yays = Math.min(3, Math.max(0, Number(attackData.yayoDano) || 0));
  const attrKey = attack.atributo ?? "rob";
  const attrDamage = Number(actor.system.efectivos?.atributos?.[attrKey] ?? actor.system.atributos?.[attrKey]) || 0;
  const aimedDice = (Number(attackData.dadosSacrificados) || 0) * (attack.apuntar === "2d6" ? 2 : 1);
  const extraDice = yays + aimedDice;
  const extraRoll = extraDice > 0 ? await new Roll(`${extraDice}d6`).evaluate({ async: true }) : null;
  const subtotal = (Number(attack.dano) || 0) + attrDamage + (extraRoll?.total ?? 0);
  const totalDamage = result.critico ? subtotal * 2 : subtotal;
  const aimed = (Number(attackData.dadosSacrificados) || 0) > 0;
  return {
    attackerUuid: actor.uuid,
    targetUuid: context.targetUuid ?? target.uuid,
    targetTokenUuid: context.targetTokenUuid ?? "",
    attackerName: actor.name,
    targetName: target.name,
    attackLabel: attack.label ?? "Ataque",
    attackSkill: attack.habilidad ?? "",
    attackTipo: attack.tipo ?? "",
    damage: totalDamage,
    originalDamage: totalDamage,
    formulaText: `${Number(attack.dano) || 0} + ${String(attrKey).toUpperCase()} ${attrDamage}${extraRoll ? ` + ${extraRoll.total}` : ""}${result.critico ? " x2 crítico" : ""}`,
    defenseDifficulty: (attack.habilidad === "petanca" ? 15 : 10) + (result.critico ? 5 : 0) + (aimed ? 5 : 0),
    applied: false,
    defended: false,
    cancelled: false,
    defenseText: "Impacto confirmado tras repetición con yayopoint."
  };
}

async function handleDamageWorkflow(action, message) {
  const workflow = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "attackWorkflow") ?? {});
  if (!workflow?.targetUuid && !workflow?.targetTokenUuid) return ui.notifications.warn("Este ataque no tiene objetivo asociado.");
  const target = await resolveWorkflowTarget(workflow);
  if (!target) return ui.notifications.warn("No encuentro el objetivo del ataque.");
  if (!canUseActor(target)) return ui.notifications.warn("Solo quien controla el objetivo o el GM puede confirmar este paso.");

  if (action === "cancel-damage") {
    workflow.cancelled = true;
    await message.setFlag(IMSERSO.ID, "attackWorkflow", workflow);
    return message.update({ content: renderDamageCard(workflow) });
  }

  if (action === "apply-damage") {
    if (hasEquippedAutomation(target, "traje-superman") && ["petanca"].includes(workflow.attackSkill)) {
      workflow.applied = true;
      workflow.damage = 0;
      workflow.defenseText = `${target.name} lleva el Traje de Superman: las balas normales no le hacen daño.`;
      await message.setFlag(IMSERSO.ID, "attackWorkflow", workflow);
      return message.update({ content: renderDamageCard(workflow) });
    }
    await target.applyDamage(workflow.damage);
    workflow.applied = true;
    workflow.defenseText = `${target.name} recibe ${workflow.damage} de daño.`;
    await message.setFlag(IMSERSO.ID, "attackWorkflow", workflow);
    return message.update({ content: renderDamageCard(workflow) });
  }

  if (action === "active-defense") {
    const result = await target.rollSkill("gimnasia", { skipDialog: false, dificultad: workflow.defenseDifficulty });
    if (result?.exito) {
      workflow.defended = true;
      workflow.defenseText = `${target.name} se defiende activamente y evita el daño.`;
    } else if (result?.pifia) {
      workflow.damage *= 2;
      workflow.defenseText = `${target.name} pifia la defensa activa: el daño se dobla a ${workflow.damage}.`;
    } else {
      workflow.defenseText = `${target.name} falla la defensa activa. El daño queda pendiente de aplicar.`;
    }
    await message.setFlag(IMSERSO.ID, "attackWorkflow", workflow);
    return message.update({ content: renderDamageCard(workflow) });
  }
}

async function handleFearWorkflow(message) {
  const workflow = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "fearWorkflow") ?? {});
  if (!workflow?.targetUuid) return ui.notifications.warn("Este miedo no tiene objetivo asociado.");
  const target = await fromUuid(workflow.targetUuid).catch(() => null);
  if (!target) return ui.notifications.warn("No encuentro el objetivo del miedo.");
  if (!canUseActor(target)) return ui.notifications.warn("Solo quien controla el objetivo o el GM puede aplicar este daño.");
  if (workflow.failed || workflow.applied) return ui.notifications.warn("Este miedo ya esta resuelto.");
  await target.applyDamage(workflow.damage);
  workflow.applied = true;
  await message.setFlag(IMSERSO.ID, "fearWorkflow", workflow);
  return message.update({ content: renderFearCard(workflow) });
}

async function handleHazardWorkflow(message) {
  const workflow = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "hazardWorkflow") ?? {});
  if (!workflow?.targetUuid) return ui.notifications.warn("Este daño reglado no tiene objetivo asociado.");
  const target = await fromUuid(workflow.targetUuid).catch(() => null);
  if (!target) return ui.notifications.warn("No encuentro el objetivo del daño reglado.");
  if (!canUseActor(target)) return ui.notifications.warn("Solo quien controla el objetivo o el GM puede aplicar este daño.");
  if (workflow.applied) return ui.notifications.warn("Este daño reglado ya esta aplicado.");
  await target.applyDamage(workflow.damage);
  workflow.applied = true;
  await message.setFlag(IMSERSO.ID, "hazardWorkflow", workflow);
  return message.update({ content: renderHazardCard(workflow) });
}

function renderHealingCard(data) {
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
      ${data.applied ? `<p>${escapeHtml(data.targetName)} recupera ${data.amount} de Salud.</p>` : ""}
      ${buttons}
    </div>`;
}

async function handleHealingWorkflow(message) {
  const workflow = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "healingWorkflow") ?? {});
  if (!workflow?.targetUuid) return ui.notifications.warn("Esta curacion no tiene objetivo asociado.");
  const target = await resolveWorkflowTarget(workflow);
  if (!target) return ui.notifications.warn("No encuentro el objetivo de la curacion.");
  if (!canUseActor(target)) return ui.notifications.warn("Solo quien controla el objetivo o el GM puede aplicar esta curacion.");
  if (workflow.failed || workflow.applied) return ui.notifications.warn("Esta curacion ya esta resuelta.");
  await target.heal(workflow.amount);
  workflow.applied = true;
  await message.setFlag(IMSERSO.ID, "healingWorkflow", workflow);
  return message.update({ content: renderHealingCard(workflow) });
}

function renderJamacucoWorkflow(workflow) {
  const buttons = workflow.thresholds.map((threshold) => {
    const done = workflow.rolled.includes(Number(threshold));
    if (workflow.failed && !done) return `<span class="ims-badge">Pendiente cancelado</span>`;
    return done
      ? `<span class="ims-badge">Umbral ${threshold} resuelto</span>`
      : `<button type="button" class="ims-chat-action" data-ims-action="roll-jamacuco-threshold" data-threshold="${threshold}">Tirar umbral ${threshold}</button>`;
  }).join("");
  return `
    <div class="ims-chat-card ims-jamacuco-card">
      <header><h3>Umbrales de Jamacuco</h3><strong>${escapeHtml(workflow.actorName)}</strong></header>
      <p>Cruza por primera vez: <strong>${workflow.thresholds.join(", ")}</strong>. Hay que resolver una tirada de Jamacuco por cada umbral.</p>
      ${workflow.failed ? `<p><strong>Fallado en umbral ${workflow.failed}:</strong> el personaje sufre las consecuencias.</p>` : ""}
      <div class="ims-chat-actions">${buttons}</div>
    </div>`;
}

async function handleJamacucoThreshold(event, message) {
  const threshold = Number(event.currentTarget.dataset.threshold);
  const workflow = foundry.utils.deepClone(message.getFlag(IMSERSO.ID, "jamacucoWorkflow") ?? {});
  if (!workflow?.actorUuid || !threshold) return ui.notifications.warn("Este aviso de Jamacuco no tiene datos suficientes.");
  if (workflow.rolled?.includes(threshold)) return ui.notifications.warn("Ese umbral ya se ha resuelto.");
  const actor = await fromUuid(workflow.actorUuid).catch(() => null);
  if (!actor) return ui.notifications.warn("No encuentro al personaje para tirar Jamacuco.");
  if (!canUseActor(actor)) return ui.notifications.warn("Solo quien controla el personaje o el GM puede tirar este Jamacuco.");
  const result = await actor.rollJamacuco({ skipDialog: true, reason: `umbral ${threshold}` });
  workflow.rolled = [...(workflow.rolled ?? []), threshold];
  if (result && !result.exito) workflow.failed = threshold;
  await message.setFlag(IMSERSO.ID, "jamacucoWorkflow", workflow);
  return message.update({ content: renderJamacucoWorkflow(workflow) });
}

async function resolveWorkflowTarget(workflow) {
  if (workflow.targetTokenUuid) {
    const tokenDocument = await fromUuid(workflow.targetTokenUuid).catch(() => null);
    if (tokenDocument?.actor) return tokenDocument.actor;
  }
  return fromUuid(workflow.targetUuid).catch(() => null);
}

function sanitizeSeedData(data) {
  if (Array.isArray(data)) return data.map((entry) => sanitizeSeedData(entry));
  if (!data || typeof data !== "object") return data;
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (["_id", "_stats", "sort"].includes(key)) continue;
    out[key] = sanitizeSeedData(value);
  }
  return out;
}

function seedHash(seed) {
  const text = JSON.stringify(sanitizeSeedData(seed));
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}

function withSeedFlag(seed) {
  const data = foundry.utils.deepClone(seed);
  data.flags = foundry.utils.mergeObject(data.flags ?? {}, {
    [IMSERSO.ID]: { seeded: true, seedHash: seedHash(seed) }
  }, { inplace: false });
  return data;
}

async function ensureWorldPack({ name, label, documentName }) {
  const worldName = `imserso-${name}`;
  const collection = `world.${worldName}`;
  let pack = game.packs.get(collection);
  if (!pack) {
    await foundry.documents.collections.CompendiumCollection.createCompendium({
      type: documentName,
      label: `IMSERSO · ${label}`,
      name: worldName,
      package: "world"
    });
    pack = game.packs.get(collection);
  }
  return pack;
}

async function createPackDocument(pack, documentName, seed) {
  const data = withSeedFlag(seed);
  const options = { pack: pack.collection };
  if (documentName === "Actor") return Actor.create(data, options);
  if (documentName === "Item") return Item.create(data, options);
  if (documentName === "JournalEntry") return JournalEntry.create(data, options);
  if (documentName === "Scene") return Scene.create(data, options);
  if (documentName === "RollTable") return RollTable.create(data, options);
  return null;
}

async function ensureCoreMacros() {
  if (!game.macros || !globalThis.Macro) return 0;
  const folder = await ensureMacroFolder("IMSERSO to the limit");
  const macroSeeds = [
    {
      key: "roll-achaques",
      name: "IMSERSO · Tirar achaques",
      type: "script",
      img: "icons/svg/d20-grey.svg",
      command: "game.imserso.rollAchaques();"
    }
  ];
  let changes = 0;
  for (const seed of macroSeeds) {
    const flags = { [IMSERSO.ID]: { coreMacro: seed.key, seedHash: seedHash(seed) } };
    const existing = game.macros.find((macro) => macro.getFlag?.(IMSERSO.ID, "coreMacro") === seed.key)
      ?? game.macros.find((macro) => macro.name === seed.name);
    const data = {
      name: seed.name,
      type: seed.type,
      img: seed.img,
      command: seed.command,
      folder: folder?.id,
      flags
    };
    if (existing) {
      if (existing.getFlag?.(IMSERSO.ID, "seedHash") === flags[IMSERSO.ID].seedHash && existing.folder?.id === folder?.id) continue;
      await existing.update(data);
    } else {
      await Macro.create(data);
    }
    changes += 1;
  }
  return changes;
}

async function ensureMacroFolder(name) {
  const found = game.folders.find((folder) => folder.type === "Macro" && folder.name === name);
  if (found) return found;
  return Folder.create({ name, type: "Macro" });
}

async function upsertPack(pack, documentName, data) {
  const existing = new Map((await pack.getDocuments()).map((doc) => [doc.name, doc]));
  let changes = 0;
  for (const seed of data) {
    const current = existing.get(seed.name);
    const hash = seedHash(seed);
    if (current?.getFlag?.(IMSERSO.ID, "seedHash") === hash) continue;
    if (current?.getFlag?.(IMSERSO.ID, "seeded")) await current.delete();
    await createPackDocument(pack, documentName, seed);
    changes += 1;
  }
  return changes;
}

async function seedPack(definition) {
  const systemPack = game.packs.get(`${IMSERSO.ID}.${definition.name}`);
  if (systemPack) {
    try {
      await systemPack.configure({ locked: false });
      const changes = await upsertPack(systemPack, definition.documentName, definition.data);
      await systemPack.configure({ locked: true });
      return { changes, pack: systemPack };
    } catch (err) {
      console.warn(`IMSERSO | No se pudo sembrar el compendio de sistema ${definition.name}; usando compendio del mundo.`, err);
    }
  }

  const worldPack = await ensureWorldPack(definition);
  const changes = await upsertPack(worldPack, definition.documentName, definition.data);
  return { changes, pack: worldPack };
}

async function cleanupLegacyArchetypeActorPack() {
  const pack = game.packs.get("world.imserso-arquetipos");
  if (!pack || pack.documentName !== "Actor") return;
  const docs = await pack.getDocuments();
  const seeded = docs.filter((doc) => doc.getFlag?.(IMSERSO.ID, "seeded"));
  for (const doc of seeded) await doc.delete();
  if (seeded.length) console.log(`IMSERSO | Eliminados ${seeded.length} arquetipos antiguos creados como actores.`);
}

async function repairCoreSheetFlags() {
  const actorUpdates = game.actors.contents
    .filter((actor) => ["jubilado", "extra"].includes(actor.type))
    .filter((actor) => {
      const sheetClass = actor.getFlag("core", "sheetClass");
      return sheetClass === "core.ActorSheet" || sheetClass === "ActorSheet";
    })
    .map((actor) => ({ _id: actor.id, "flags.core.-=sheetClass": null }));
  if (actorUpdates.length) await Actor.updateDocuments(actorUpdates);

  const itemUpdates = game.items.contents
    .filter((item) => ["equipo", "arma", "talento", "arquetipo"].includes(item.type))
    .filter((item) => {
      const sheetClass = item.getFlag("core", "sheetClass");
      return sheetClass === "core.ItemSheet" || sheetClass === "ItemSheet";
    })
    .map((item) => ({ _id: item.id, "flags.core.-=sheetClass": null }));
  if (itemUpdates.length) await Item.updateDocuments(itemUpdates);
}
