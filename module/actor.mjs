/**
 * Actor de IMSERSO to the limit (jubilados y extras).
 * Los cálculos están en reglas.mjs; las tarjetas con estado, en flujos.mjs.
 */
import { IMSERSO, labelForAttribute, labelForSkill } from "./config.mjs";
import * as R from "./reglas.mjs";
import { lanzar, publicarEfecto, publicarUmbrales, publicarPersecucion } from "./flujos.mjs";
import { publicar } from "./chat.mjs";
import { pedirDatos, confirmar } from "./dialogos.mjs";
import { arquetipoByKey, archetypeSystem, archetypeTalentItem } from "./arquetipos-data.mjs";

const esc = foundry.utils.escapeHTML;
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const dado = x => Math.min(3, Math.max(1, n(x, 1)));
const objetivoActual = () => game.user.targets.first() ?? null;

/** Equipo con efecto sobre las estadísticas (trajes de la aventura «Los Abuelos de la Justicia»). */
const todas = (...ks) => Object.fromEntries(ks.map(k => [k, 3]));
const MODIFICADORES = {
  "traje-superman": { atr: { pre: 2, rob: 4 }, min: todas("gimnasia", "lentesProgresivas", "mulaParda", "silbido", "sonotone", "tollinas"), sinArmasDano: 4, nota: "Traje de Superman" },
  "traje-batman": { atr: { cac: 4, gra: 2, rob: 2 }, min: todas("gimnasia", "petanca"), mas: { archiperres: 1, internes: 1, memoria: 1, tollinas: 1 }, nota: "Traje de Batman" },
  "traje-flash": { atr: { cac: 2, pre: 2, rob: 2 }, min: todas("gimnasia"), mas: { tollinas: 1 }, nota: "Traje de Flash" },
  "traje-wonder-woman": { atr: { cac: 2, gra: 2, rob: 2 }, min: todas("gimnasia", "tollinas"), mas: { petanca: 1 }, nota: "Traje de Wonder Woman" },
  "traje-cyborg": { atr: { rob: 2, pre: 2 }, min: todas("lentesProgresivas", "petanca", "tollinas"), mas: { gimnasia: 1 }, nota: "Traje de Cyborg" },
  "visor-de-cyborg": { min: todas("lentesProgresivas", "petanca"), nota: "Visor de Cyborg" },
  "brazaletes-de-wonder-woman": { nervioMin: 21, nota: "Brazaletes de Wonder Woman" }
};

export class ActorIMSERSO extends Actor {
  get esJubilado() { return this.type === "jubilado"; }

  /* ---------------- Datos derivados ---------------- */

  prepareDerivedData() {
    super.prepareDerivedData();
    const s = this.system;
    const ef = this._efectivos();
    s.efectivos = ef;
    s.salud.value = s.salud.valor; // las barras de token leen `value`/`max`; la escritura pasa por modifyTokenAttribute
    const cac = ef.atributos.cac, pre = ef.atributos.pre;
    const gim = ef.habilidades.gimnasia.dados;
    if (this.esJubilado) {
      s.bemoles = R.bemoles(cac);
      s.nervio = Math.max(R.nervio(gim, pre), ef.mods.nervioMin);
      s.penalizadorDados = R.penalizadorSalud(s.salud.valor);
      s.jamacucoLibre = R.jamacuco(ef.atributos.rob);
      s.reparto = R.repartoLibre(s._source.atributos, s._source.habilidades);
      s.yayosLibres = R.yayosIniciales(s._source.atributos.cac, s._source.atributos.rob);
    } else {
      if (!s.bemoles.manual) s.bemoles.valor = R.bemoles(cac);
      if (!s.nervio.manual) s.nervio.valor = Math.max(R.nervio(gim, pre), ef.mods.nervioMin);
    }
  }

  _efectivos() {
    const base = this.system;
    const mods = { atr: {}, mas: {}, min: {}, nervioMin: 0, sinArmasDano: null, notas: [] };
    for (const item of this.items ?? []) {
      if (!item.system?.equipado) continue;
      const m = MODIFICADORES[R.automatismoDe(item)];
      if (!m) continue;
      for (const [k, v] of Object.entries(m.atr ?? {})) mods.atr[k] = (mods.atr[k] ?? 0) + v;
      for (const [k, v] of Object.entries(m.mas ?? {})) mods.mas[k] = (mods.mas[k] ?? 0) + v;
      for (const [k, v] of Object.entries(m.min ?? {})) mods.min[k] = Math.max(mods.min[k] ?? 0, v);
      mods.nervioMin = Math.max(mods.nervioMin, m.nervioMin ?? 0);
      if (m.sinArmasDano != null) mods.sinArmasDano = Math.max(mods.sinArmasDano ?? 0, m.sinArmasDano);
      mods.notas.push(m.nota);
    }
    const atributos = Object.fromEntries(Object.keys(IMSERSO.atributos).map(k => [k, n(base.atributos[k]) + (mods.atr[k] ?? 0)]));
    const habilidades = Object.fromEntries(Object.keys(IMSERSO.habilidades).map(k => {
      const sumado = dado(base.habilidades[k].dados) + (mods.mas[k] ?? 0);
      return [k, { dados: dado(Math.max(sumado, mods.min[k] ?? 0)) }];
    }));
    return { atributos, habilidades, mods };
  }

