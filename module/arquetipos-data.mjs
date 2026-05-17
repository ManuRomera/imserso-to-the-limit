import { defaultSkills } from "./config.mjs";

function skills(d3 = [], d2 = []) {
  const out = defaultSkills(1);
  for (const key of d2) out[key] = { dados: 2 };
  for (const key of d3) out[key] = { dados: 3 };
  return out;
}

export const ARQUETIPOS = [
  {
    key: "anciana-alternativa",
    name: "Anciana alternativa",
    genero: "Señora",
    partido: "El del Coletas",
    attrs: { cac: 4, gra: 0, pre: 6, rob: 2 },
    yayos: 5,
    jamacuco: 6,
    saludBase: 14,
    d3: ["ambulatorio", "gimnasia", "sonotone", "telediarios"],
    d2: ["cosasDelCampo", "ingesta", "internes", "lentesProgresivas", "mulaParda", "salero"],
    talentName: "Ooooommmmm",
    talent: "Una vez por partida puede ponerse a meditar con las piernas cruzadas y recuperar 2 puntos de Salud o ganar 1 yayopoint, a elegir por el jugador.",
    description: "Jubilada alternativa, sana, ecológica y sorprendentemente en forma."
  },
  {
    key: "buffet-killer",
    name: "Buffet killer",
    genero: "Señora o caballero",
    partido: "Cualquiera",
    attrs: { cac: 2, gra: 4, pre: 0, rob: 6 },
    yayos: 6,
    jamacuco: 12,
    saludBase: 22,
    d3: ["cotilleo", "ingesta", "mulaParda", "salero"],
    d2: ["ambulatorio", "batallitas", "discusion", "memoria", "susLabores", "tollinas"],
    talentName: "Sugar power",
    talent: "Tras cada merma de puntos de Salud puede recuperar uno de los puntos perdidos si justo a continuación saca alguna chocolatina o galletita y se la come.",
    description: "Jubilado enorme, tragaldabas y dueño natural del buffet libre."
  },
  {
    key: "contemplador-de-obra",
    name: "Contemplador de obra",
    genero: "Caballero",
    partido: "Cualquiera",
    attrs: { cac: 6, gra: 4, pre: 0, rob: 2 },
    yayos: 6,
    jamacuco: 10,
    saludBase: 14,
    d3: ["archiperres", "discusion", "lentesProgresivas", "memoria"],
    d2: ["batallitas", "cotilleo", "mulaParda", "silbido", "sonotone", "telediarios"],
    talentName: "Aparejador de raza",
    talent: "+3 a cualquier tirada que tenga algo que ver con obras o infraestructuras: puentes, puertos, aeropuertos, carreteras, depuradoras, gasolineras, estaciones de tren, etc.",
    description: "Observador flemático, rígido y experto no invitado de toda obra pública o privada."
  },
  {
    key: "criticon",
    name: "Criticón/a",
    genero: "Señora o caballero",
    partido: "Cualquiera",
    attrs: { cac: 6, gra: 0, pre: 4, rob: 2 },
    yayos: 6,
    jamacuco: 8,
    saludBase: 14,
    d3: ["discusion", "lentesProgresivas", "memoria", "telediarios"],
    d2: ["batallitas", "cotilleo", "ingesta", "sonotone", "susLabores", "tollinas"],
    talentName: "Calumnia que algo queda",
    talent: "Una vez por partida puede convencer de forma automática a un extra de que alguien o algo está rematadamente mal.",
    description: "Eterno insatisfecho que encuentra tres pies al gato antes de que el gato entre en escena."
  },
  {
    key: "cultureta",
    name: "Cultureta",
    genero: "Señora o caballero",
    partido: "Cualquiera salvo Con Franco se vivía mejor y PEPÉ",
    attrs: { cac: 6, gra: 0, pre: 4, rob: 2 },
    yayos: 6,
    jamacuco: 8,
    saludBase: 14,
    d3: ["internes", "lentesProgresivas", "memoria", "telediarios"],
    d2: ["archiperres", "discusion", "gimnasia", "nietos", "sonotone", "susLabores"],
    talentName: "Oyssss",
    talent: "+3 a cualquier tirada en la que pueda realizar su acción de manera pedante; el jugador debe concretar en qué consiste la pedantería.",
    description: "Jubilado sabiondo, museístico y discretamente insoportable con una guía siempre a mano."
  },
  {
    key: "cunado",
    name: "Cuñado",
    genero: "Caballero",
    partido: "Cualquiera salvo SOE y El del Coletas",
    attrs: { cac: 0, gra: 6, pre: 4, rob: 2 },
    yayos: 3,
    jamacuco: 8,
    saludBase: 14,
    d3: ["batallitas", "cotilleo", "discusion", "salero"],
    d2: ["archiperres", "gimnasia", "ingesta", "petanca", "silbido", "sonotone"],
    talentName: "Y ahora te voy a decir una cosa...",
    talent: "Una vez por partida puede sacar de sus casillas al extra que desee, que estallará en improperios y perderá el control de sus acciones momentáneamente.",
    description: "Enterao carismático, opinador profesional y comprador con descuentos imposibles."
  },
  {
    key: "deportista",
    name: "Deportista",
    genero: "Señora o caballero",
    partido: "Cualquiera",
    attrs: { cac: 0, gra: 2, pre: 6, rob: 4 },
    yayos: 4,
    jamacuco: 6,
    saludBase: 18,
    d3: ["gimnasia", "mulaParda", "petanca", "tollinas"],
    d2: ["ambulatorio", "archiperres", "cosasDelCampo", "ingesta", "lentesProgresivas", "sonotone"],
    talentName: "Hércules Farnesio",
    talent: "Una vez por partida puede llevar a cabo una admirable proeza física sin necesidad de tirar los dados. No incluye acciones de pelea.",
    description: "Activo, fibroso y peligrosamente convencido de que aún está para una carrera."
  },
  {
    key: "ganan",
    name: "Gañán",
    genero: "Caballero",
    partido: "Cualquiera",
    attrs: { cac: 0, gra: 2, pre: 6, rob: 4 },
    yayos: 4,
    jamacuco: 6,
    saludBase: 18,
    d3: ["cosasDelCampo", "cotilleo", "mulaParda", "silbido"],
    d2: ["gimnasia", "ingesta", "nietos", "petanca", "salero", "tollinas"],
    talentName: "Señor de las bestias",
    talent: "Los animales sienten una simpatía natural hacia él. Nunca será atacado por animal alguno salvo que él ataque primero.",
    description: "Campurro de ciudad, boina opcional y huerta interior permanente."
  },
  {
    key: "grandchildren-slave",
    name: "Grandchildren Slave",
    genero: "Señora",
    partido: "Cualquiera",
    attrs: { cac: 2, gra: 0, pre: 6, rob: 4 },
    yayos: 5,
    jamacuco: 8,
    saludBase: 18,
    d3: ["ambulatorio", "gimnasia", "nietos", "susLabores"],
    d2: ["batallitas", "discusion", "ingesta", "memoria", "mulaParda", "sonotone"],
    talentName: "Mire el pequeño qué rubito",
    talent: "Una vez por partida puede ablandar a un extra y conseguir algo de él tras enseñarle las fotos de sus nietos.",
    description: "Abuela práctica, abnegada y rehén emocional de una descendencia inagotable."
  },
  {
    key: "jarry-el-guarro",
    name: "Jarry “el Guarro”",
    genero: "Caballero",
    partido: "Con Franco se vivía mejor, PEPÉ o SOE",
    attrs: { cac: 4, gra: 0, pre: 6, rob: 2 },
    yayos: 5,
    jamacuco: 6,
    saludBase: 14,
    d3: ["archiperres", "ingesta", "mulaParda", "tollinas"],
    d2: ["cosasDelCampo", "gimnasia", "petanca", "silbido", "sonotone", "susLabores"],
    talentName: "Achante Master",
    talent: "Una vez por partida puede intimidar automáticamente al extra que desee. No incluye animales ni seres que no sean humanos.",
    description: "Endurecido, rancio, de pocas palabras y mirada suficientemente explicativa."
  },
  {
    key: "senora-doraemon",
    name: "Señora Doraemon",
    genero: "Señora",
    partido: "Cualquiera",
    attrs: { cac: 2, gra: 0, pre: 6, rob: 4 },
    yayos: 5,
    jamacuco: 10,
    saludBase: 18,
    d3: ["archiperres", "memoria", "susLabores", "tollinas"],
    d2: ["ambulatorio", "gimnasia", "ingesta", "mulaParda", "nietos", "sonotone"],
    talentName: "Doraemon Skill",
    talent: "Una vez por partida puede sacar de su bolso prácticamente cualquier cosa que se le ocurra, si el jugador argumenta cómo es que la posee o por qué ha llegado hasta allí.",
    description: "Mujerona de bolso insondable y recursos materiales estadísticamente imposibles."
  },
  {
    key: "suegra",
    name: "Suegra",
    genero: "Señora",
    partido: "Cualquiera",
    attrs: { cac: 6, gra: 4, pre: 0, rob: 2 },
    yayos: 6,
    jamacuco: 10,
    saludBase: 14,
    d3: ["cotilleo", "discusion", "memoria", "susLabores"],
    d2: ["batallitas", "ingesta", "lentesProgresivas", "nietos", "salero", "tollinas"],
    talentName: "Me vas a oír",
    talent: "Una vez por partida puede minarle la moral a base de reproches a un extra con el que tenga un mínimo de relación. El extra queda hundido, lleno de remordimientos y neutralizado.",
    description: "Estratega familiar de alta presión y claridad de ideas peligrosísima."
  },
  {
    key: "viuda-liberada",
    name: "Viuda liberada",
    genero: "Señora",
    partido: "Cualquiera",
    attrs: { cac: 0, gra: 6, pre: 4, rob: 2 },
    yayos: 3,
    jamacuco: 8,
    saludBase: 14,
    d3: ["gimnasia", "nietos", "salero", "susLabores"],
    d2: ["batallitas", "cotilleo", "discusion", "internes", "lentesProgresivas", "sonotone"],
    talentName: "Carpe diem",
    talent: "Cada vez que saca un crítico en una tirada de habilidad obtiene 2 yayopoints adicionales en lugar de uno solo.",
    description: "Feliz, activa, dicharachera y muy poco interesada en volver a casarse."
  },
  {
    key: "viudo-merodeador",
    name: "Viudo merodeador",
    genero: "Caballero",
    partido: "Cualquiera salvo El del Coletas",
    attrs: { cac: 4, gra: 6, pre: 0, rob: 2 },
    yayos: 5,
    jamacuco: 10,
    saludBase: 14,
    d3: ["cotilleo", "lentesProgresivas", "salero", "sonotone"],
    d2: ["batallitas", "discusion", "gimnasia", "internes", "petanca", "telediarios"],
    talentName: "Ojo de Halcón",
    talent: "Mejora cualquier calidad de éxito de una tirada de Lentes progresivas a cambio de 1 yayopoint; por ejemplo, de fallo a éxito simple o de éxito simple a crítico.",
    description: "Alerta, arregladete y siempre buscando nueva esposa con logística doméstica incluida."
  }
];

