/**
 * Hojas V2 de jubilado, extra y objeto, con memoria de ventana.
 * Candado de edición: lo que cambia las reglas (atributos, dados, valores fijos, borrados) solo se toca
 * desbloqueando; tirar, gastar yayopoints y escribir texto siempre funcionan.
 */
import { ActorSheetV2, ItemSheetV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { IMSERSO, RUTA, labelForAttribute } from "./config.mjs";
import * as R from "./reglas.mjs";
import { ARQUETIPOS } from "./arquetipos-data.mjs";
import { helpEntry } from "./help-data.mjs";
import { pedirDatos } from "./dialogos.mjs";
import { abrirCreador } from "./creador.mjs";
import { publicar } from "./chat.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const signo = v => (v > 0 ? `+${v}` : `${v}`);

/** Texto de ayuda para `data-tooltip`. */
export const ayuda = (tipo, clave) => {
  const h = helpEntry(tipo, clave);
  return h ? [h.title, h.body, ...(h.details ?? [])].join(" — ") : "";
};

class HojaBase extends ConMemoria(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["imserso", "ims-hoja"],
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      editar: HojaBase.#editar, compacto: HojaBase.#compacto,
      tirar: HojaBase.#tirar, iniciativa: HojaBase.#iniciativa, ataque: HojaBase.#ataque, perseguir: HojaBase.#perseguir,
      saludMas: HojaBase.#saludMas, saludMenos: HojaBase.#saludMenos, saludOtra: HojaBase.#saludOtra,
      itemUsar: HojaBase.#itemUsar, itemEquipar: HojaBase.#itemEquipar, itemChat: HojaBase.#itemChat,
      itemEditar: HojaBase.#itemEditar, itemBorrar: HojaBase.#itemBorrar, itemNuevo: HojaBase.#itemNuevo
    }
  };

  static SCROLL_MEMORIA = [".ims-cuerpo"];
  editando = false;

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.document;
    this.tabGroups.primary ??= "habilidades";
    return {
      ...base, actor, system: actor.system, editable: this.isEditable, editando: this.isEditable && this.editando,
      compacto: this.compacto, esGM: game.user.isGM, pestana: this.tabGroups.primary, atributos: this.#atributos(actor),
      titulosGrupos: { arma: "Armas", equipo: "Equipo", talento: "Talentos", arquetipo: "Arquetipos" },
      sub: this._subtitulo(actor)
    };
  }

  /** Línea bajo el nombre: lo esencial de la persona, escapado. */
  _subtitulo(actor) {
    const d = actor.system.datos;
    return [d?.arquetipo, d?.antiguaProfesion, d?.anos && `${d.anos} años`].filter(Boolean).map(foundry.utils.escapeHTML).join(" · ");
  }

  /** Grupos de habilidades por atributo, con dados y total de cada una. */
  #atributos(actor) {
    const ef = actor.system.efectivos;
    return Object.entries(IMSERSO.atributos).map(([clave, a]) => {
      const bono = ef.atributos[clave];
      return {
        clave, ...a, bono, bonoTexto: signo(bono), base: actor.system.atributos[clave],
        habilidades: Object.entries(IMSERSO.habilidades).filter(([, h]) => h.atributo === clave).map(([k, h]) => {
          const dados = ef.habilidades[k].dados;
          return {
            clave: k, etiqueta: h.label, dados, base: actor.system.habilidades[k].dados, total: `${dados}D${bono ? signo(bono) : ""}`,
            oposicion: h.oposicion === "bemoles" ? "Bemoles" : h.oposicion === "nervio" ? "Nervio" : "",
            oposicionCorta: h.oposicion === "bemoles" ? "Bem." : h.oposicion === "nervio" ? "Ner." : "",
            ayuda: ayuda("skill", k),
            pips: [1, 2, 3].map(i => ({ i, activo: dados >= i, extra: dados >= i && actor.system.habilidades[k].dados < i }))
          };
        })
      };
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("compacto", this.compacto);
    this.element.classList.toggle("editando", this.editando);
    // Los dados de una habilidad se corrigen con un clic en el pip, solo con el candado abierto.
    for (const b of this.element.querySelectorAll("[data-pip]")) {
      b.addEventListener("click", ev => {
        ev.stopPropagation();
        if (!this.editando) return;
        const { habilidad, valor } = b.dataset;
        const actual = this.document.system.habilidades[habilidad].dados;
        this.document.update({ [`system.habilidades.${habilidad}.dados`]: n(valor) === actual ? n(valor) - 1 || 1 : n(valor) });
      });
    }
  }

  static #editar() { this.editando = !this.editando; this.render(); }
  static #compacto() { this.alternarCompacto(); }
  static #tirar(ev, b) { return this.document.tirarHabilidad(b.dataset.clave); }
  static #iniciativa() { return this.document.rollInitiative({ createCombatants: true }); }
  static #ataque() { return this.document.atacar(); }
  static #perseguir() { return this.document.perseguir(); }
  static #saludMas() { return this.document.curar(1); }
  static #saludMenos() { return this.document.aplicarDano(1); }

  static async #saludOtra() {
    const d = await pedirDatos({
      titulo: `Salud · ${this.document.name}`,
      filas: [
        { nombre: "tipo", tipo: "sel", etiqueta: "Qué ocurre", valor: "dano", opciones: [{ valor: "dano", etiqueta: "Pierde Salud" }, { valor: "cura", etiqueta: "Recupera Salud" }] },
        { nombre: "cantidad", tipo: "num", etiqueta: "Puntos", valor: 1, min: 0 }
      ],
      ok: "Aplicar"
    });
    if (!d) return;
    return d.tipo === "dano" ? this.document.aplicarDano(d.cantidad) : this.document.curar(d.cantidad);
  }

  #item(boton) { return this.document.items.get(boton.closest("[data-item-id]")?.dataset.itemId); }
  static #itemUsar(ev, b) { return this.#item(b)?.usar(); }
  static #itemEquipar(ev, b) { return this.#item(b)?.alternarEquipado(); }
  static #itemChat(ev, b) { return this.#item(b)?.mostrarEnChat(); }
  static #itemEditar(ev, b) { return this.#item(b)?.sheet.render(true); }
  static #itemBorrar(ev, b) { return this.#item(b)?.delete(); }
  static #itemNuevo(ev, b) {
    const nombres = { arma: "Nueva arma", talento: "Nuevo talento", equipo: "Nuevo equipo" };
    return this.document.createEmbeddedDocuments("Item", [{ name: nombres[b.dataset.tipo], type: b.dataset.tipo }]);
  }
}