  /** Valores fijos efectivos: refuerzos de yayopoints (+3 cada uno), reservar acción (+2) y sorpresa (mitad). */
  get bemolesValor() {
    const base = this.esJubilado ? this.system.bemoles : this.system.bemoles.valor;
    return base + 3 * n(this.system.combate.refuerzoBemoles);
  }

  get nervioValor() {
    const c = this.system.combate;
    const base = this.esJubilado ? this.system.nervio : this.system.nervio.valor;
    return R.nervioEfectivo({ base, sorprendido: c.sorprendido, reservando: c.reservando, refuerzo: 3 * n(c.refuerzoNervio) });
  }

  tieneAutomatismo(clave) {
    return this.items.some(i => i.system.equipado && R.automatismoDe(i) === clave);
  }

  tieneTalento(nombre) {
    const t = nombre.toLowerCase();
    return Boolean(this.system.datos?.talento?.toLowerCase().includes(t)) || this.items.some(i => i.type === "talento" && i.name.toLowerCase() === t);
  }

  /** Talento «+3 si…» que el jugador puede activar en la tirada (Aparejador de raza, Oyssss). */
  get talentoMas3() {
    return this.items.find(i => i.type === "talento" && R.TALENTOS[i.name]?.tipo === "mas3") ?? null;
  }

  /* ---------------- Yayopoints ---------------- */

  puedeGastarYayo(cantidad = 1) {
    if (!this.esJubilado) return true;
    const tiene = n(this.system.yayopoints.valor);
    if (tiene >= cantidad) return true;
    ui.notifications.warn(`${this.name} no tiene yayopoints suficientes (${tiene}/${cantidad}).`);
    return false;
  }

  async gastarYayo(cantidad = 1) {
    if (!this.esJubilado || cantidad <= 0) return true;
    if (!this.puedeGastarYayo(cantidad)) return false;
    await this.update({ "system.yayopoints.valor": n(this.system.yayopoints.valor) - cantidad });
    return true;
  }

  async ganarYayo(cantidad = 1) {
    if (!this.esJubilado) return;
    await this.update({ "system.yayopoints.valor": n(this.system.yayopoints.valor) + cantidad });
  }

  /** Gastar yayopoints para sumar +3 a Bemoles o Nervio durante un turno (p. 12). Devuelve los gastados o null. */
  async reforzar(valor) {
    if (!this.esJubilado) return null;
    const nombre = valor === "bemoles" ? "Bemoles" : "Nervio";
    const datos = await pedirDatos({
      titulo: `Reforzar ${nombre}: ${this.name}`,
      intro: "<p>Cada yayopoint suma +3 durante un turno completo, sin límite. Se declara antes de la tirada.</p>",
      filas: [{ nombre: "puntos", tipo: "num", etiqueta: `Yayopoints (tiene ${this.system.yayopoints.valor})`, valor: 1, min: 1 }],
      ok: "Gastar"
    });
    const puntos = n(datos?.puntos);
    if (puntos < 1 || !(await this.gastarYayo(puntos))) return null;
    const campo = valor === "bemoles" ? "refuerzoBemoles" : "refuerzoNervio";
    await this.update({ [`system.combate.${campo}`]: n(this.system.combate[campo]) + puntos });
    await publicar({
      tono: "aviso", icono: "fa-solid fa-capsules", etiqueta: "Yayopoints", titulo: `+${3 * puntos} a ${nombre}`,
      texto: `${this.name} gasta ${puntos} yayopoint${puntos > 1 ? "s" : ""}: ${nombre} ${valor === "bemoles" ? this.bemolesValor : this.nervioValor} durante el turno.`
    }, { actor: this });
    return puntos;
  }

  /* ---------------- Tiradas ---------------- */

