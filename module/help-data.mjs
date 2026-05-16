export const SHEET_HELP = {
  attribute: {
    cac: {
      title: "Cacumen",
      subtitle: "Atributo mental y perceptivo",
      body: "Indica lo listo que es el PJ, lo bien que piensa y razona, la agudeza de sus sentidos y, de forma indirecta, lo firme y saludable que es su estado mental.",
      details: ["Habilidades: Ambulatorio, Internés, Lentes progresivas, Memoria, Sonotone y Telediarios."]
    },
    gra: {
      title: "Gracejo",
      subtitle: "Atributo social",
      body: "Carisma, capacidad para relacionarse, convencer, engañar y salir del paso con labia.",
      details: ["Habilidades: Batallitas, Discusión, Cotilleo, Salero y Silbido."]
    },
    pre: {
      title: "Presteza",
      subtitle: "Atributo de reflejos y destreza",
      body: "Agilidad, sigilo, destreza manual, puntería, reflejos y equilibrio.",
      details: ["Habilidades: Archiperres, Cosas del campo, Gimnasia, Nietos, Petanca y Sus labores."]
    },
    rob: {
      title: "Robustez",
      subtitle: "Atributo físico",
      body: "Fuerza física, constitución y salud.",
      details: ["Habilidades: Ingesta, Mula parda y Tollinas.", "Valor de Jamacuco: 12 menos el bonificador de ROB, salvo valores específicos de arquetipo."]
    }
  },
  skill: {
    ambulatorio: {
      title: "Ambulatorio",
      subtitle: "CAC · curas, achaques y conocimientos médicos de andar por casa",
      body: "Sirve para atender heridas, usar un botiquín y entender dolencias, tratamientos y asuntos sanitarios cotidianos.",
      details: ["Botiquín: tirada de Ambulatorio a dificultad 10; cura 2 Salud, o 4 con crítico."]
    },
    internes: {
      title: "Internés",
      subtitle: "CAC · tecnología y búsquedas",
      body: "Manejar internet, móviles, aparatos modernos, búsquedas y gestiones digitales sin que la tecnología gane la partida."
    },
    lentesProgresivas: {
      title: "Lentes progresivas",
      subtitle: "CAC · observar y apuntar con la mirada",
      body: "Percibir detalles, encontrar pistas, detectar cosas raras y fijarse en lo que otros pasan por alto.",
      details: ["Suele oponerse a Nervio cuando la acción depende de ver o localizar algo que se mueve o se oculta."]
    },
    memoria: {
      title: "Memoria",
      subtitle: "CAC · recordar lo importante",
      body: "Recordar datos, nombres, rumores, lugares, caras y toda esa información que estaba en algún rincón de la cabeza."
    },
    sonotone: {
      title: "Sonotone",
      subtitle: "CAC · oír, escuchar y captar conversaciones",
      body: "Escuchar ruidos, entender conversaciones a distancia o captar lo que alguien intenta decir sin que se note.",
      details: ["Puede enfrentarse a Nervio si el objetivo intenta evitar que lo detecten."]
    },
    telediarios: {
      title: "Telediarios",
      subtitle: "CAC · cultura general y actualidad",
      body: "Saber cosas de actualidad, sucesos, famosos, política, televisión y conocimiento acumulado de sobremesa."
    },
    batallitas: {
      title: "Batallitas",
      subtitle: "GRA · impresionar contando historias",
      body: "Soltar anécdotas, exagerar méritos, aburrir o convencer a alguien mediante recuerdos y grandes relatos personales.",
      details: ["Suele oponerse a Bemoles."]
    },
    discusion: {
      title: "Discusión",
      subtitle: "GRA · discutir, presionar y convencer",
      body: "Mantener una discusión, imponer criterio, regatear, protestar o convencer a base de insistencia.",
      details: ["Suele oponerse a Bemoles."]
    },
    cotilleo: {
      title: "Cotilleo",
      subtitle: "GRA · rumores e información social",
      body: "Sacar información, mover rumores, sonsacar secretos y entender quién sabe qué de quién.",
      details: ["Suele oponerse a Bemoles."]
    },
    salero: {
      title: "Salero",
      subtitle: "GRA · encanto, gracia y actuación",
      body: "Caer bien, improvisar, actuar, engañar con simpatía y convertir una situación tensa en algo manejable.",
      details: ["Suele oponerse a Bemoles."]
    },
    silbido: {
      title: "Silbido",
      subtitle: "GRA · llamar, distraer y hacerse notar",
      body: "Llamar la atención, comunicarse a distancia, distraer o marcar presencia con recursos sonoros y desparpajo."
    },
    archiperres: {
      title: "Archiperres",
      subtitle: "PRE · cachivaches, apaños y herramientas",
      body: "Usar, reparar, sabotear o improvisar aparatos, herramientas y cachivaches.",
      details: ["En persecuciones puede usarse contra el Nervio del oponente si encaja con la situación."]
    },
    cosasDelCampo: {
      title: "Cosas del campo",
      subtitle: "PRE · campo, animales y supervivencia práctica",
      body: "Conocimiento rural, animales, plantas, terreno, labores de campo y recursos prácticos fuera de la ciudad."
    },
    gimnasia: {
      title: "Gimnasia",
      subtitle: "PRE · moverse y esquivar",
      body: "Correr, saltar, trepar, esquivar, mantener el equilibrio y defenderse activamente.",
      details: ["Nervio = 3 x dados de Gimnasia + PRE.", "Defensa activa: Gimnasia contra dificultad 10 o 15 en disparos, con modificadores por crítico y apuntar."]
    },
    nietos: {
      title: "Nietos",
      subtitle: "PRE · tratar con juventud y familia",
      body: "Entender, manejar, perseguir o sobrevivir a niños, jóvenes, familiares y dinámicas de nietos.",
      details: ["Puede oponerse a Nervio cuando la situación requiere rapidez o control físico."]
    },
    petanca: {
      title: "Petanca",
      subtitle: "PRE · puntería y ataques a distancia",
      body: "Sirve para lanzar cosas, disparar, apuntar, calcular trayectorias y resolver ataques a distancia.",
      details: ["Ataques con armas de fuego: Petanca contra Nervio del objetivo.", "Apuntar con armas de fuego permite sacrificar dados para sumar 2D6 al daño por dado sacrificado.", "Los críticos doblan el daño."]
    },
    susLabores: {
      title: "Sus labores",
      subtitle: "PRE · maña fina y trabajos manuales",
      body: "Coser, manipular objetos pequeños, hacer trabajos delicados o resolver tareas manuales con paciencia y precisión.",
      details: ["Suele oponerse a Bemoles cuando la acción afecta a otra persona o requiere imponer el resultado."]
    },
    ingesta: {
      title: "Ingesta",
      subtitle: "ROB · comer, beber y resistir",
      body: "Aguantar comida, bebida, intoxicaciones, atracones y cualquier prueba en la que el cuerpo tenga que procesar lo ingerido.",
      details: ["Restorán: Ingesta dificultad 10 para recuperar 2 Salud, o 4 con crítico.", "Intoxicaciones: dificultad 10, 15 o 20 según gravedad."]
    },
    mulaParda: {
      title: "Mula parda",
      subtitle: "ROB · aguante bruto",
      body: "Resistir esfuerzos, golpes, cargas, empujones, cansancio y situaciones donde toca aguantar como se pueda."
    },
    tollinas: {
      title: "Tollinas",
      subtitle: "ROB · pelea cuerpo a cuerpo",
      body: "Golpear, forcejear, pelear sin armas o con armas cuerpo a cuerpo y resolver ataques físicos directos.",
      details: ["Ataques cuerpo a cuerpo: Tollinas contra Nervio del objetivo.", "Apuntar cuerpo a cuerpo permite sacrificar dados para sumar 1D6 al daño por dado sacrificado.", "Los críticos doblan el daño."]
    }
  },
  rule: {
    yayopoints: {
      title: "Yayopoints",
      subtitle: "Recursos de repetición, impulso y defensa",
      body: "Son el recurso especial de los jubilados para salvar tiradas falladas o forzar un empujón antes de tirar.",
      details: ["Tras fallar una tirada de habilidad o Jamacuco, 1 yayopoint permite repetir todos los dados que se quiera una sola vez.", "Antes de una tirada de habilidad, 1 yayopoint permite añadir +1D6. No sirve para añadir dado a Jamacuco.", "Cada yayopoint gastado en Bemoles o Nervio suma +3 durante un turno.", "En combate se pueden gastar hasta 3 yayopoints por golpe para sumar +1D6 de daño por punto, declarados antes de atacar.", "No se pueden usar para repetir si la tirada ya se está repitiendo por achaque."]
    },
    bemoles: {
      title: "Bemoles",
      subtitle: "Dificultad social y fuerza de personalidad",
      body: "Representa la fuerza de personalidad y el sexto sentido. Se usa como dificultad para muchas acciones sociales o mentales.",
      details: ["Bemoles = CAC + 7."]
    },
    nervio: {
      title: "Nervio",
      subtitle: "Dificultad física y defensa",
      body: "Representa vigor físico y capacidad para esquivar. Es la dificultad habitual para ataques, persecuciones y acciones contra alguien que se mueve o se defiende.",
      details: ["Nervio = 3 x dados de Gimnasia + PRE.", "Si está pillado por sorpresa, cuenta como Nervio/2 el primer turno."]
    },
    salud: {
      title: "Salud",
      subtitle: "Daño, penalizadores y umbrales",
      body: "La Salud mide cuánto daño aguanta el jubilado. Al bajar se aplican penalizadores de -1D, -2D o -3D y se cruzan umbrales de Jamacuco.",
      details: ["Al alcanzar o traspasar por primera vez 15, 10, 6, 3 o 1 Salud se solicita una tirada de Jamacuco.", "Cada umbral solo se tira una vez durante la aventura, aunque luego se cure y vuelva a bajarse.", "Si se cruzan varios umbrales de golpe, se resuelve una tirada por cada uno.", "Los penalizadores de Salud también afectan a Jamacuco.", "Si los penalizadores dejan la tirada por debajo de 1D, no se tiran dados y se compara solo el atributo o bono aplicable.", "A 1 punto de Salud, si sigue vivo, el jubilado cae inconsciente y necesita UCI."]
    },
    jamacuco: {
      title: "Jamacuco",
      subtitle: "Amenaza latente, no daño automático",
      body: "El valor de Jamacuco indica lo difícil que es que el jubilado aguante un susto físico o mental extremo. La tirada no se hace siempre: el Sr. Ministro la pide en momentos concretos.",
      details: ["Valor normal: 12 - ROB, salvo arquetipos con valor específico.", "Tirada: 3D6, modificado por penalizadores de Salud, para igualar o superar el valor de Jamacuco.", "Una vez por partida cada PJ debe hacer una tirada obligatoria en un momento dramáticamente intenso, salvo que el Sr. Ministro le exima por buen roleo.", "También se tira al alcanzar o traspasar por primera vez los umbrales de Salud 15, 10, 6, 3 y 1.", "Si se falla una tirada de Jamacuco, entonces sí: el PJ muere en ese momento."]
    },
    achaques: {
      title: "Achaques",
      subtitle: "Debilidades del jubilado",
      body: "El achaque mayor puede activarse sin límite para sufrir -1D y ganar 1 yayopoint. El achaque menor permite una repetición normal una vez por partida."
    },
    ataque: {
      title: "Ataque",
      subtitle: "Tollinas o Petanca contra Nervio",
      body: "Los ataques se resuelven con Tollinas o Petanca contra el Nervio del objetivo. Si impactan, se calcula daño y se deja en chat para confirmar defensa o aplicación.",
      details: ["Daño fijo: 2 sin armas, 4 con armas no de fuego, 7 con arma de fuego pequeña y 10 con arma de fuego grande, más ROB o PRE según el tipo.", "Apuntar permite sacrificar dados de la habilidad: +1D6 al daño en ataques sin armas de fuego, +2D6 con armas de fuego.", "Defensa activa: Gimnasia contra dificultad 10 en cuerpo a cuerpo o 15 contra disparos, +5 si el ataque fue crítico y +5 si fue apuntado.", "Pifia en defensa activa dobla el daño.", "Un 6 en el dado de iniciativa concede una acción extra."]
    },
    danoReglado: {
      title: "Otras cosas que hacen daño",
      subtitle: "Asfixia, caídas, venenos, cogorzas y similares",
      body: "El manual incluye fuentes de daño fuera del combate. El automatismo de Daño reglado prepara la tirada necesaria, calcula el daño y deja un botón de aplicación en el chat.",
      details: ["Asfixia: tras ROB + 5 turnos, Mula parda dificultad 15 o 3 Salud por turno.", "Caídas: 3 Salud por metro y Gimnasia dificultad 10 para evitar romperse la cadera.", "Venenos: Ingesta contra POT; daño menor si supera, daño mayor si falla.", "Cogorza: Ingesta dificultad 10, 15 o 20; si falla pierde 1, 3 o 5 Salud y sufre -1D salvo Jamacuco durante 6 horas.", "Hambre, sed, congelación y quemaduras se calculan con la cantidad indicada por el Sr. Ministro."]
    },
    empeoramiento: {
      title: "Empeoramiento",
      subtitle: "Experiencia de jubilado",
      body: "Si el PJ sobrevive al final de la aventura, rebaja en 1 punto uno de sus bonificadores de atributo que esté por encima de 0.",
      details: ["Los jubilados no mejoran atributos ni habilidades al terminar aventuras: empeoran."]
    }
  },
  section: {
    datos: {
      title: "Datos de la persona solicitante",
      subtitle: "Identidad del jubilado",
      body: "Información narrativa del PJ: jugador, nombre, lugar de nacimiento, años, antigua profesión, partido, familia y nietos."
    },
    arquetipos: {
      title: "Arquetipos",
      subtitle: "Plantillas completas de jubilado",
      body: "El selector aplica uno de los arquetipos del manual: ajusta atributos, habilidades, partido, talento, Yayopoints, Salud inicial y Jamacuco.",
      details: ["La Salud inicial se calcula al aplicarlo con el valor base del arquetipo + 1D6.", "Aplicar un arquetipo no cambia nombre, jugador, foto ni vida y milagros.", "El talento se crea también como objeto de tipo talento para poder consultarlo y mostrarlo en el chat."]
    },
    pertenencias: {
      title: "Pertenencias",
      subtitle: "Objetos, armas y talentos",
      body: "Aquí aparecen los objetos que tiene la ficha. Las armas atacan desde el botón de dado, los botiquines curan y los objetos equipables modifican estadísticas mientras estén equipados."
    }
  }
};

export function helpEntry(type, key) {
  return SHEET_HELP[type]?.[key] ?? null;
}
