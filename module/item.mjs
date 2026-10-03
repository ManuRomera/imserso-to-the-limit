/**
 * Objeto de IMSERSO to the limit: armas, equipo, talentos y arquetipos.
 * `usar()` es el botón de dado de la hoja: ataca, cura, tira, equipa o aplica según el objeto.
 */
import { publicar } from "./chat.mjs";
import { automatismoDe } from "./reglas.mjs";

const EQUIPABLES = ["traje-superman", "traje-batman", "traje-flash", "traje-wonder-woman", "traje-cyborg", "visor-de-cyborg", "brazaletes-de-wonder-woman"];

export class ItemIMSERSO extends Item {
  get automatismo() { return automatismoDe(this); }

  async usar() {
    const actor = this.actor;
    if (this.type === "arquetipo") return actor ? actor.aplicarArquetipo(this.system.arquetipoKey || this.name, this.system) : this.mostrarEnChat();
    if (!actor) return this.type === "arma" ? ui.notifications.warn("Arrastra el arma a una ficha antes de usarla.") : this.mostrarEnChat();
    if (this.type === "arma") return actor.atacar({ item: this });
    if (this.type === "talento") return actor.usarTalento(this);
    if (this.automatismo === "botiquin") return actor.curacionRegla();
    if (this.system.habilidadUso) {
      await this.mostrarEnChat();
      return actor.tirarHabilidad(this.system.habilidadUso, { dificultad: Number(this.system.dificultadUso) || 8 });
    }
    if (EQUIPABLES.includes(this.automatismo)) {
      const equipar = !this.system.equipado;
      await this.update({ "system.equipado": equipar });
      return publicar({
        tono: "aviso", icono: "fa-solid fa-shirt", etiqueta: "Equipo", titulo: this.name, img: this.img,
        texto: `${actor.name} ${equipar ? "se equipa" : "se quita"} ${this.name}. Las estadísticas se recalculan mientras esté equipado.`
      }, { actor });
    }
    return this.mostrarEnChat();
  }

  /** Equipar o desequipar; una sola arma equipada a la vez. */
  async alternarEquipado() {
    const equipar = !this.system.equipado;
    if (equipar && this.type === "arma" && this.actor) {
      const otras = this.actor.items.filter(i => i.type === "arma" && i.id !== this.id && i.system.equipado).map(i => ({ _id: i.id, "system.equipado": false }));
      if (otras.length) await this.actor.updateEmbeddedDocuments("Item", otras);
    }
    return this.update({ "system.equipado": equipar });
  }

  async mostrarEnChat() {
    const s = this.system;
    return publicar({
      tono: "item", icono: "fa-solid fa-suitcase", etiqueta: game.i18n.localize(`TYPES.Item.${this.type}`), titulo: this.name, img: this.img,
      texto: s.descripcion || s.uso || s.talento || ""
    }, { actor: this.actor ?? undefined });
  }
}
