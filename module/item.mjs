export class ImsersoItem extends Item {
  async usar() {
    if (this.type === "arquetipo") {
      if (!this.actor) return this.mostrarEnChat();
      return this.actor.applyArchetype(this.system?.arquetipoKey || this.name, this.system);
    }
    if (this.type === "arma") {
      if (!this.actor) return ui.notifications.warn("Arrastra el arma a una ficha antes de usarla para atacar.");
      return this.actor.rollAttack({ item: this });
    }
    if (!this.actor) return this.mostrarEnChat();
    const automation = this._automationKey();
    if (automation === "botiquin" || automation === "curacion") return this.actor.useHealingItem(this);
    if (this.system?.habilidadUso) {
      await this.mostrarEnChat();
      return this.actor.rollSkill(this.system.habilidadUso, { dificultad: Number(this.system.dificultadUso) || 8 });
    }
    if (["traje-superman", "traje-batman", "traje-flash", "traje-wonder-woman", "traje-cyborg", "visor-de-cyborg", "defensa", "punteria", "brazaletes-de-wonder-woman"].includes(automation)) {
      const next = !this.system.equipado;
      await this.update({ "system.equipado": next });
      const state = next ? "se equipa" : "se quita";
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="ims-chat-card ims-item-card">
            <header><img src="${this.img}" alt=""><h3>${this.name}</h3></header>
            <p><strong>${this.actor.name}</strong> ${state} ${this.name}. Las estadisticas se recalculan automaticamente mientras este equipado.</p>
          </div>`
      });
    }
    return this.mostrarEnChat();
  }

  async mostrarEnChat() {
    const description = this.system.descripcion ?? this.system.uso ?? "";
    const descriptionHtml = String(description).includes("<") ? description : `<p>${description}</p>`;
    const content = `
      <div class="ims-chat-card ims-item-card">
        <header><img src="${this.img}" alt=""><h3>${this.name}</h3></header>
        ${descriptionHtml}
      </div>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content });
  }

  _automationKey() {
    const raw = this.system?.automatismo || this.system?.uso || this.name || "";
    return String(raw)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
