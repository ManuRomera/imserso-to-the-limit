/**
 * Panel del Sr. Ministro: todos los jubilados de un vistazo y las acciones de mesa que el manual
 * reparte por capítulos (miedo, premiar yayopoints, nuevo día, fin de sesión, nueva aventura).
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { RUTA } from "./config.mjs";
import { publicar } from "./chat.mjs";
import { lanzarMiedo } from "./flujos.mjs";
import { pedirDatos, confirmar } from "./dialogos.mjs";
import { pintarRetratos } from "./retrato.mjs";

const esc = foundry.utils.escapeHTML;

export class PanelMinistro extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "imserso-ministro", classes: ["imserso", "ims-ministro"],
    position: { width: 560, height: 520 },
    window: { title: "Sr. Ministro de la Seguridad Social", icon: "fa-solid fa-landmark", resizable: true },
    actions: {
      abrir: PanelMinistro.#abrir, premiar: PanelMinistro.#premiar, jamacuco: PanelMinistro.#jamacuco,
      miedo: PanelMinistro.#miedo, dia: PanelMinistro.#dia, sesion: PanelMinistro.#sesion, aventura: PanelMinistro.#aventura
    }
  };

  static MEMORIA = "ministro";
  static PARTS = { cuerpo: { template: `${RUTA}/templates/apps/ministro.hbs`, scrollable: [".ims-cuerpo"] } };

  static abrir() { return new PanelMinistro().render({ force: true }); }

  async _onRender(context, options) {
    await super._onRender(context, options);
    pintarRetratos(this.element);
  }

  async _prepareContext() {
    const jubilados = game.actors.filter(a => a.type === "jubilado").sort((a, b) => a.name.localeCompare(b.name, "es")).map(a => {
      const s = a.system;
      const estados = [];
      if (s.estado.muerto) estados.push("Muerto");
      else if (s.estado.inconsciente) estados.push("UCI");
      if (s.estado.cogorza) estados.push("Cogorza");
      if (s.estado.cadera) estados.push("Cadera rota");
      return {
        id: a.id, nombre: a.name, img: a.img, salud: s.salud.valor, max: s.salud.max, pct: Math.max(0, Math.min(100, (100 * s.salud.valor) / Math.max(1, s.salud.max))),
        penal: s.penalizadorDados, yayos: s.yayopoints.valor, inicial: s.yayopoints.inicial,
        pendiente: !s.jamacuco.primeraTirada, flashback: s.flashback.usado, menor: s.achaques.menorUsado, estados,
        jugador: s.datos.jugador
      };
    });
    return { jubilados, vacio: !jubilados.length, pendientes: jubilados.filter(j => j.pendiente).length };
  }

  static #abrir(ev, b) { game.actors.get(b.dataset.id)?.sheet.render(true); }

  static async #premiar(ev, b) {
    const a = game.actors.get(b.dataset.id);
    await a?.ganarYayo(1);
    await publicar({ tono: "exito", icono: "fa-solid fa-capsules", etiqueta: "Yayopoint", titulo: "+1 yayopoint", texto: `${a.name} se lleva un yayopoint del Sr. Ministro.` }, { actor: a });
  }

  static #jamacuco(ev, b) { return game.actors.get(b.dataset.id)?.tirarJamacuco({ motivo: "tirada obligatoria" }); }

  static async #miedo() {
    const objetivos = [...game.user.targets].map(t => t.actor).filter(a => a?.type === "jubilado");
    if (!objetivos.length) return ui.notifications.warn("Marca como objetivo a uno o varios jubilados.");
    const d = await pedirDatos({
      titulo: "Tirada de miedo",
      intro: "<p>Gravedad de 1 (algo estresante) a 5 (absolutamente aterrador). Se tiran tantos D6 contra los Bemoles; si los igualan o superan, pierde esa Salud.</p>",
      filas: [{ nombre: "dados", tipo: "num", etiqueta: "Gravedad (dados)", valor: 1, min: 1, max: 5 }],
      ok: "Lanzar miedo"
    });
    if (d) await lanzarMiedo(objetivos, Math.max(1, Math.min(5, d.dados)));
  }

  static async #dia() {
    for (const a of game.actors.filter(a => a.type === "jubilado")) await a.nuevoDia();
    await publicar({ tono: "aviso", icono: "fa-solid fa-sun", etiqueta: "Nuevo día", titulo: "Amanece", texto: "Las curaciones «una vez al día» vuelven a estar disponibles." }, { alias: "Sr. Ministro" });
  }

  static async #sesion() {
    if (!(await confirmar({ titulo: "Fin de sesión", contenido: "<p>Se quitan los yayopoints por encima de los iniciales, vuelven «Es que yo a tus años…», el achaque menor, las curaciones por sesión y los usos de talentos.</p>", si: "Cerrar sesión" }))) return;
    const lineas = [];
    for (const a of game.actors.filter(a => a.type === "jubilado")) {
      const r = await a.finSesion();
      if (!r) continue;
      const notas = [];
      if (r.sobran) notas.push(`pierde ${r.sobran} yayopoint${r.sobran > 1 ? "s" : ""} de más`);
      if (r.sinJamacuco) notas.push("no ha tirado su Jamacuco obligatoria (salvo exención por buen roleo)");
      if (a.system.estado.muerto) notas.push("ha fallecido");
      lineas.push({ texto: `<strong>${esc(a.name)}</strong>${notas.length ? `: ${notas.map(esc).join("; ")}` : ": todo en orden"}.` });
    }
    await publicar({ tono: "aviso", icono: "fa-solid fa-moon", etiqueta: "Fin de sesión", titulo: "Hasta la próxima", lineas }, { alias: "Sr. Ministro" });
    this.render();
  }

  static async #aventura() {
    if (!(await confirmar({ titulo: "Nueva aventura", contenido: "<p>Cada jubilado vuelve a tirar su Salud (ROB×2+10+1D6), recupera los yayopoints iniciales y se borran los umbrales de Jamacuco y los estados. Los atributos no cambian: el empeoramiento se aplica antes, desde la ficha.</p>", si: "Empezar" }))) return;
    const lineas = [];
    for (const a of game.actors.filter(a => a.type === "jubilado")) {
      const r = await a.nuevaAventura();
      if (r) lineas.push({ texto: `<strong>${esc(a.name)}</strong>: Salud ${r.salud} (1D6 = ${r.roll.total}).` });
    }
    await publicar({ tono: "exito", icono: "fa-solid fa-suitcase-rolling", etiqueta: "Nueva aventura", titulo: "¡Que salga el autocar!", lineas }, { alias: "Sr. Ministro" });
    this.render();
  }
}

/** Los cambios de jubilados repintan el panel abierto. */
export function repintarMinistro() {
  for (const app of foundry.applications.instances.values()) if (app instanceof PanelMinistro) app.render();
}
