export const IMSERSO = {
  ID: "imserso-to-the-limit",
  atributos: {
    cac: { label: "Cacumen", short: "CAC" },
    gra: { label: "Gracejo", short: "GRA" },
    pre: { label: "Presteza", short: "PRE" },
    rob: { label: "Robustez", short: "ROB" }
  },
  habilidades: {
    ambulatorio: { label: "Ambulatorio", atributo: "cac", oposicion: "" },
    archiperres: { label: "Archiperres", atributo: "pre", oposicion: "" },
    batallitas: { label: "Batallitas", atributo: "gra", oposicion: "bemoles" },
    cosasDelCampo: { label: "Cosas del campo", atributo: "pre", oposicion: "" },
    cotilleo: { label: "Cotilleo", atributo: "gra", oposicion: "bemoles" },
    discusion: { label: "Discusion", atributo: "gra", oposicion: "bemoles" },
    gimnasia: { label: "Gimnasia", atributo: "pre", oposicion: "nervio" },
    ingesta: { label: "Ingesta", atributo: "rob", oposicion: "" },
    internes: { label: "Internes", atributo: "cac", oposicion: "" },
    lentesProgresivas: { label: "Lentes progresivas", atributo: "cac", oposicion: "nervio" },
    memoria: { label: "Memoria", atributo: "cac", oposicion: "" },
    mulaParda: { label: "Mula parda", atributo: "rob", oposicion: "" },
    nietos: { label: "Nietos", atributo: "pre", oposicion: "nervio" },
    petanca: { label: "Petanca", atributo: "pre", oposicion: "nervio" },
    salero: { label: "Salero", atributo: "gra", oposicion: "bemoles" },
    silbido: { label: "Silbido", atributo: "gra", oposicion: "bemoles" },
    sonotone: { label: "Sonotone", atributo: "cac", oposicion: "nervio" },
    susLabores: { label: "Sus labores", atributo: "pre", oposicion: "bemoles" },
    telediarios: { label: "Telediarios", atributo: "cac", oposicion: "" },
    tollinas: { label: "Tollinas", atributo: "rob", oposicion: "nervio" }
  },
  dificultades: [
    { value: 4, label: "4 Facililla" },
    { value: 8, label: "8 Media" },
    { value: 10, label: "10 Complicada" },
    { value: 12, label: "12 Dificil" },
    { value: 15, label: "15 Muy dificil" },
    { value: 18, label: "18 Tremenda" },
    { value: 24, label: "24 Imposible de narices" }
  ],
  ataqueTipos: {
    sinArmas: { label: "Sin armas", habilidad: "tollinas", dano: 2, atributo: "rob", iniciativa: 0, apuntar: "1d6" },
    cuerpo: { label: "Arma cuerpo a cuerpo", habilidad: "tollinas", dano: 4, atributo: "rob", iniciativa: 2, apuntar: "1d6" },
    fuegoPequena: { label: "Arma de fuego pequena", habilidad: "petanca", dano: 7, atributo: "pre", iniciativa: 5, apuntar: "2d6" },
    fuegoGrande: { label: "Arma de fuego grande", habilidad: "petanca", dano: 10, atributo: "pre", iniciativa: 5, apuntar: "2d6" }
  },
  saludUmbrales: [15, 10, 6, 3, 1]
};

export function defaultSkills(fill = 1) {
  return Object.fromEntries(Object.keys(IMSERSO.habilidades).map((key) => [key, { dados: fill }]));
}

export function normalizeSkills(source = {}) {
  const skills = defaultSkills(1);
  for (const [key, value] of Object.entries(source ?? {})) {
    if (!skills[key]) continue;
    const n = Number(value?.dados ?? value ?? 1);
    skills[key].dados = Math.min(3, Math.max(1, Number.isFinite(n) ? n : 1));
  }
  return skills;
}

export function labelForSkill(key) {
  return IMSERSO.habilidades[key]?.label ?? key;
}

export function labelForAttribute(key) {
  return IMSERSO.atributos[key]?.short ?? key?.toUpperCase?.() ?? key;
}