  /**
   * Tirada de habilidad. Sin `datos` abre el diálogo; con `datos` las opciones ya vienen dadas
   * (ataques, defensa, persecución). Devuelve {mensaje, estado, resultado} o null si se cancela.
   */
  async tirarHabilidad(clave, { dificultad, dialogo = true, datos = null, notas = [], ataque = null } = {}) {
    const hab = IMSERSO.habilidades[clave];
    if (!hab) return null;
    const ef = this.system.efectivos;
    const objetivo = objetivoActual()?.actor;
    let porDefecto = dificultad;
    let ayuda = "";
    if (porDefecto == null) {
      porDefecto = 8;
      if (objetivo && hab.oposicion) {
        porDefecto = hab.oposicion === "bemoles" ? objetivo.bemolesValor : objetivo.nervioValor;
        ayuda = `${objetivo.name}: ${hab.oposicion === "bemoles" ? "Bemoles" : "Nervio"} ${porDefecto}`;
      }
    }
    const jubilado = this.esJubilado;
    const pen = jubilado ? n(this.system.penalizadorDados) : 0;
    let d = datos;
    if (!d && dialogo) {
      const mas3 = this.talentoMas3;
      d = await pedirDatos({
        titulo: `${labelForSkill(clave)} · ${this.name}`,
        intro: `<p>${ef.habilidades[clave].dados}D6 + ${ef.atributos[hab.atributo]} (${labelForAttribute(hab.atributo)})${pen ? ` · <b>−${pen}D por Salud</b>` : ""}</p>`,
        filas: [
          { nombre: "dificultad", tipo: "num", etiqueta: "Dificultad", valor: porDefecto, min: 1, max: 40, ayuda },
          { nombre: "profesion", tipo: "check", etiqueta: "Antigua profesión (+3)", valor: false },
          ...(mas3 ? [{ nombre: "talento", tipo: "check", etiqueta: `${mas3.name} (+3)`, ayuda: R.TALENTOS[mas3.name].sobre }] : []),
          ...(jubilado ? [
            { nombre: "yayoDado", tipo: "check", etiqueta: "Gastar 1 yayopoint: +1D", valor: false, desactivado: this.system.yayopoints.valor < 1 },
            { nombre: "flashback", tipo: "check", etiqueta: "«Es que yo a tus años…»: +1D", valor: false, desactivado: this.system.flashback.usado }
          ] : []),
          { nombre: "ayudantes", tipo: "num", etiqueta: "Ayudantes al alimón (+1D cada uno, máx. 3)", valor: 0, min: 0, max: 3 },
          { nombre: "recibido", tipo: "num", etiqueta: "Dados recibidos de un capote", valor: 0, min: 0, max: 3 },
          { nombre: "prestados", tipo: "num", etiqueta: "Dados que presto (echar un capote)", valor: 0, min: 0, max: 3 },
          { nombre: "bonus", tipo: "num", etiqueta: "Modificador fijo", valor: 0, min: -20, max: 20 }
        ],
        ok: "Tirar"
      });
    }
    if (!d) return null;
    d = { dificultad: porDefecto, ...d };
    if (jubilado && d.yayoDado && !(await this.gastarYayo(1))) return null;
    if (jubilado && d.flashback) await this.update({ "system.flashback.usado": true });

    const lista = [...notas];
    const bonus = n(d.bonus) + (d.profesion ? 3 : 0) + (d.talento ? 3 : 0);
    if (d.profesion) lista.push("Antigua profesión +3");
    if (d.talento) lista.push(`${this.talentoMas3.name} +3`);
    if (d.yayoDado) lista.push("Yayopoint: +1D");
    if (d.flashback) lista.push("«Es que yo a tus años…»: +1D");
    if (n(d.ayudantes)) lista.push(`Al alimón: +${R.alimon(d.ayudantes)}D`);
    if (n(d.recibido)) lista.push(`Capote recibido: +${d.recibido}D`);
    if (n(d.prestados)) lista.push(`Capote prestado: −${d.prestados}D`);
    if (n(d.sacrificados)) lista.push(`Apunta: sacrifica ${d.sacrificados}D`);
    if (pen) lista.push(`−${pen}D por Salud`);
    const cogorza = jubilado && this.system.estado.cogorza;
    if (cogorza) lista.push("Cogorza: −1D");
    const dados = R.dadosDeTirada({
      base: ef.habilidades[clave].dados,
      extra: (d.yayoDado ? 1 : 0) + (d.flashback ? 1 : 0) + R.alimon(d.ayudantes) + n(d.recibido),
      sacrificados: d.sacrificados, penalizador: pen, cogorza, prestados: d.prestados
    });
    return lanzar({
      actor: this, token: this.token?.object, clave, etiqueta: labelForSkill(clave), dados, atributo: ef.atributos[hab.atributo], bonus, dificultad: n(d.dificultad, 8),
      flavor: `${labelForSkill(clave)} (${labelForAttribute(hab.atributo)})`, notas: lista, ataque
    });
  }