export class HojaJubilado extends HojaBase {
  static DEFAULT_OPTIONS = {
    classes: ["ims-jubilado"],
    position: { width: 640, height: 740 },
    window: { icon: "fa-solid fa-person-cane" },
    actions: {
      jamacuco: HojaJubilado.#jamacuco, reforzar: HojaJubilado.#reforzar, reservar: HojaJubilado.#reservar,
      yayoMas: HojaJubilado.#yayoMas, yayoMenos: HojaJubilado.#yayoMenos,
      flashback: HojaJubilado.#flashback, menorUsado: HojaJubilado.#menorUsado,
      arquetipo: HojaJubilado.#arquetipo, creador: HojaJubilado.#creador,
      danoRegla: HojaJubilado.#danoRegla, curacion: HojaJubilado.#curacion, empeorar: HojaJubilado.#empeorar,
      nuevaAventura: HojaJubilado.#nuevaAventura, finSesion: HojaJubilado.#finSesion, nuevoDia: HojaJubilado.#nuevoDia,
      premiar: HojaJubilado.#premiar, jamacucoLibre: HojaJubilado.#jamacucoLibre, yayosLibres: HojaJubilado.#yayosLibres,
      sorpresa: HojaJubilado.#sorpresa
    }
  };

  static COMPACTO = { width: 330, height: 720 };
  static SECCIONES = {};
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/jubilado.hbs`, scrollable: [".ims-cuerpo"] } };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const a = this.document;
    const s = a.system;
    const ef = s.efectivos;
    // La barra llega a 28 (máximo de Salud de un PJ) o a su Salud inicial si es mayor.
    const pasos = Math.max(28, s.salud.max, s.salud.valor);
    const etiquetaUmbral = { 15: "Jamacuco", 10: "−1D", 6: "−2D", 3: "−3D", 1: "UCI" };
    const segmentos = Array.from({ length: pasos }, (_, i) => {
      const v = i + 1;
      return {
        v, activo: v <= s.salud.valor, fuera: v > s.salud.max, umbral: R.UMBRALES.includes(v), cruzado: Boolean(s.jamacuco.umbrales[v]),
        etiqueta: etiquetaUmbral[v] ?? "", zona: v <= 3 ? "z3" : v <= 6 ? "z2" : v <= 10 ? "z1" : "z0"
      };
    });
    const total = Math.max(s.yayopoints.valor, s.yayopoints.inicial);
    const objetos = tipo => a.items.filter(i => i.type === tipo).map(i => this.#objeto(i));
    return Object.assign(ctx, {
      segmentos, penalizador: s.penalizadorDados,
      yayos: Array.from({ length: total }, (_, i) => ({ lleno: i < s.yayopoints.valor, extra: i >= s.yayopoints.inicial })),
      bemoles: a.bemolesValor, nervio: a.nervioValor,
      refuerzoBemoles: s.combate.refuerzoBemoles * 3, refuerzoNervio: s.combate.refuerzoNervio * 3,
      mods: ef.mods.notas,
      grupos: { arma: objetos("arma"), equipo: objetos("equipo"), talento: objetos("talento"), arquetipo: objetos("arquetipo") },
      sinObjetos: a.items.size === 0,
      arquetipos: ARQUETIPOS.map(x => ({ valor: x.name, etiqueta: x.name })),
      partidos: R.PARTIDOS,
      ataquesTipos: Object.entries(IMSERSO.ataqueTipos).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      ayuda: { yayopoints: ayuda("rule", "yayopoints"), bemoles: ayuda("rule", "bemoles"), nervio: ayuda("rule", "nervio"), salud: ayuda("rule", "salud"), jamacuco: ayuda("rule", "jamacuco"), achaques: ayuda("rule", "achaques") },
      jamacucoPendiente: !s.jamacuco.primeraTirada
    });
  }

  #objeto(i) {
    const sub = i.type === "arma" ? `${IMSERSO.ataqueTipos[i.system.tipo]?.label ?? ""} · daño ${i.system.danoBase}`
      : i.type === "talento" ? (i.system.usos.max ? `${i.system.usos.valor}/${i.system.usos.max} usos` : "siempre activo")
        : i.type === "equipo" ? (i.system.cantidad > 1 ? `×${i.system.cantidad}` : "") : "";
    const equipable = i.type === "arma" || i.type === "equipo" && (i.system.equipable || i.system.equipado || ["traje", "visor", "brazaletes"].some(t => i.automatismo.includes(t)));
    return { id: i.id, nombre: i.name, img: i.img, sub, equipado: i.system.equipado, equipable, tipo: i.type, usable: i.type !== "equipo" || i.system.habilidadUso || i.automatismo === "botiquin" || ["traje", "visor", "brazaletes"].some(t => i.automatismo.includes(t)) };
  }

  static #jamacuco() { return this.document.tirarJamacuco(); }
  static #reforzar(ev, b) { return this.document.reforzar(b.dataset.valor); }
  static #reservar() { return this.document.update({ "system.combate.reservando": !this.document.system.combate.reservando }); }
  static #sorpresa() { return this.document.update({ "system.combate.sorprendido": !this.document.system.combate.sorprendido }); }
  static #yayoMas() { return this.document.ganarYayo(1); }
  static #yayoMenos() { return this.document.gastarYayo(1); }
  static #flashback() { return this.document.update({ "system.flashback.usado": !this.document.system.flashback.usado }); }
  static #menorUsado() { return this.document.update({ "system.achaques.menorUsado": !this.document.system.achaques.menorUsado }); }
  static #arquetipo() {
    const valor = this.element.querySelector("[name='system.datos.arquetipo']")?.value;
    return this.document.aplicarArquetipo(valor);
  }
  static #creador() { return abrirCreador(this.document); }
  static #danoRegla() { return this.document.danoRegla(); }
  static #curacion() { return this.document.curacionRegla(); }
  static #empeorar() { return this.document.empeorar(); }
  static async #nuevaAventura() {
    const r = await this.document.nuevaAventura();
    if (r) ui.notifications.info(`${this.document.name}: Salud ${r.salud} (${r.roll.total} en 1D6), yayopoints y Jamacuco restaurados.`);
  }
  static async #finSesion() {
    const r = await this.document.finSesion();
    if (r) ui.notifications.info(`${this.document.name}: fin de sesión${r.sobran ? ` (pierde ${r.sobran} yayopoint${r.sobran > 1 ? "s" : ""} de más)` : ""}.`);
  }
  static #nuevoDia() { return this.document.nuevoDia(); }
  static async #premiar() {
    await this.document.ganarYayo(1);
    await publicar({ tono: "exito", icono: "fa-solid fa-capsules", etiqueta: "Yayopoint", titulo: "+1 yayopoint", texto: `${this.document.name} se lleva un yayopoint del Sr. Ministro.` }, { actor: this.document });
  }
  static #jamacucoLibre() { return this.document.update({ "system.jamacuco.valor": this.document.system.jamacucoLibre }); }
  static #yayosLibres() { return this.document.update({ "system.yayopoints.inicial": this.document.system.yayosLibres, "system.yayopoints.valor": this.document.system.yayosLibres }); }
}

export class HojaExtra extends HojaBase {
  static DEFAULT_OPTIONS = {
    classes: ["ims-extra"],
    position: { width: 520, height: 640 },
    window: { icon: "fa-solid fa-user-secret" },
    actions: { sorpresa: HojaExtra.#sorpresa, aleatorio: HojaExtra.#aleatorio }
  };

  static COMPACTO = { width: 320, height: 620 };
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/extra.hbs`, scrollable: [".ims-cuerpo"] } };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const a = this.document;
    return Object.assign(ctx, {
      bemoles: a.bemolesValor, nervio: a.nervioValor,
      ataquesTipos: Object.entries(IMSERSO.ataqueTipos).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      habilidadesOpc: Object.entries(IMSERSO.habilidades).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      grupos: { arma: a.items.filter(i => i.type === "arma").map(i => ({ id: i.id, nombre: i.name, img: i.img, sub: `daño ${i.system.danoBase}`, equipado: i.system.equipado, equipable: true, usable: true })), equipo: [], talento: [], arquetipo: [] }
    });
  }

  static #sorpresa() { return this.document.update({ "system.combate.sorprendido": !this.document.system.combate.sorprendido }); }

  static async #aleatorio() { return (await import("./creador.mjs")).extraAleatorio(this.document); }

  _subtitulo(actor) {
    const s = actor.system;
    return [s.rol, s.bando].filter(Boolean).map(foundry.utils.escapeHTML).join(" · ");
  }

  /** Al elegir el tipo de ataque se copian la habilidad y el daño base del tipo. */
  _onChangeForm(config, event) {
    super._onChangeForm?.(config, event);
    if (event.target?.name === "system.ataque.tipo") {
      const t = IMSERSO.ataqueTipos[event.target.value];
      if (t) this.document.update({ "system.ataque.nombre": t.label, "system.ataque.habilidad": t.habilidad, "system.ataque.dano": t.dano });
    }
  }
}