export function arquetipoByKey(key) {
  return ARQUETIPOS.find((arquetipo) => arquetipo.key === key || arquetipo.name === key) ?? null;
}

export function archetypeSkills(arquetipo) {
  return skills(arquetipo.d3, arquetipo.d2);
}

export function archetypeSystem(arquetipo, healthRoll = 4) {
  const salud = arquetipo.saludBase + healthRoll;
  return {
    "system.datos.arquetipo": arquetipo.name,
    "system.datos.talento": `${arquetipo.talentName}. ${arquetipo.talent}`,
    "system.datos.partido": arquetipo.partido,
    "system.atributos": arquetipo.attrs,
    "system.habilidades": archetypeSkills(arquetipo),
    "system.yayopoints.valor": arquetipo.yayos,
    "system.yayopoints.inicial": arquetipo.yayos,
    "system.salud.valor": salud,
    "system.salud.max": salud,
    "system.jamacuco.valor": arquetipo.jamacuco,
    "system.jamacuco.primeraTirada": false,
    "system.jamacuco.umbrales": { 15: false, 10: false, 6: false, 3: false, 1: false }
  };
}

export function archetypeTalentItem(arquetipo) {
  return {
    name: arquetipo.talentName,
    type: "talento",
    img: "icons/svg/d20-grey.svg",
    system: {
      descripcion: arquetipo.talent,
      usos: { valor: 1, max: 1 },
      equipado: false,
      automatismo: ""
    }
  };
}

export function archetypeItem(arquetipo) {
  return {
    name: arquetipo.name,
    type: "arquetipo",
    img: "icons/svg/aura.svg",
    system: {
      arquetipoKey: arquetipo.key,
      genero: arquetipo.genero,
      partido: arquetipo.partido,
      atributos: arquetipo.attrs,
      habilidades: archetypeSkills(arquetipo),
      habilidades3d: arquetipo.d3,
      habilidades2d: arquetipo.d2,
      yayopoints: arquetipo.yayos,
      saludBase: arquetipo.saludBase,
      jamacuco: arquetipo.jamacuco,
      talentoNombre: arquetipo.talentName,
      talento: arquetipo.talent,
      descripcion: arquetipo.description
    }
  };
}

export const ARQUETIPO_ITEMS = ARQUETIPOS.map((arquetipo) => archetypeItem(arquetipo));