  /** Tirada de Jamacuco: 3D6 contra el valor, con penalizador de Salud (no con cogorza). */
  async tirarJamacuco({ motivo = "", umbral = false } = {}) {
    if (!this.esJubilado) return null;
    const s = this.system;
    const pen = n(s.penalizadorDados);
    const d = await pedirDatos({
      titulo: `Jamacuco · ${this.name}`,
      intro: `<p>3D6 contra el valor de Jamacuco${pen ? ` · <b>−${pen}D por Salud</b>` : ""}. Si falla, muere.${motivo ? ` (${esc(motivo)})` : ""}</p>`,
      filas: [
        { nombre: "dificultad", tipo: "num", etiqueta: "Valor de Jamacuco", valor: s.jamacuco.valor, min: 1, max: 30 },
        { nombre: "flashback", tipo: "check", etiqueta: "«Es que yo a tus años…»: +1D", valor: false, desactivado: s.flashback.usado }
      ],
      ok: "Tirar"
    });
    if (!d) return null;
    if (d.flashback) await this.update({ "system.flashback.usado": true });
    const dados = Math.max(0, 3 + (d.flashback ? 1 : 0) - pen);
    const notas = [];
    if (d.flashback) notas.push("«Es que yo a tus años…»: +1D");
    if (pen) notas.push(`−${pen}D por Salud`);
    if (umbral) notas.push("Umbral de Salud");
    return lanzar({
      actor: this, etiqueta: "Jamacuco", dados, atributo: 0, bonus: 0, dificultad: n(d.dificultad), tipo: "jamacuco",
      flavor: motivo || "Tirada obligatoria", notas, umbral
    });
  }

  /** Ataque contra el objetivo marcado (p. 22). */
  async atacar({ item = null } = {}) {
    const marca = objetivoActual();
    const objetivo = marca?.actor;
    if (!objetivo) return ui.notifications.warn("Marca un token como objetivo antes de atacar.");
    const ef = this.system.efectivos;
    const jubilado = this.esJubilado;
    const arma = item ?? this.items.find(i => i.type === "arma" && i.system.equipado) ?? null;
    const tipoInicial = arma?.system.tipo ?? (jubilado ? this.system.combate.ataque : this.system.ataque.tipo);
    const d = await pedirDatos({
      titulo: `Ataque · ${this.name}`,
      intro: `<p>Objetivo: <strong>${esc(objetivo.name)}</strong> (Nervio ${objetivo.nervioValor}).${arma ? ` Arma: <strong>${esc(arma.name)}</strong>.` : ""}</p>`,
      filas: [
        { nombre: "tipo", tipo: "sel", etiqueta: "Tipo de ataque", valor: tipoInicial, opciones: Object.entries(IMSERSO.ataqueTipos).map(([valor, v]) => ({ valor, etiqueta: v.label })) },
        { nombre: "dificultad", tipo: "num", etiqueta: "Nervio del objetivo", valor: objetivo.nervioValor, min: 1, max: 40 },
        { nombre: "sacrificados", tipo: "num", etiqueta: "Dados que sacrifica para apuntar", valor: 0, min: 0, max: 2, ayuda: "Cada dado: +1D6 de daño (+2D6 con armas de fuego)" },
        ...(jubilado ? [
          { nombre: "yayoDano", tipo: "num", etiqueta: "Yayopoints al daño (máx. 3)", valor: 0, min: 0, max: 3 },
          { nombre: "yayoDado", tipo: "check", etiqueta: "Gastar 1 yayopoint: +1D al ataque", valor: false }
        ] : []),
        { nombre: "profesion", tipo: "check", etiqueta: "Antigua profesión (+3)", valor: false },
        { nombre: "ayudantes", tipo: "num", etiqueta: "Ayudantes al alimón", valor: 0, min: 0, max: 3 },
        { nombre: "bonus", tipo: "num", etiqueta: "Modificador fijo", valor: 0, min: -20, max: 20 }
      ],
      ok: "Atacar"
    });
    if (!d) return null;
    const base = IMSERSO.ataqueTipos[d.tipo] ?? IMSERSO.ataqueTipos.sinArmas;
    const propio = !jubilado && !arma ? this.system.ataque : null;
    const habilidad = arma?.system.habilidad || propio?.habilidad || base.habilidad;
    const atrDano = arma?.system.atributoDano || base.atributo;
    const yayoDano = jubilado ? R.tope(d.yayoDano) : 0;
    if (yayoDano && !(await this.gastarYayo(yayoDano))) return null;
    const dano = arma ? n(arma.system.danoBase, base.dano)
      : propio ? n(propio.dano, base.dano)
        : d.tipo === "sinArmas" && ef.mods.sinArmasDano != null ? ef.mods.sinArmasDano : base.dano;
    const ataque = {
      etiqueta: arma?.name ?? propio?.nombre ?? base.label, tipo: d.tipo, habilidad, dano, bono: ef.atributos[atrDano], atributoEtiqueta: labelForAttribute(atrDano),
      sacrificados: n(d.sacrificados), yayoDano, fuego: d.tipo.startsWith("fuego"), objetivoUuid: objetivo.uuid, tokenUuid: marca.document.uuid, objetivoNombre: objetivo.name
    };
    return this.tirarHabilidad(habilidad, {
      dificultad: n(d.dificultad), ataque,
      datos: { dificultad: d.dificultad, profesion: d.profesion, yayoDado: d.yayoDado, ayudantes: d.ayudantes, bonus: d.bonus, sacrificados: d.sacrificados },
      notas: yayoDano ? [`${yayoDano} yayopoint${yayoDano > 1 ? "s" : ""} al daño`] : []
    });
  }