export class HojaObjeto extends ConMemoria(HandlebarsApplicationMixin(ItemSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["imserso", "ims-hoja", "ims-objeto"],
    position: { width: 460, height: 440 },
    form: { submitOnChange: true },
    window: { resizable: true, icon: "fa-solid fa-suitcase" },
    actions: { usar: HojaObjeto.#usar, chat: HojaObjeto.#chat }
  };

  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/objeto.hbs`, scrollable: [".ims-cuerpo"] } };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const i = this.document;
    return {
      ...base, item: i, system: i.system, editable: this.isEditable, tipo: i.type,
      tiposAtaque: Object.entries(IMSERSO.ataqueTipos).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      habilidades: [{ valor: "", etiqueta: "Sin tirada" }, ...Object.entries(IMSERSO.habilidades).map(([valor, v]) => ({ valor, etiqueta: v.label }))],
      habilidadesArma: Object.entries(IMSERSO.habilidades).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      atributosOpc: Object.entries(IMSERSO.atributos).map(([valor, v]) => ({ valor, etiqueta: `${v.label} (${v.short})` })),
      automatismos: [
        { valor: "", etiqueta: "Sin automatismo" }, { valor: "botiquin", etiqueta: "Botiquín: cura con Ambulatorio 10 (2 / 4 con crítico)" },
        { valor: "traje-superman", etiqueta: "Traje de Superman" }, { valor: "traje-batman", etiqueta: "Traje de Batman" },
        { valor: "traje-flash", etiqueta: "Traje de Flash" }, { valor: "traje-wonder-woman", etiqueta: "Traje de Wonder Woman" },
        { valor: "traje-cyborg", etiqueta: "Traje de Cyborg" }, { valor: "visor-de-cyborg", etiqueta: "Visor de Cyborg" },
        { valor: "brazaletes-de-wonder-woman", etiqueta: "Brazaletes de Wonder Woman" }
      ]
    };
  }

  static #usar() { return this.document.usar(); }
  static #chat() { return this.document.mostrarEnChat(); }
}
