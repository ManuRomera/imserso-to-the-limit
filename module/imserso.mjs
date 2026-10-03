/**
 * IMSERSO to the limit · punto de entrada.
 * Aquí solo se registran piezas y hooks; la lógica vive en el resto de `module/`.
 */
import { DocumentSheetConfig, anadirHerramienta, diagnostico, generacion, loadTemplates } from "./compat.mjs";
import { ID, IMSERSO, RUTA } from "./config.mjs";
import { ARQUETIPOS } from "./arquetipos-data.mjs";
import { getAchaque } from "./reglas-data.mjs";
import { MODELOS_ACTOR, MODELOS_ITEM } from "./modelos.mjs";
import { ActorIMSERSO } from "./actor.mjs";
import { ItemIMSERSO } from "./item.mjs";
import { CombateIMSERSO, CombatanteIMSERSO, alCambiarAsalto, pintarTracker } from "./combate.mjs";
import { HojaJubilado, HojaExtra, HojaObjeto } from "./hojas.mjs";
import { abrirCreador } from "./creador.mjs";
import { PanelMinistro, repintarMinistro } from "./ministro.mjs";
import { escucharChat, publicar } from "./chat.mjs";
import { lanzarMiedo } from "./flujos.mjs";

Hooks.once("init", () => {
  CONFIG.IMSERSO = IMSERSO;
  CONFIG.Actor.documentClass = ActorIMSERSO;
  CONFIG.Item.documentClass = ItemIMSERSO;
  CONFIG.Combat.documentClass = CombateIMSERSO;
  CONFIG.Combatant.documentClass = CombatanteIMSERSO;
  Object.assign(CONFIG.Actor.dataModels, MODELOS_ACTOR);
  Object.assign(CONFIG.Item.dataModels, MODELOS_ITEM);
  CONFIG.Actor.trackableAttributes = {
    jubilado: { bar: ["salud"], value: ["yayopoints.valor", "jamacuco.valor"] },
    extra: { bar: ["salud"], value: [] }
  };
  // La tirada real la monta CombatanteIMSERSO (1D6 fijo + PRE + arma); la fórmula solo documenta.
  CONFIG.Combat.initiative = { formula: "1d6 + @atributos.pre", decimals: 0 };

  DocumentSheetConfig.registerSheet(Actor, ID, HojaJubilado, { types: ["jubilado"], makeDefault: true, label: "IMSERSO · Ficha de jubilado" });
  DocumentSheetConfig.registerSheet(Actor, ID, HojaExtra, { types: ["extra"], makeDefault: true, label: "IMSERSO · Ficha de extra" });
  DocumentSheetConfig.registerSheet(Item, ID, HojaObjeto, { makeDefault: true, label: "IMSERSO · Objeto" });

  game.settings.register(ID, "yayoCritico", {
    name: "Yayopoint por crítico", hint: "Cada éxito crítico en una tirada de habilidad entrega 1 yayopoint al jubilado (2 con «Carpe diem»). El manual lo limita a tiradas pedidas por el Sr. Ministro: desactívalo si prefieres darlo a mano.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "asistente", {
    name: "Abrir el asistente al crear un jubilado", scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "bienvenida", { scope: "world", config: false, type: String, default: "" });

  Handlebars.registerHelper("inc", v => Number(v) + 1);
  loadTemplates([`${RUTA}/templates/partes/cabecera.hbs`, `${RUTA}/templates/partes/habilidades.hbs`]);

  // Nombres de la v1: los usan macros y módulos existentes.
  game.imserso = {
    config: IMSERSO, arquetipos: ARQUETIPOS, diagnostico,
    rollSkill: (id, clave) => game.actors.get(id)?.tirarHabilidad(clave),
    rollJamacuco: id => game.actors.get(id)?.tirarJamacuco(),
    openCharacterCreator: abrirCreador, abrirCreador, rollAchaques, rollMiedo, abrirMinistro: () => PanelMinistro.abrir()
  };
});

Hooks.once("ready", async () => {
  escucharChat();
  console.info(`IMSERSO to the limit ${game.system.version} · Foundry ${game.version} (generación ${generacion()})`);
  if (game.user.isGM) await bienvenida();
});

async function bienvenida() {
  if (game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  await publicar({
    tono: "aviso", icono: "fa-solid fa-bus", etiqueta: `IMSERSO to the limit ${game.system.version}`, titulo: "¡Que salga el autocar!",
    texto: "Crea jubilados con el asistente del directorio de Actores y lleva la mesa desde el panel del Sr. Ministro. Requiere el manual original."
  }, { alias: "IMSERSO to the limit" });
}

/** Achaques al azar: menor y mayor con 1D100 cada uno (no se repite el mismo). */
async function rollAchaques() {
  const menor = await new Roll("1d100").evaluate();
  let mayor = await new Roll("1d100").evaluate();
  while (mayor.total === menor.total) mayor = await new Roll("1d100").evaluate();
  return publicar({
    tono: "aviso", icono: "fa-solid fa-crutch", etiqueta: "Achaques al azar", titulo: "1D100 + 1D100",
    lineas: [{ texto: `<strong>Menor (${menor.total}):</strong> ${foundry.utils.escapeHTML(getAchaque(menor.total))}` }, { texto: `<strong>Mayor (${mayor.total}):</strong> ${foundry.utils.escapeHTML(getAchaque(mayor.total))}` }]
  }, { rolls: [menor, mayor], alias: "Achaques" });
}

/** Miedo del Sr. Ministro sobre los jubilados marcados. */
function rollMiedo() {
  if (!game.user.isGM) return ui.notifications.warn("Solo el Sr. Ministro lanza miedo.");
  const objetivos = [...game.user.targets].map(t => t.actor).filter(a => a?.type === "jubilado");
  if (!objetivos.length) return ui.notifications.warn("Marca como objetivo a uno o varios jubilados.");
  return PanelMinistro.abrir().then(() => lanzarMiedo(objetivos, 1));
}

/** Los botones «tirar achaques» de los diarios de reglas. */
document.addEventListener("click", ev => {
  if (ev.target.closest?.("[data-ims-action='roll-achaques']")) { ev.preventDefault(); rollAchaques(); }
});

/** Jubilados: ficha vinculada y barra de Salud en los tokens. */
Hooks.on("preCreateActor", (actor, datos) => {
  if (actor.type !== "jubilado") return;
  actor.updateSource({ prototypeToken: { actorLink: true, bar1: { attribute: "salud" }, displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER, disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY, ...datos.prototypeToken } });
});

/** Un jubilado nuevo y vacío abre el asistente, solo para quien lo creó. */
Hooks.on("createActor", (actor, opciones, userId) => {
  // Solo ficha recién creada a mano (nombre por defecto): instalar una aventura crea actores con nombre y no debe abrir ventanas.
  if (userId !== game.user.id || actor.type !== "jubilado" || actor.system.datos.arquetipo || actor.pack) return;
  if (!/^(new|nuevo|nueva|jubilado|actor)\b/i.test(actor.name.trim())) return;
  if (game.settings.get(ID, "asistente")) abrirCreador(actor);
});

Hooks.on("updateCombat", alCambiarAsalto);
Hooks.on("renderCombatTracker", pintarTracker);
Hooks.on("updateActor", actor => { if (actor.type === "jubilado") repintarMinistro(); });

/** Accesos en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  const raiz = html instanceof HTMLElement ? html : html[0];
  const acciones = raiz?.querySelector(".header-actions");
  if (!acciones || acciones.querySelector(".ims-boton-dir")) return;
  const boton = (icono, texto, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ims-boton-dir";
    b.innerHTML = `<i class="fa-solid ${icono}" inert></i><span>${texto}</span>`;
    b.addEventListener("click", fn);
    acciones.append(b);
  };
  boton("fa-wand-magic-sparkles", "Asistente IMSERSO", () => abrirCreador());
  if (game.user.isGM) boton("fa-landmark", "Sr. Ministro", () => PanelMinistro.abrir());
});

Hooks.on("getSceneControlButtons", controles => {
  if (!game.user.isGM) return;
  anadirHerramienta(controles, "tokens", { name: "imsMinistro", title: "Sr. Ministro", icon: "fa-solid fa-landmark", onChange: () => PanelMinistro.abrir() });
});