  /** Persecución: tarjeta con las tres distancias. */
  async perseguir() {
    const objetivo = objetivoActual()?.actor;
    const d = await pedirDatos({
      titulo: `Persecución · ${this.name}`,
      filas: [
        { nombre: "perseguidor", tipo: "sel", etiqueta: "Papel", valor: "si", opciones: [{ valor: "si", etiqueta: "Persigue" }, { valor: "no", etiqueta: "Huye" }] },
        { nombre: "nervio", tipo: "num", etiqueta: `Nervio del otro${objetivo ? ` (${objetivo.name})` : ""}`, valor: objetivo?.nervioValor ?? 10, min: 1, max: 40 }
      ],
      ok: "Empezar"
    });
    if (!d) return null;
    return publicarPersecucion(this, { objetivo: objetivo?.name ?? "su objetivo", nervio: d.nervio, perseguidor: d.perseguidor === "si" });
  }

  /* ---------------- Salud ---------------- */

  /** La barra de Salud del token (o la tecla de daño) pasa por las reglas: umbrales de Jamacuco incluidos. */
  async modifyTokenAttribute(atributo, valor, esDelta = false, esBarra = true) {
    if (atributo !== "salud") return super.modifyTokenAttribute(atributo, valor, esDelta, esBarra);
    const actual = n(this.system.salud.valor);
    const nuevo = Math.max(0, Math.min(n(this.system.salud.max), esDelta ? actual + n(valor) : n(valor)));
    return nuevo < actual ? this.aplicarDano(actual - nuevo) : nuevo > actual ? this.curar(nuevo - actual) : this;
  }

  async aplicarDano(cantidad) {
    const s = this.system;
    const antes = n(s.salud.valor);
    const despues = Math.max(0, antes - n(cantidad));
    const cambios = { "system.salud.valor": despues };
    if (despues <= 0) cambios["system.estado.muerto"] = true;
    let cruzados = [];
    if (this.esJubilado) {
      if (despues === 1) cambios["system.estado.inconsciente"] = true;
      cruzados = R.umbralesCruzados(antes, despues, s.jamacuco.umbrales);
      for (const u of cruzados) cambios[`system.jamacuco.umbrales.${u}`] = true;
    }
    await this.update(cambios);
    if (cruzados.length) await publicarUmbrales(this, cruzados);
  }

  async curar(cantidad) {
    const s = this.system;
    const valor = Math.min(n(s.salud.max), n(s.salud.valor) + n(cantidad));
    const cambios = { "system.salud.valor": valor };
    if (valor > 1 && this.esJubilado && s.estado.inconsciente) cambios["system.estado.inconsciente"] = false;
    return this.update(cambios);
  }

  /** Curación reglada (p. 30), con control de «una vez al día» y «una vez por sesión». */
  async curacionRegla() {
    const marca = objetivoActual();
    const objetivo = marca?.actor ?? this;
    const usadas = objetivo.esJubilado ? objetivo.system.curaciones : {};
    const entradas = Object.entries(R.CURACION);
    const ok = entradas.filter(([k]) => R.curacionDisponible(k, usadas).ok);
    const fuera = entradas.filter(([k]) => !R.curacionDisponible(k, usadas).ok);
    if (!ok.length) return ui.notifications.warn("No queda ninguna fuente de curación disponible hoy.");
    const d = await pedirDatos({
      titulo: `Curación · ${objetivo.name}`,
      intro: `<p>Salud ${objetivo.system.salud.valor}/${objetivo.system.salud.max}. No se supera la Salud inicial.${fuera.length ? ` <small>Ahora no: ${fuera.map(([, f]) => esc(f.etiqueta)).join("; ")}.</small>` : ""}</p>`,
      filas: [
        { nombre: "fuente", tipo: "sel", etiqueta: "Fuente", valor: ok[0][0], opciones: ok.map(([valor, f]) => ({ valor, etiqueta: `${f.etiqueta} · ${f.cantidad}${f.critico ? `/${f.critico}` : ""} (${f.frecuencia === "dia" ? "al día" : "por sesión"})` })) },
        { nombre: "dificultad", tipo: "num", etiqueta: "Dificultad (si pide tirada)", valor: 10, min: 1, max: 30 }
      ],
      ok: "Preparar"
    });
    if (!d?.fuente) return null;
    const f = R.CURACION[d.fuente];
    let cantidad = f.cantidad;
    const lineas = [];
    if (f.habilidad) {
      const res = await this.tirarHabilidad(f.habilidad, { dificultad: n(d.dificultad, f.dificultad) });
      if (!res) return null;
      if (!res.resultado.exito) { lineas.push("La tirada falla: no se recupera Salud."); cantidad = 0; }
      else if (res.resultado.critico && f.critico) cantidad = f.critico;
    }
    if (objetivo.esJubilado) {
      await objetivo.update({ [`system.curaciones.${f.frecuencia}`]: [...objetivo.system.curaciones[f.frecuencia], d.fuente] });
    }
    return publicarEfecto({
      clase: "cura", objetivoUuid: objetivo.uuid, tokenUuid: marca?.document?.uuid ?? "", objetivo: objetivo.name,
      cantidad, original: cantidad, etiqueta: f.etiqueta, lineas, estado: cantidad ? "pendiente" : "cancelado"
    }, { actor: this });
  }

