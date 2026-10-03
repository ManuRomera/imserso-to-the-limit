/**
 * Tarjetas de chat. Una sola plantilla (templates/chat/tarjeta.hbs) para tiradas, daño,
 * curación, miedo, Jamacuco y persecuciones. Cada tarjeta con botones guarda su estado en
 * `flags.imserso` ({tipo, estado}); al cambiar el estado se vuelve a pintar entera.
 *
 * Solo el autor del mensaje o un GM pueden editarlo; si otro jugador pulsa un botón
 * (p. ej. la defensa activa del objetivo), el nuevo estado viaja por socket al GM.
 */
import { ID, RUTA } from "./config.mjs";
import { aplicarModo, alRenderizarMensaje, renderTemplate } from "./compat.mjs";

const VISTAS = {};
const ACCIONES = {};
export const SOCKET = `system.${ID}`;

/** Cada tipo de tarjeta registra cómo se pinta su estado y qué hace cada botón. */
export const registrarVista = (tipo, fn) => { VISTAS[tipo] = fn; };
export const registrarAccion = (nombre, fn) => { ACCIONES[nombre] = fn; };

const atributos = datos => Object.entries(datos ?? {}).map(([k, v]) => `data-${k}="${foundry.utils.escapeHTML(String(v))}"`).join(" ");

async function pintar(tarjeta) {
  const vista = { ...tarjeta, botones: tarjeta.botones?.map(b => ({ ...b, attrs: atributos({ uuid: b.uuid, ...b.datos }) })) };
  return renderTemplate(`${RUTA}/templates/chat/tarjeta.hbs`, vista);
}

/**
 * @param {object} tarjeta  Datos de la plantilla (tono, icono, etiqueta, titulo, dados, lineas, botones…)
 * @param {object} [op]
 * @param {Actor}  [op.actor]   Quién habla
 * @param {Roll[]} [op.rolls]   Tiradas incluidas (respetan el modo de visibilidad del chat)
 * @param {object} [op.flujo]   {tipo, estado}: estado persistente de la tarjeta
 */
export async function publicar(tarjeta, { actor, rolls, flujo, alias, token } = {}) {
  const datos = {
    content: await pintar(tarjeta),
    speaker: actor ? ChatMessage.getSpeaker({ actor, token }) : ChatMessage.getSpeaker({ alias: alias ?? "IMSERSO to the limit" }),
    flags: flujo ? { [ID]: flujo } : {}
  };
  if (rolls?.length) {
    datos.rolls = rolls;
    datos.sound = CONFIG.sounds.dice;
    aplicarModo(datos);
  }
  return ChatMessage.create(datos);
}

/** Guarda un estado nuevo y repinta la tarjeta; si no hay permiso, lo pide al GM. */
export async function guardar(mensaje, estado) {
  const tipo = mensaje.getFlag(ID, "tipo");
  if (!mensaje.canUserModify(game.user, "update")) {
    game.socket.emit(SOCKET, { op: "estado", id: mensaje.id, estado });
    return;
  }
  const content = await pintar(VISTAS[tipo](estado));
  await mensaje.update({ content, [`flags.${ID}.estado`]: estado });
}

/** El GM recibe lo que un jugador no puede escribir. */
export function escucharSocket() {
  game.socket.on(SOCKET, async datos => {
    if (datos.op !== "estado") return;
    const gm = game.users.activeGM;
    if (gm?.id !== game.user.id) return;
    const mensaje = game.messages.get(datos.id);
    if (mensaje) await guardar(mensaje, datos.estado);
  });
}

/** ¿Puede este usuario pulsar este botón? `gm`: solo el GM; `dueno`: quien controla el actor (o el GM). */
function permitido(b) {
  const quien = b.dataset.quien;
  if (quien === "gm") return game.user.isGM;
  if (quien === "dueno") {
    const doc = b.dataset.uuid ? fromUuidSync(b.dataset.uuid) : null;
    return game.user.isGM || Boolean(doc?.isOwner);
  }
  return true;
}

export function escucharChat() {
  escucharSocket();
  alRenderizarMensaje((mensaje, html) => {
    if (!mensaje.getFlag(ID, "tipo")) return;
    for (const b of html.querySelectorAll("[data-ims-accion]")) {
      if (!permitido(b)) { b.remove(); continue; }
      b.addEventListener("click", async ev => {
        ev.preventDefault();
        b.disabled = true;
        try {
          const estado = foundry.utils.deepClone(mensaje.getFlag(ID, "estado") ?? {});
          await ACCIONES[b.dataset.imsAccion]?.({ mensaje, estado, boton: b, datos: { ...b.dataset } });
        } finally {
          b.disabled = false;
        }
      });
    }
    // Un pie de botones vacío (todos retirados por permisos) no debe dejar hueco.
    html.querySelector(".ims-tc-botones:empty")?.remove();
  });
}
