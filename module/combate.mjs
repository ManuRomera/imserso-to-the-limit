/**
 * Combate (pp. 21-24): iniciativa 1D6 fijo + PRE + bonificador por arma, tirada solo al empezar la pelea;
 * quien es cogido por sorpresa pierde la iniciativa toda la pelea; un 6 en el dado da una acción extra
 * en el primer turno. Los refuerzos y reservar acción duran un turno; la sorpresa, el primero.
 */
import { ID } from "./config.mjs";
import * as R from "./reglas.mjs";
import { publicar } from "./chat.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export class CombatanteIMSERSO extends Combatant {
  getInitiativeRoll(formula) {
    const a = this.actor;
    if (!a?.system?.efectivos) return super.getInitiativeRoll(formula);
    this._sorprendido = Boolean(a.system.combate.sorprendido);
    if (this._sorprendido) return (this._ini = Roll.create("-99"));
    const arma = a.items.find(i => i.type === "arma" && i.system.equipado);
    const tipo = arma?.system.tipo ?? (a.esJubilado ? a.system.combate.armaIniciativa : a.system.ataque.tipo) ?? "sinArmas";
    const bono = arma ? n(arma.system.iniciativa, R.INICIATIVA_ARMA[tipo]) : R.INICIATIVA_ARMA[tipo] ?? 0;
    return (this._ini = Roll.create(`1d6 + ${a.system.efectivos.atributos.pre} + ${bono}`));
  }
}

export class CombateIMSERSO extends Combat {
  /** Tras tirar, un 6 en el dado marca la acción extra del primer turno. */
  async rollInitiative(ids, opciones) {
    const res = await super.rollInitiative(ids, opciones);
    for (const id of typeof ids === "string" ? [ids] : ids) {
      const c = this.combatants.get(id);
      const dado = c?._ini?.dice?.[0]?.results?.[0]?.result;
      if (!c || c._sorprendido) continue;
      await c.setFlag(ID, "accionExtra", dado === 6);
      if (dado === 6) await publicar({ tono: "exito", icono: "fa-solid fa-bolt", etiqueta: "Iniciativa", titulo: "¡Un 6!", texto: `${c.name} actúa dos veces en el primer turno: la acción extra va justo después de la primera.` }, { actor: c.actor });
    }
    return res;
  }
}

/** Al cambiar de asalto caducan los refuerzos de yayopoints y «reservar acción»; la sorpresa, tras el primero. */
export async function alCambiarAsalto(combate, cambios) {
  if (!game.user.isGM || !("round" in cambios) || cambios.round < 1) return;
  for (const c of combate.combatants) {
    const a = c.actor;
    if (!a?.system?.combate) continue;
    const s = a.system.combate;
    const nuevo = {};
    if (s.reservando) nuevo["system.combate.reservando"] = false;
    if (s.refuerzoNervio) nuevo["system.combate.refuerzoNervio"] = 0;
    if (s.refuerzoBemoles) nuevo["system.combate.refuerzoBemoles"] = 0;
    if (s.sorprendido && cambios.round >= 2) nuevo["system.combate.sorprendido"] = false;
    if (c.getFlag(ID, "accionExtra") && cambios.round >= 2) await c.unsetFlag(ID, "accionExtra");
    if (Object.keys(nuevo).length) await a.update(nuevo);
  }
}

/** Al terminar el combate caducan los refuerzos de yayopoints, reservar acción y la sorpresa. */
export async function alTerminarCombate(combate) {
  if (!game.user.isGM) return;
  for (const c of combate.combatants) {
    const a = c.actor;
    if (!a?.system?.combate) continue;
    const s = a.system.combate;
    if (s.reservando || s.refuerzoNervio || s.refuerzoBemoles || s.sorprendido) {
      await a.update({ "system.combate.reservando": false, "system.combate.refuerzoNervio": 0, "system.combate.refuerzoBemoles": 0, "system.combate.sorprendido": false });
    }
  }
}

/** Distintivos en el tracker: acción extra y sorpresa. */
export function pintarTracker(app, html) {
  const raiz = html instanceof HTMLElement ? html : html[0];
  for (const li of raiz?.querySelectorAll("li.combatant") ?? []) {
    const c = app.viewed?.combatants.get(li.dataset.combatantId);
    if (!c) continue;
    const marcas = [];
    if (c.getFlag(ID, "accionExtra")) marcas.push(["fa-bolt", "Acción extra en el primer turno"]);
    if (c.actor?.system?.combate?.sorprendido) marcas.push(["fa-eye-slash", "Cogido por sorpresa: Nervio a la mitad"]);
    if (c.actor?.system?.combate?.reservando) marcas.push(["fa-hourglass-half", "Reserva acción: +2 Nervio"]);
    if (!marcas.length || li.querySelector(".ims-marcas")) continue;
    const span = document.createElement("span");
    span.className = "ims-marcas";
    span.innerHTML = marcas.map(([i, t]) => `<i class="fa-solid ${i}" data-tooltip="${t}"></i>`).join("");
    li.querySelector(".token-name")?.append(span);
  }
}