  /** Otras cosas que hacen daño (pp. 24-25). */
  async danoRegla() {
    const fuentes = { asfixia: "Asfixia", caida: "Caída", congelacion: "Congelación", deslomarse: "Deslomarse", veneno: "Veneno", hambre: "Hambre", sed: "Sed", cogorza: "Cogorza", quemadura: "Quemadura" };
    const a = await pedirDatos({
      titulo: `Daño reglado · ${this.name}`,
      filas: [{ nombre: "fuente", tipo: "sel", etiqueta: "Qué le ocurre", valor: "caida", opciones: Object.entries(fuentes).map(([valor, etiqueta]) => ({ valor, etiqueta })) }],
      ok: "Siguiente"
    });
    if (!a) return null;
    const f = a.fuente;
    const preguntas = {
      asfixia: [{ nombre: "turnos", tipo: "num", etiqueta: `Turnos sin respirar (aguanta ${R.dano.aguanteRespiracion(this.system.efectivos.atributos.rob)})`, valor: 1, min: 0 }],
      caida: [{ nombre: "metros", tipo: "num", etiqueta: "Metros de caída libre", valor: 1, min: 0 }],
      congelacion: [{ nombre: "minutos", tipo: "num", etiqueta: "Minutos de frío intenso", valor: 1, min: 0 }, { nombre: "porMinuto", tipo: "num", etiqueta: "Salud por minuto", valor: 1, min: 0 }],
      veneno: [{ nombre: "pot", tipo: "num", etiqueta: "Potencia (POT)", valor: 6, min: 1 }, { nombre: "menor", tipo: "num", etiqueta: "Daño menor", valor: 0, min: 0 }, { nombre: "mayor", tipo: "num", etiqueta: "Daño mayor", valor: 1, min: 0 }],
      hambre: [{ nombre: "horas", tipo: "num", etiqueta: "Horas sin comer", valor: 12, min: 0 }],
      sed: [{ nombre: "horas", tipo: "num", etiqueta: "Horas sin beber", valor: 6, min: 0 }],
      cogorza: [{ nombre: "pot", tipo: "sel", etiqueta: "Gravedad", valor: 10, opciones: [{ valor: 10, etiqueta: "Leve (10)" }, { valor: 15, etiqueta: "Grave (15)" }, { valor: 20, etiqueta: "Bacanal (20)" }] }],
      quemadura: [{ nombre: "turnos", tipo: "num", etiqueta: "Turnos en fuego abierto (3 por turno)", valor: 1, min: 0 }, { nombre: "sol", tipo: "check", etiqueta: "Es sol sin crema (1 de Salud)", valor: false }]
    };
    const b = preguntas[f] ? await pedirDatos({ titulo: fuentes[f], filas: preguntas[f], ok: "Resolver" }) : {};
    if (!b) return null;
    let cantidad = 0, resumen = "";
    const tirar = (clave, dificultad, nota) => this.tirarHabilidad(clave, { dificultad, dialogo: false, datos: { dificultad }, notas: [nota] });
    if (f === "asfixia") {
      const res = await tirar("mulaParda", 15, "Asfixia");
      cantidad = res?.resultado.exito ? 0 : 3;
      resumen = res?.resultado.exito ? "Aguanta otro turno." : "Falla: pierde 3 de Salud por turno.";
    } else if (f === "caida") {
      cantidad = R.dano.caida(b.metros);
      const res = await tirar("gimnasia", 10, "Caída: ¿cadera?");
      if (res && !res.resultado.exito) { await this.update({ "system.estado.cadera": true }); resumen = "Falla Gimnasia 10: se rompe la cadera y no se mueve el resto de la partida."; }
      else resumen = "Supera Gimnasia 10: la cadera aguanta.";
    } else if (f === "congelacion") cantidad = n(b.minutos) * n(b.porMinuto);
    else if (f === "deslomarse") {
      const res = await tirar("mulaParda", 15, "Deslomarse");
      cantidad = res?.resultado.exito ? 0 : 3;
    } else if (f === "veneno") {
      const res = await tirar("ingesta", n(b.pot), `Veneno POT ${b.pot}`);
      cantidad = res?.resultado.exito ? n(b.menor) : n(b.mayor);
    } else if (f === "hambre") cantidad = R.dano.hambre(b.horas);
    else if (f === "sed") cantidad = R.dano.sed(b.horas);
    else if (f === "cogorza") {
      const res = await tirar("ingesta", n(b.pot), "Cogorza");
      if (res && !res.resultado.exito) {
        cantidad = R.dano.cogorza(n(b.pot));
        await this.update({ "system.estado.cogorza": true });
        resumen = "Cogorza: −1D a todas las tiradas salvo Jamacuco durante 6 horas.";
      }
    } else if (f === "quemadura") cantidad = b.sol ? 1 : 3 * n(b.turnos);
    return publicarEfecto({
      clase: "dano", objetivoUuid: this.uuid, objetivo: this.name, cantidad, original: cantidad, etiqueta: fuentes[f], texto: resumen,
      estado: cantidad > 0 ? "pendiente" : "resistido"
    }, { actor: this });
  }

  /* ---------------- Talentos ---------------- */

  async usarTalento(item) {
    const def = R.TALENTOS[item.name];
    const s = item.system;
    const limitado = n(s.usos.max) > 0;
    const tarjeta = texto => publicar({ tono: "aviso", icono: "fa-solid fa-star", etiqueta: "Talento", titulo: item.name, texto, img: item.img }, { actor: this });
    if (def?.tipo === "mas3") return tarjeta(`+3 a cualquier tirada relacionada con: ${def.sobre}. Se marca al tirar.`);
    if (def?.tipo === "pasivo") return tarjeta(s.descripcion);
    if (limitado && n(s.usos.valor) < 1) return ui.notifications.warn(`${item.name} ya se usó en esta partida.`);
    if (def?.tipo === "dulce") {
      if (n(this.system.salud.valor) >= n(this.system.salud.max)) return ui.notifications.info("No hay Salud perdida que recuperar.");
      await this.curar(1);
      return tarjeta(`${this.name} se zampa una chocolatina y recupera 1 punto de Salud.`);
    }
    if (def?.tipo === "meditar") {
      const d = await pedirDatos({
        titulo: item.name, filas: [{ nombre: "que", tipo: "sel", etiqueta: "Elige", valor: "salud", opciones: [{ valor: "salud", etiqueta: "Recuperar 2 de Salud" }, { valor: "yayo", etiqueta: "Ganar 1 yayopoint" }] }], ok: "Meditar"
      });
      if (!d) return null;
      if (d.que === "salud") await this.curar(2); else await this.ganarYayo(1);
      await item.update({ "system.usos.valor": n(s.usos.valor) - 1 });
      return tarjeta(`${this.name} medita con las piernas cruzadas: ${d.que === "salud" ? "recupera 2 de Salud" : "gana 1 yayopoint"}.`);
    }
    if (limitado) await item.update({ "system.usos.valor": n(s.usos.valor) - 1 });
    return tarjeta(def?.tipo === "proeza" ? `${this.name} realiza una admirable proeza física sin tirar los dados (no vale en peleas).` : s.descripcion);
  }

  /* ---------------- Sesión y aventura ---------------- */

  /** Quita los yayopoints sobrantes, devuelve los usos de talentos y libera lo «una vez por sesión». */
  async finSesion() {
    if (!this.esJubilado) return null;
    const s = this.system;
    const sobran = Math.max(0, n(s.yayopoints.valor) - n(s.yayopoints.inicial));
    await this.update({
      "system.yayopoints.valor": Math.min(n(s.yayopoints.valor), n(s.yayopoints.inicial)),
      "system.flashback.usado": false, "system.achaques.menorUsado": false,
      "system.curaciones.sesion": [], "system.estado.cogorza": false,
      "system.combate.refuerzoBemoles": 0, "system.combate.refuerzoNervio": 0, "system.combate.reservando": false
    });
    const usos = this.items.filter(i => i.type === "talento" && i.system.usos.max > 0).map(i => ({ _id: i.id, "system.usos.valor": i.system.usos.max }));
    if (usos.length) await this.updateEmbeddedDocuments("Item", usos);
    return { sobran, sinJamacuco: !s.jamacuco.primeraTirada };
  }

  async nuevoDia() {
    if (this.esJubilado) await this.update({ "system.curaciones.dia": [] });
  }

  /** Empieza una aventura: Salud ROB×2+10+1D6, yayopoints iniciales, Jamacuco y umbrales a cero (pp. 26-27). */
  async nuevaAventura() {
    if (!this.esJubilado) return null;
    const roll = await new Roll("1d6").evaluate();
    const salud = R.saludBase(this.system.efectivos.atributos.rob) + roll.total;
    await this.update({
      "system.salud.valor": salud, "system.salud.max": salud,
      "system.yayopoints.valor": this.system.yayopoints.inicial,
      "system.jamacuco.primeraTirada": false,
      "system.jamacuco.umbrales": Object.fromEntries(R.UMBRALES.map(u => [u, false])),
      "system.estado.muerto": false, "system.estado.inconsciente": false, "system.estado.cogorza": false, "system.estado.cadera": false,
      "system.combate.sorprendido": false, "system.combate.reservando": false, "system.combate.refuerzoBemoles": 0, "system.combate.refuerzoNervio": 0,
      "system.curaciones.dia": []
    });
    await this.finSesion();
    return { roll, salud };
  }

  /** Al terminar la aventura con vida: −1 a un atributo por encima de 0 (p. 31). */
  async empeorar() {
    if (!this.esJubilado) return null;
    const op = Object.entries(IMSERSO.atributos).filter(([k]) => n(this.system.atributos[k]) > 0)
      .map(([valor, c]) => ({ valor, etiqueta: `${c.label} (${c.short}) ${this.system.atributos[valor]} → ${this.system.atributos[valor] - 1}` }));
    if (!op.length) return ui.notifications.warn(`${this.name} no tiene ningún atributo por encima de 0.`);
    const d = await pedirDatos({
      titulo: `Empeoramiento · ${this.name}`, intro: "<p>Los jubilados no mejoran: al acabar la aventura con vida pierden 1 punto en un atributo (a elegir).</p>",
      filas: [{ nombre: "atributo", tipo: "sel", etiqueta: "Atributo", valor: op[0].valor, opciones: op }], ok: "Empeorar"
    });
    if (!d) return null;
    const antes = n(this.system.atributos[d.atributo]);
    await this.update({ [`system.atributos.${d.atributo}`]: antes - 1 });
    return publicar({ tono: "aviso", icono: "fa-solid fa-arrow-trend-down", etiqueta: "Empeoramiento", titulo: `${labelForAttribute(d.atributo)} ${antes} → ${antes - 1}`, texto: `${this.name} termina la aventura con vida… y con un achaque más.` }, { actor: this });
  }

  /* ---------------- Arquetipos ---------------- */

  async aplicarArquetipo(clave, sistema = null) {
    if (!this.esJubilado) return ui.notifications.warn("Los arquetipos solo se aplican a jubilados.");
    const base = arquetipoByKey(clave);
    const a = sistema ? { ...base, ...this._arquetipoDeItem(base, sistema, clave) } : base;
    if (!a?.attrs) return ui.notifications.warn("Elige un arquetipo válido.");
    const si = await confirmar({
      titulo: `Aplicar arquetipo: ${a.name}`,
      contenido: "<p>Ajusta atributos, habilidades, partido, talento, yayopoints, Salud y Jamacuco al arquetipo. No cambia nombre, jugador, retrato ni biografía.</p>",
      si: "Aplicar"
    });
    if (!si) return null;
    const roll = await new Roll("1d6").evaluate();
    await this.update(archetypeSystem(a, roll.total));
    if (!this.items.some(i => i.type === "talento" && i.name === a.talentName)) await this.createEmbeddedDocuments("Item", [archetypeTalentItem(a)]);
    return publicar({
      tono: "aviso", icono: "fa-solid fa-stamp", etiqueta: "Arquetipo", titulo: a.name,
      lineas: [
        { texto: `Salud inicial: ${a.saludBase} + 1D6 (${roll.total}) = <strong>${a.saludBase + roll.total}</strong> · Yayopoints <strong>${a.yayos}</strong> · Jamacuco <strong>${a.jamacuco}</strong>` },
        { texto: `<strong>${esc(a.talentName)}.</strong> ${esc(a.talent)}` }
      ]
    }, { actor: this, rolls: [roll] });
  }

  _arquetipoDeItem(base, s, clave) {
    const llena = (v, alt) => ((Array.isArray(v) ? v.length : v && Object.keys(v).length) ? foundry.utils.deepClone(v) : alt);
    return {
      key: s.arquetipoKey || base?.key || clave, name: base?.name || clave, partido: s.partido || base?.partido || "",
      attrs: llena(s.atributos, base?.attrs), d3: llena(s.habilidades3d, base?.d3 ?? []), d2: llena(s.habilidades2d, base?.d2 ?? []),
      yayos: n(s.yayopoints, base?.yayos), jamacuco: n(s.jamacuco, base?.jamacuco ?? 10), saludBase: n(s.saludBase, base?.saludBase ?? 10),
      talentName: s.talentoNombre || base?.talentName || "Talento", talent: s.talento || base?.talent || ""
    };
  }
}
