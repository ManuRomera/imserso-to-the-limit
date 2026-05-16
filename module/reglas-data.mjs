const ACHAQUES = [
  "Afonía crónica.",
  "Agujero en el bolsillo.",
  "Alarma a deshora (se la puso el nieto y no la sabe quitar).",
  "Alergia a los bichitos del polvo.",
  "Aneurisma en el pecho.",
  "Anillo único (por su absurdo e incómodo tamaño).",
  "Artritis en las manos.",
  "Artrosis general.",
  "Ataques incontrolables de tos nerviosa.",
  "Baipás coronario.",
  "Barriga cervecera de tacto pétreo.",
  "Cadera de vibranium del chino.",
  "Cagalera crónica.",
  "Capillita (no puede pasar sin la misa de a ocho).",
  "Cataratas que ni las de Iguazú.",
  "Ciática.",
  "Chiste tardío (lo escuchó ayer, lo ha pillado hoy y ya no puede parar de contarlo).",
  "Codo de petanquista.",
  "Coprolalia (tendencia patológica a proferir obscenidades).",
  "Cordones siempre sueltos.",
  "Corto/a de vista.",
  "Diabetes.",
  "Dentadura postiza.",
  "Desdentado/a.",
  "Despistado/a.",
  "Digestiones muy pesadas.",
  "Dislexia.",
  "Dobladillo del pantalón suelto.",
  "Dolor crónico de espalda.",
  "Dolor permanente de cabeza.",
  "Dolor persistente en el brazo.",
  "Duro/a de oído.",
  "Duda existencial sobre el telefilm de ayer (que no puede parar de intentar aclarar).",
  "Enfisema.",
  "Erección repentina (¡esas pastillitas funcionan!).",
  "Eructitos recurrentes.",
  "Esas copitas de más siempre están pasando factura.",
  "Escozor repentino en la entrepierna (tanta colonia ahí abajo...).",
  "Exceso de Nivea en las manos.",
  "Falta de tono muscular.",
  "Fibromialgia.",
  "Flato crónico.",
  "Gases chungos.",
  "Gayumbos/bragas de rancio abolengo (con olores asociados).",
  "Golpes repentinos de tos cavernaria.",
  "Gota.",
  "Hebilla del cinturón pellizcona.",
  "Hipertensión.",
  "Hombro de madelman.",
  "Igualito pero igualito (muy cansino admirándose del supuesto parecido de la gente).",
  "Incontinencia urinaria.",
  "Insuficiencia respiratoria.",
  "Lagunas en la memoria.",
  "Latigazo cervical inesperado.",
  "Lengua zarrapastrosa.",
  "Lumbago.",
  "Manos sudorosas.",
  "Mareos repentinos.",
  "Más feo/a que Picio.",
  "Migrañas.",
  "Moqueo constante.",
  "Nalgas siamesas (se le pegan tanto la una a la otra que anda como Chiquito de la Calzada).",
  "Nieto insistente y pedigüeño (“Hola abuelo, mira, te llamo por...”).",
  "Olor acre muy intenso.",
  "Osteoporosis.",
  "Paquito el chocolatero recurrente en la cabeza.",
  "Pastillero con las letras borradas.",
  "Pechuga extreme.",
  "Pedo indeciso (igual sale por arriba que por abajo).",
  "Pelo del bigote en la lengua.",
  "Picores tremendos.",
  "Pitido agudo en el oído.",
  "Preocupación repentina por el nieto.",
  "Principio de Alzheimer.",
  "Principio de Parkinson.",
  "Prótesis de cadera.",
  "Reflujo.",
  "Restos de comida en rostro y ropa.",
  "Reúma.",
  "Risa floja.",
  "Rodilla artrósica.",
  "Rodilla inestable.",
  "Ronquera crónica.",
  "Ruidos intestinales.",
  "Selinidad en ciernes... “¿Eres tú mi nieto?”.",
  "Sin siesta no es persona humana.",
  "Sofocos menopáusicos (aún le duran).",
  "Sobrepeso.",
  "Sudor en el ojo.",
  "Supersticioso/a.",
  "Escupitajos al hablar.",
  "Tambaleo cangrejil (desequilibrio repentino que le hace retroceder para no caerse).",
  "Tembleque.",
  "Tic en la boca (mohín de labios poniéndolos como si diese un besito).",
  "Tortícolis constante.",
  "Traqueotomía realizada en 1996.",
  "Tobillo de Rey Emérito.",
  "“¡Tus muertos!” (lo suelta cada dos por tres, no lo puede evitar).",
  "Uñas de los pinreles retorcidas.",
  "Zapatos con tres tallas de más (para que duren)."
];

const AYUDA_PAGES = [
  {
    name: "Hoja de ayuda al jubilado",
    text: `HOJA DE AYUDA AL JUBILADO
Tiradas ▶ D6 que se tengan en la habilidad (1 a 3) + bonificador del atributo (0, +2, +4 o +6). Se añaden 3 puntos más si la acción se relaciona con la antigua profesión del jubilado.
Hay que igualar o superar la dificultad de acción impuesta por el Sr. Ministro (de 4 a 24 puntos).
Dificultad de acción media ▶ 8 puntos.
Se evitan las tiradas enfrentadas. Los conflictos entre personajes deben resolverse con una sola tirada del PJ contra el valor de Bemoles o de Nervio del extra.
Críticos ▶ Sacar 2 o 3 seises con los dados.
Pifias ▶ Sacar 1 en todos los D6 que se han tirado.
Mecánica “Es que yo a tus años...” ▶ Posibilidad de interrumpir la partida una vez por sesión para improvisar un flashback que justifique la adición de 1D extra a alguna tirada de habilidad o de Jamacuco.
Achaque mayor ▶ Se repite la tirada con 1D menos a cambio de 1 yayopoint. El Sr. Ministro lo puede activar tantas veces como quiera.
Achaque menor ▶ Se repite la tirada tal cual pero sin recibir ningún yayopoint a cambio. Solo se puede activar una vez por sesión.

YAYOPOINTS
1 yayopoint permite repetir todos los dados que se desee de una misma tirada (de habilidad o de Jamacuco) una sola vez, salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque.
1 yayopoint permite también añadir 1D6 a cualquier tirada de habilidad (no de Jamacuco), salvo que se esté repitiendo la tirada como consecuencia de la activación de un achaque. El gasto ha de declararse antes de la tirada.
Se pueden gastar tantos yayopoints como se quiera para aumentar durante un solo turno el valor de Bemoles o el de Nervio. El gasto ha de declararse antes de la tirada. Cada yayopoint empleado incrementa en 3 puntos el valor escogido, sin límite.
Se pueden gastar hasta 3 yayopoints por golpe para aumentar el daño (1D6 cada punto). El gasto ha de declararse antes de la tirada.
Achaques mayores, éxitos críticos y actuaciones memorables permiten hacerse con nuevos yayopoints. También el hecho de que exista algún peligro que aceche a los nietos de los PJ. Los yayopoints pueden sobrepasar su número inicial solo en el transcurso de la partida.`
  },
  {
    name: "Acciones y tollinas",
    text: `Acciones al alimón ▶ +1D a la tirada por personaje ayudante hasta un máximo de 3D6 extra.
Echar un capote ▶ Se presta 1D a la tirada de habilidad de cada personaje que se quiere ayudar, ya sea PJ o extra.

TOLLINAS
Iniciativa ▶ 1D6 fijo + bonificador de PRE al principio de cada pelea + posible bonificador por arma (+5 para armas de fuego y +2 para armas cuerpo a cuerpo). Los extras también tiran. Sacar un 6 en el dado de iniciativa otorga una acción extra en el primer turno de la pelea. La acción extra tendrá lugar justo a continuación de la primera acción del personaje.
Cogido por sorpresa ▶ imposibilidad de realizar ninguna acción y Nervio/2 en el primer turno de la pelea, en la que se pierde la iniciativa frente al oponente que nos ha sorprendido.
Se realiza una sola acción por turno (salvo que se haya sacado un 6 en el dado de iniciativa). La acción debe ser declarada al comienzo del turno en el orden inverso al de iniciativa.
Atacar ▶ Tollinas o Petanca vs. valor de Nervio del oponente.
Daño fijo: 2, 4, 7 o 10 puntos + bonificador de ROB o PRE + 1D6 por cada yayopoint gastado.
Los críticos doblan daño. Se puede apuntar: por cada dado sacrificado en la habilidad, el daño aumenta 1D6 (ataques no de armas de fuego) o 2D6 (ataques de armas de fuego).
Reservar acción ▶ +2 a Nervio e iniciativa ganada al extra que os ataca en este turno. No se puede cambiar por “defenderse activamente” en el transcurso del turno.
Defenderse activamente ▶ Tirada de Gimnasia contra dificultad 10 o 15 (+5 si es un crítico o un ataque apuntado, acumulable). Sacar una pifia multiplica el daño del ataque x 2.
Acción extra: se puede defender activamente una vez por turno si ya ha actuado antes en el turno.
Salir pitando ▶ Ataque de oportunidad del enemigo contra el Nervio/2 del personaje en el turno siguiente y posible persecución a continuación.
Tirada de Jamacuco ▶ 3D6 para igualar o superar el valor de Jamacuco del PJ. Si falla, muere.
Los penalizadores a las tiradas por pérdida de puntos de Salud indicados en la ficha de jubilado (de -1 a -3D) se aplican también a las tiradas de Jamacuco.
Tiradas de miedo ▶ El Sr. Ministro tira de 1 a 5D6 contra los Bemoles de los PJ. Si los iguala o supera, el PJ pierde tantos puntos de Salud como dados se hayan tirado.
Curación ▶ Se pueden recuperar puntos de Salud por varios motivos: unos son repetibles cada día de tiempo de juego (hospital, casa, mesa camilla, cura, buffet), mientras que otros solo se pueden emplear una sola vez en cada sesión (siesta, masaje, balneario, restorán, casquete).`
  }
];

const ENCARTES_PAGES = [
  {
    name: "Tiradas y dificultades",
    text: `Tiradas y Dificultades

Atributos
Cacumen
Indica lo listo que es el PJ, lo bien que piensa y razona, la agudeza de sus sentidos… De forma indirecta, lo firme y saludable que es su estado mental.
Gracejo
Carisma, capacidad para relacionarse, convencer, engañar…
Presteza
Agilidad, sigilo, destreza manual, puntería, reflejos, equilibrio…
Robustez
Fuerza física, constitución y salud.

Habilidades
Ambulatorio
Internés
Lentes progresivas
Memoria
Sonotone
Telediarios
Batallitas
Discusión
Cotilleo
Salero
Silbido
Archiperres
Cosas del campo
Gimnasia
Nietos
Petanca
Sus labores
Ingesta
Mula parda
Tollinas

Tiradas ▶ D6 que se tengan en la habilidad (1 a 3) + bonificador del atributo (0, +2, +4 o +6). Se añaden 3 puntos más si la acción se relaciona con la antigua profesión del jubilado.
Hay que igualar o superar la dificultad de acción impuesta por el Sr. Ministro (de 4 a 24 puntos). Dificultad de acción media ▶ 8 puntos.
Se evitan las tiradas enfrentadas. Los conflictos entre personajes deben resolverse con una sola tirada del PJ contra el valor de Bemoles o de Nervio del extra.
Críticos ▶ Sacar 2 o 3 seises con los dados.
Pifias ▶ Sacar 1 en todos los D6 que se han tirado.

Achaques
Achaque mayor ▶ Se repite la tirada con 1D menos a cambio de 1 yayopoint. El Sr. Ministro lo puede activar tantas veces como quiera.
Achaque menor ▶ Se repite la tirada tal cual pero sin recibir ningún yayopoint a cambio. Solo se puede activar una vez por sesión.

Yayopoints
► 1 yayopoint permite repetir todos los dados que se desee de una misma tirada (de habilidad o de Jamacuco) una sola vez, salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque.
► 1 yayopoint permite también añadir 1D6 a cualquier tirada de habilidad (no de Jamacuco), salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque. El gasto ha de declararse antes de la tirada.
► Se pueden gastar tantos yayopoints como se quiera para aumentar durante un solo turno los valores de Bemoles o Nervio. El gasto ha de declararse antes de la tirada. Cada yayopoint empleado incrementa en 3 puntos el valor escogido.
► Se pueden gastar hasta 3 yayopoints por golpe para aumentar el daño (1D6 cada punto). El gasto ha de declararse antes de la tirada.
► Éxitos críticos y actuaciones memorables permiten hacerse con nuevos yayopoints. También el hecho de que exista algún peligro que aceche a los nietos de los PJ.
► Los yayopoints pueden sobrepasar su número inicial solo en el transcurso de la partida.`
  },
  {
    name: "Peleas",
    text: `Peleas

Valores fijos
Bemoles: representa la fuerza de su personalidad y el sexto sentido.
Bonificador de CAC + 7
Nervio: representa su vigor físico y su capacidad para esquivar.
3 x número de dados que se tengan en Gimnasia + bonificados de PRE
Bemoles y Nervio: son los valores de dificultad que hay que superar o igualar para tener éxito en bastantes acciones de ciertas habilidades (generalmente extras).

Habilidades que se suelen oponer a los BEMOLES de un PJ
• Batallitas
• Discusión
• Cotilleo
• Salero
• Silbido
• Sus labores

Habilidades que se suelen oponer al NERVIO de un PJ
• Gimnasia
• Lentes progresiva
• Nietos
• Petanca
• Sonotone
• Tollinas

Iniciativa ▶ 1D6 + bonificador de PRE al principio de cada pelea + posible bonificador por arma (5 para armas de fuego y 2 para armas cuerpo a cuerpo). Los extras tiran también.
Sacar un 6 en el dado de iniciativa otorga una acción extra en el primer turno de la pelea. La acción extra tendrá lugar justo a continuación de la primera acción del personaje.
Cogido por sorpresa ▶ Imposibilidad de realizar ninguna acción.
Nervio/2 en el primer turno de la pelea.
Se realiza una sola acción por turno (salvo que se haya sacado un 6 en el dado de iniciativa). La acción debe ser declarada al comienzo del turno en el orden inverso al de iniciativa.
Atacar ▶ Tollinas o Petanca vs. valor de Nervio del oponente.

Daño fijo:
► Ataque sin arma 2 + bonificador de ROB
► Ataque con arma no de fuego 4 + bonificador de ROB
► Ataque con arma de fuego pequeña 7 + bonificador de PRE
► Ataque con arma de fuego grande 10 + bonificador de PRE
Todo ello + 1D6 por cada yayopoint gastado. Los críticos doblan daño.
Se puede apuntar: por cada dado sacrificado en la habilidad, el daño aumenta 1D6 (ataques no de armas de fuego) o 2D6 (ataques de armas de fuego).
Reservar acción ▶ +2 a Nervio en ese turno e iniciativa ganada al extra que os ataca en el siguiente turno.
Defenderse activamente ▶ Tirada de Gimnasia contra dificultad:
10: ataque cuerpo a cuerpo (+5 si el ataque obtuvo un crítico).
15: ataque con arma de fuego (+5 si el ataque obtuvo un crítico).
Sacar una pifia al defenderse activamente multiplica el daño del ataque x 2.
Acción extra: se puede defender activamente una vez por turno si ya ha actuado antes en el turno.
Salir pitando ▶ El oponente tiene un ataque de oportunidad vs. valor Nervio/2 del PJ.

Otras cosas que hacen daño
Asfixia ▶ Se aguantan ROB+5 turnos. Después, tirada de Mula parda a dificultad 15 cada turno hasta que se falle, momento en el que se empiezan a perder 3 puntos de Salud por turno.
Caídas ▶ 3 puntos de Salud por metro. Tirada de Gimnasia a dificultad 10 o rotura de cadera.
Congelación ▶ Al menos 1 punto de Salud por cada minuto de tiempo de juego.
Deslomes ▶ Tirada de Mula parda a dificultad 15 o pérdida de 3 puntos de Salud.
Envenenamientos ▶ Tirada de Ingesta a una dificultad = POT del veneno. Daño menor si se saca la tirada; mayor si se falla.
Hambre y sed ▶ 2 puntos de Salud por cada 6 horas sin beber y otros dos por 12 sin comer.
Intoxicaciones etílicas ▶ Tirada de Ingesta a dificultad 10, 15 o 20 o pérdida de 1, 3 o 5 puntos de Salud y penalizador de 1D a todas las tiradas salvo las de Jamacuco durante 6 horas.
Quemaduras ▶ 3 puntos de Salud por turno por fuego abierto o 1 por tomar el sol sin crema.`
  },
  {
    name: "Salud y otras reglas",
    text: `Salud

Puntos de Salud ▶ ROB x 2 + 10 + 1D6. Se determinan al comienzo de la partida. Cuando un PJ pierde todos sus puntos de Salud, muere indefectiblemente.
Los penalizadores a las tiradas por pérdida de puntos de Salud indicados en la ficha de jubilado (de -1 a -3D) también se aplican a las tiradas de Jamacuco.

Jamacuco
Valor de Jamacuco ▶ 12 – bonificador de ROB (o un número específico para PJ arquetípicos).
Tirada de Jamacuco ▶ 3D6 para igualar o superar el valor de Jamacuco del PJ. Si falla, muere.
Se tira por Jamacuco:
a) Una vez por partida de manera obligatoria en un momento dramáticamente intenso.
b) Al traspasar ciertos umbrales de pérdida de puntos de Salud (15, 10, 6, 3 y 1 puntos), tal y como se indica en la ficha de jubilado. Si luego se recuperan puntos de Salud, se pierden y de nuevo se traspasa el mismo umbral no hay que volver a tirar por Jamacuco.
c) Si se pasan dos umbrales de Jamacuco del tirón, se tira dos veces.

Otras reglas
Acciones al alimón ▶ +1D a la tirada por PJ ayudante hasta un máximo de 3D6.
Echar un capote ▶ Se presta 1D a la tirada de habilidad de cada personaje que se quiere ayudar, ya sea PJ o extra.
“Es que yo a tus años…” ▶ Posibilidad de interrumpir la partida una vez por sesión para improvisar un flashback que justifique la adición de 1D extra a alguna tirada de habilidad o de Jamacuco.
Tiradas de miedo ▶ El Sr. Ministro tira de 1 a 5D6 contra los Bemoles de los PJ. Si los iguala o supera, el PJ pierde tantos puntos de Salud como dados se hayan tirado.

Curación ▶ Se pueden recuperar puntos de Salud por varios motivos:
Repetibles cada día de tiempo de juego
► Pasar toda la jornada en un hospital 6 puntos
► Pasar toda la jornada en casa/hotel tranquilito 3 puntos
► Pasar la tarde jugando a las cartas o charlando con las piernas metidas debajo de la mesa camilla (no acumulable con lo anterior) 2 puntos
► Que alguien con un botiquín te haga una cura sacando una tirada de Ambulatorio a dificultad 10 2 puntos (con un crítico en la tirada 4 puntos)
► Imponerse al resto de jubilados en el buffet del desayuno del hotel sacando la mejor tirada de Ingesta frente al resto de PJ y por encima del Nervio del extra que lo tenga más alto 2 puntos
► Fumarse un porrete 1 punto

Una sola vez por sesión
► Echar una siesta reparadora (mínimo 3 horas de siesta) 1 punto
► Recibir un masaje 1 punto
► Tirarse un buen rato a remojo en el balneario 1 punto
► Comer o cenar abundantemente en un restorán sacando una tirada de Ingesta a dificultad 10 2 puntos (con un crítico en esta tirada 4 puntos)
► Echar un casquete con un ligue del viaje 3 puntos
► Echar una buena partida al bingo, al cinquillo, al dominó 1 punto

Persecuciones ▶ Tirada de Gimnasia o Archiperres contra el Nervio del oponente. Las distancias son corta, media y larga. Por debajo de corta suele comenzar una pelea. Los críticos otorgan una distancia extra, mientras que las pifias provocan accidentes.
Experiencia y empeoramiento de los PJ ▶ -1 a un atributo que esté por encima de 0 puntos, a elegir, tras cada aventura en la que el PJ sobreviva.`
  }
];

export function getAchaque(index) {
  return ACHAQUES[index - 1] ?? "";
}

export function rollAchaqueIndexes() {
  const menor = Math.floor(Math.random() * ACHAQUES.length) + 1;
  let mayor = Math.floor(Math.random() * ACHAQUES.length) + 1;
  if (ACHAQUES.length > 1) {
    while (mayor === menor) mayor = Math.floor(Math.random() * ACHAQUES.length) + 1;
  }
  return { menor, mayor };
}

export function buildAchaquesTables() {
  return [{
    name: "Lista de 100 achaques",
    img: "icons/svg/d20-grey.svg",
    formula: "1d100",
    replacement: true,
    displayRoll: true,
    description: "<p>Lista de 100 achaques del documento original. Usa <code>game.imserso.rollAchaques()</code> o el botón del diario de reglas para obtener achaque menor y achaque mayor a la vez.</p>",
    results: ACHAQUES.map((text, index) => ({
      type: 0,
      text,
      img: "icons/svg/d20-grey.svg",
      weight: 1,
      range: [index + 1, index + 1],
      drawn: false
    }))
  }];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textToHtml(text) {
  const normalized = String(text ?? "").trim();
  return normalized
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function textPage(name, html) {
  return { name, type: "text", title: { show: true, level: 1 }, text: { format: 1, content: html } };
}

function rulesArticle(title, body, extraClass = "") {
  return `<article class="ims-journal-adventure ims-rules-journal ${extraClass}"><h1>${escapeHtml(title)}</h1>${body}</article>`;
}

function achaquesListHtml() {
  const entries = ACHAQUES.map((text, index) => `<li><strong>${index + 1}.</strong> ${escapeHtml(text)}</li>`).join("");
  return `
    <div class="ims-rules-callout">
      <button type="button" class="ims-chat-action" data-ims-action="roll-achaques"><i class="fas fa-dice-d20"></i> Tirar achaque menor y mayor</button>
    </div>
    <ol class="ims-achaques-list">${entries}</ol>`;
}

function listItems(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function ruleCard(title, body, className = "") {
  return `<section class="ims-rule-card ${className}"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function termLine(term, text) {
  return `<p><strong>${escapeHtml(term)}</strong> ${escapeHtml(text)}</p>`;
}

function renderAyudaPage(name) {
  if (name === "Hoja de ayuda al jubilado") {
    return rulesArticle(name, `
      <div class="ims-rule-grid two">
        ${ruleCard("Tiradas", `
          ${termLine("Tirada ▶", "D6 que se tengan en la habilidad (1 a 3) + bonificador del atributo (0, +2, +4 o +6). Se añaden 3 puntos más si la acción se relaciona con la antigua profesión del jubilado.")}
          ${termLine("Dificultad ▶", "Hay que igualar o superar la dificultad de acción impuesta por el Sr. Ministro (de 4 a 24 puntos). Dificultad de acción media: 8 puntos.")}
          ${termLine("Tiradas enfrentadas ▶", "Se evitan. Los conflictos entre personajes deben resolverse con una sola tirada del PJ contra el valor de Bemoles o de Nervio del extra.")}
          ${termLine("Críticos ▶", "Sacar 2 o 3 seises con los dados.")}
          ${termLine("Pifias ▶", "Sacar 1 en todos los D6 que se han tirado.")}
        `)}
        ${ruleCard("Recursos del jubilado", `
          ${termLine("Es que yo a tus años... ▶", "Posibilidad de interrumpir la partida una vez por sesión para improvisar un flashback que justifique la adición de 1D extra a alguna tirada de habilidad o de Jamacuco.")}
          ${termLine("Achaque mayor ▶", "Se repite la tirada con 1D menos a cambio de 1 yayopoint. El Sr. Ministro lo puede activar tantas veces como quiera.")}
          ${termLine("Achaque menor ▶", "Se repite la tirada tal cual pero sin recibir ningún yayopoint a cambio. Solo se puede activar una vez por sesión.")}
        `)}
      </div>
      ${ruleCard("Yayopoints", listItems([
        "1 yayopoint permite repetir todos los dados que se desee de una misma tirada (de habilidad o de Jamacuco) una sola vez, salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque.",
        "1 yayopoint permite también añadir 1D6 a cualquier tirada de habilidad (no de Jamacuco), salvo que se esté repitiendo la tirada como consecuencia de la activación de un achaque. El gasto ha de declararse antes de la tirada.",
        "Se pueden gastar tantos yayopoints como se quiera para aumentar durante un solo turno el valor de Bemoles o el de Nervio. El gasto ha de declararse antes de la tirada. Cada yayopoint empleado incrementa en 3 puntos el valor escogido, sin límite.",
        "Se pueden gastar hasta 3 yayopoints por golpe para aumentar el daño (1D6 cada punto). El gasto ha de declararse antes de la tirada.",
        "Achaques mayores, éxitos críticos y actuaciones memorables permiten hacerse con nuevos yayopoints. También el hecho de que exista algún peligro que aceche a los nietos de los PJ. Los yayopoints pueden sobrepasar su número inicial solo en el transcurso de la partida."
      ]), "wide")}
    `, "ims-player-help");
  }

  return rulesArticle(name, `
    <div class="ims-rule-grid two">
      ${ruleCard("Acciones de apoyo", `
        ${termLine("Acciones al alimón ▶", "+1D a la tirada por personaje ayudante hasta un máximo de 3D6 extra.")}
        ${termLine("Echar un capote ▶", "Se presta 1D a la tirada de habilidad de cada personaje que se quiere ayudar, ya sea PJ o extra.")}
      `)}
      ${ruleCard("Jamacuco y miedo", `
        ${termLine("Tirada de Jamacuco ▶", "3D6 para igualar o superar el valor de Jamacuco del PJ. Si falla, muere.")}
        ${termLine("Penalizadores de Salud ▶", "Los penalizadores a las tiradas por pérdida de puntos de Salud indicados en la ficha de jubilado (de -1 a -3D) se aplican también a las tiradas de Jamacuco.")}
        ${termLine("Tiradas de miedo ▶", "El Sr. Ministro tira de 1 a 5D6 contra los Bemoles de los PJ. Si los iguala o supera, el PJ pierde tantos puntos de Salud como dados se hayan tirado.")}
      `)}
    </div>
    ${ruleCard("Tollinas", listItems([
      "Iniciativa ▶ 1D6 fijo + bonificador de PRE al principio de cada pelea + posible bonificador por arma (+5 para armas de fuego y +2 para armas cuerpo a cuerpo). Los extras también tiran. Sacar un 6 en el dado de iniciativa otorga una acción extra en el primer turno de la pelea.",
      "Cogido por sorpresa ▶ imposibilidad de realizar ninguna acción y Nervio/2 en el primer turno de la pelea, en la que se pierde la iniciativa frente al oponente que nos ha sorprendido.",
      "Se realiza una sola acción por turno (salvo que se haya sacado un 6 en el dado de iniciativa). La acción debe ser declarada al comienzo del turno en el orden inverso al de iniciativa.",
      "Atacar ▶ Tollinas o Petanca vs. valor de Nervio del oponente.",
      "Daño fijo: 2, 4, 7 o 10 puntos + bonificador de ROB o PRE + 1D6 por cada yayopoint gastado.",
      "Los críticos doblan daño. Se puede apuntar: por cada dado sacrificado en la habilidad, el daño aumenta 1D6 (ataques no de armas de fuego) o 2D6 (ataques de armas de fuego).",
      "Reservar acción ▶ +2 a Nervio e iniciativa ganada al extra que os ataca en este turno. No se puede cambiar por “defenderse activamente” en el transcurso del turno.",
      "Defenderse activamente ▶ Tirada de Gimnasia contra dificultad 10 o 15 (+5 si es un crítico o un ataque apuntado, acumulable). Sacar una pifia multiplica el daño del ataque x 2.",
      "Acción extra: se puede defender activamente una vez por turno si ya ha actuado antes en el turno.",
      "Salir pitando ▶ Ataque de oportunidad del enemigo contra el Nervio/2 del personaje en el turno siguiente y posible persecución a continuación.",
      "Curación ▶ Se pueden recuperar puntos de Salud por varios motivos: unos son repetibles cada día de tiempo de juego (hospital, casa, mesa camilla, cura, buffet), mientras que otros solo se pueden emplear una sola vez en cada sesión (siesta, masaje, balneario, restorán, casquete)."
    ]), "wide")}
  `, "ims-player-help");
}

function renderTiradasYDicultades() {
  const atributos = [
    ["Cacumen", "Indica lo listo que es el PJ, lo bien que piensa y razona, la agudeza de sus sentidos… De forma indirecta, lo firme y saludable que es su estado mental.", ["Ambulatorio", "Internés", "Lentes progresivas", "Memoria", "Sonotone", "Telediarios"]],
    ["Gracejo", "Carisma, capacidad para relacionarse, convencer, engañar…", ["Batallitas", "Discusión", "Cotilleo", "Salero", "Silbido"]],
    ["Presteza", "Agilidad, sigilo, destreza manual, puntería, reflejos, equilibrio…", ["Archiperres", "Cosas del campo", "Gimnasia", "Nietos", "Petanca", "Sus labores"]],
    ["Robustez", "Fuerza física, constitución y salud.", ["Ingesta", "Mula parda", "Tollinas"]]
  ];
  const attrCards = atributos.map(([name, desc, skills]) => `
    <section class="ims-attribute-card">
      <h2>${name}</h2>
      <p>${desc}</p>
      <h3>Habilidades</h3>
      ${listItems(skills)}
    </section>`).join("");
  return rulesArticle("Tiradas y Dificultades", `
    <div class="ims-rule-grid two">
      ${ruleCard("Cómo se tira", `
        ${termLine("Tirada ▶", "D6 que se tengan en la habilidad (1 a 3) + bonificador del atributo (0, +2, +4 o +6). Se añaden 3 puntos más si la acción se relaciona con la antigua profesión del jubilado.")}
        ${termLine("Dificultad ▶", "Hay que igualar o superar la dificultad de acción impuesta por el Sr. Ministro (de 4 a 24 puntos). Dificultad de acción media: 8 puntos.")}
        ${termLine("Conflictos ▶", "Se evitan las tiradas enfrentadas. Los conflictos entre personajes deben resolverse con una sola tirada del PJ contra el valor de Bemoles o de Nervio del extra.")}
      `)}
      ${ruleCard("Resultados especiales", `
        ${termLine("Críticos ▶", "Sacar 2 o 3 seises con los dados.")}
        ${termLine("Pifias ▶", "Sacar 1 en todos los D6 que se han tirado.")}
      `)}
    </div>
    <section class="ims-rule-section">
      <h2>Atributos y habilidades relacionadas</h2>
      <div class="ims-attribute-grid">${attrCards}</div>
    </section>
    <div class="ims-rule-grid two">
      ${ruleCard("Achaques", `
        ${termLine("Achaque mayor ▶", "Se repite la tirada con 1D menos a cambio de 1 yayopoint. El Sr. Ministro lo puede activar tantas veces como quiera.")}
        ${termLine("Achaque menor ▶", "Se repite la tirada tal cual pero sin recibir ningún yayopoint a cambio. Solo se puede activar una vez por sesión.")}
      `)}
      ${ruleCard("Yayopoints", listItems([
        "1 yayopoint permite repetir todos los dados que se desee de una misma tirada (de habilidad o de Jamacuco) una sola vez, salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque.",
        "1 yayopoint permite también añadir 1D6 a cualquier tirada de habilidad (no de Jamacuco), salvo que ya se esté repitiendo la tirada como consecuencia de la activación de un achaque. El gasto ha de declararse antes de la tirada.",
        "Se pueden gastar tantos yayopoints como se quiera para aumentar durante un solo turno los valores de Bemoles o Nervio. El gasto ha de declararse antes de la tirada. Cada yayopoint empleado incrementa en 3 puntos el valor escogido.",
        "Se pueden gastar hasta 3 yayopoints por golpe para aumentar el daño (1D6 cada punto). El gasto ha de declararse antes de la tirada.",
        "Éxitos críticos y actuaciones memorables permiten hacerse con nuevos yayopoints. También el hecho de que exista algún peligro que aceche a los nietos de los PJ.",
        "Los yayopoints pueden sobrepasar su número inicial solo en el transcurso de la partida."
      ]))}
    </div>
  `, "ims-gm-rules");
}

function renderPeleas() {
  return rulesArticle("Peleas", `
    <div class="ims-rule-grid two">
      ${ruleCard("Valores fijos", `
        ${termLine("Bemoles:", "representa la fuerza de su personalidad y el sexto sentido. Bonificador de CAC + 7.")}
        ${termLine("Nervio:", "representa su vigor físico y su capacidad para esquivar. 3 x número de dados que se tengan en Gimnasia + bonificados de PRE.")}
        ${termLine("Bemoles y Nervio:", "son los valores de dificultad que hay que superar o igualar para tener éxito en bastantes acciones de ciertas habilidades (generalmente extras).")}
      `)}
      ${ruleCard("Habilidades opuestas", `
        <div class="ims-opposed-grid">
          <div><h3>BEMOLES</h3>${listItems(["Batallitas", "Discusión", "Cotilleo", "Salero", "Silbido", "Sus labores"])}</div>
          <div><h3>NERVIO</h3>${listItems(["Gimnasia", "Lentes progresiva", "Nietos", "Petanca", "Sonotone", "Tollinas"])}</div>
        </div>
      `)}
    </div>
    ${ruleCard("Secuencia de pelea", listItems([
      "Iniciativa ▶ 1D6 + bonificador de PRE al principio de cada pelea + posible bonificador por arma (5 para armas de fuego y 2 para armas cuerpo a cuerpo). Los extras tiran también.",
      "Sacar un 6 en el dado de iniciativa otorga una acción extra en el primer turno de la pelea. La acción extra tendrá lugar justo a continuación de la primera acción del personaje.",
      "Cogido por sorpresa ▶ Imposibilidad de realizar ninguna acción. Nervio/2 en el primer turno de la pelea.",
      "Se realiza una sola acción por turno (salvo que se haya sacado un 6 en el dado de iniciativa). La acción debe ser declarada al comienzo del turno en el orden inverso al de iniciativa.",
      "Atacar ▶ Tollinas o Petanca vs. valor de Nervio del oponente.",
      "Reservar acción ▶ +2 a Nervio en ese turno e iniciativa ganada al extra que os ataca en el siguiente turno.",
      "Defenderse activamente ▶ Tirada de Gimnasia contra dificultad 10 en ataque cuerpo a cuerpo o 15 en ataque con arma de fuego (+5 si el ataque obtuvo un crítico). Sacar una pifia al defenderse activamente multiplica el daño del ataque x 2.",
      "Acción extra: se puede defender activamente una vez por turno si ya ha actuado antes en el turno.",
      "Salir pitando ▶ El oponente tiene un ataque de oportunidad vs. valor Nervio/2 del PJ."
    ]), "wide")}
    ${ruleCard("Daño fijo", `
      <table class="ims-rule-table">
        <thead><tr><th>Ataque</th><th>Daño</th></tr></thead>
        <tbody>
          <tr><td>Ataque sin arma</td><td>2 + bonificador de ROB</td></tr>
          <tr><td>Ataque con arma no de fuego</td><td>4 + bonificador de ROB</td></tr>
          <tr><td>Arma de fuego pequeña</td><td>7 + bonificador de PRE</td></tr>
          <tr><td>Arma de fuego grande</td><td>10 + bonificador de PRE</td></tr>
        </tbody>
      </table>
      ${termLine("Yayopoints ▶", "Todo ello + 1D6 por cada yayopoint gastado. Los críticos doblan daño.")}
      ${termLine("Apuntar ▶", "Por cada dado sacrificado en la habilidad, el daño aumenta 1D6 (ataques no de armas de fuego) o 2D6 (ataques de armas de fuego).")}
    `, "wide")}
    ${ruleCard("Otras cosas que hacen daño", listItems([
      "Asfixia ▶ Se aguantan ROB+5 turnos. Después, tirada de Mula parda a dificultad 15 cada turno hasta que se falle, momento en el que se empiezan a perder 3 puntos de Salud por turno.",
      "Caídas ▶ 3 puntos de Salud por metro. Tirada de Gimnasia a dificultad 10 o rotura de cadera.",
      "Congelación ▶ Al menos 1 punto de Salud por cada minuto de tiempo de juego.",
      "Deslomes ▶ Tirada de Mula parda a dificultad 15 o pérdida de 3 puntos de Salud.",
      "Envenenamientos ▶ Tirada de Ingesta a una dificultad = POT del veneno. Daño menor si se saca la tirada; mayor si se falla.",
      "Hambre y sed ▶ 2 puntos de Salud por cada 6 horas sin beber y otros dos por 12 sin comer.",
      "Intoxicaciones etílicas ▶ Tirada de Ingesta a dificultad 10, 15 o 20 o pérdida de 1, 3 o 5 puntos de Salud y penalizador de 1D a todas las tiradas salvo las de Jamacuco durante 6 horas.",
      "Quemaduras ▶ 3 puntos de Salud por turno por fuego abierto o 1 por tomar el sol sin crema."
    ]), "wide")}
  `, "ims-gm-rules");
}

function renderSaludYOtrasReglas() {
  return rulesArticle("Salud y otras reglas", `
    <div class="ims-rule-grid two">
      ${ruleCard("Salud", `
        ${termLine("Puntos de Salud ▶", "ROB x 2 + 10 + 1D6. Se determinan al comienzo de la partida. Cuando un PJ pierde todos sus puntos de Salud, muere indefectiblemente.")}
        ${termLine("Penalizadores ▶", "Los penalizadores a las tiradas por pérdida de puntos de Salud indicados en la ficha de jubilado (de -1 a -3D) también se aplican a las tiradas de Jamacuco.")}
      `)}
      ${ruleCard("Jamacuco", `
        ${termLine("Valor de Jamacuco ▶", "12 – bonificador de ROB (o un número específico para PJ arquetípicos).")}
        ${termLine("Tirada de Jamacuco ▶", "3D6 para igualar o superar el valor de Jamacuco del PJ. Si falla, muere.")}
        ${listItems([
          "Una vez por partida de manera obligatoria en un momento dramáticamente intenso.",
          "Al traspasar ciertos umbrales de pérdida de puntos de Salud (15, 10, 6, 3 y 1 puntos), tal y como se indica en la ficha de jubilado. Si luego se recuperan puntos de Salud, se pierden y de nuevo se traspasa el mismo umbral no hay que volver a tirar por Jamacuco.",
          "Si se pasan dos umbrales de Jamacuco del tirón, se tira dos veces."
        ])}
      `)}
    </div>
    ${ruleCard("Curación", `
      <table class="ims-rule-table">
        <thead><tr><th>Repetibles cada día de tiempo de juego</th><th>Salud</th></tr></thead>
        <tbody>
          <tr><td>Pasar toda la jornada en un hospital</td><td>6 puntos</td></tr>
          <tr><td>Pasar toda la jornada en casa/hotel tranquilito</td><td>3 puntos</td></tr>
          <tr><td>Pasar la tarde jugando a las cartas o charlando con las piernas metidas debajo de la mesa camilla (no acumulable con lo anterior)</td><td>2 puntos</td></tr>
          <tr><td>Que alguien con un botiquín te haga una cura sacando una tirada de Ambulatorio a dificultad 10</td><td>2 puntos (con un crítico en la tirada 4 puntos)</td></tr>
          <tr><td>Imponerse al resto de jubilados en el buffet del desayuno del hotel sacando la mejor tirada de Ingesta frente al resto de PJ y por encima del Nervio del extra que lo tenga más alto</td><td>2 puntos</td></tr>
          <tr><td>Fumarse un porrete</td><td>1 punto</td></tr>
        </tbody>
      </table>
      <table class="ims-rule-table">
        <thead><tr><th>Una sola vez por sesión</th><th>Salud</th></tr></thead>
        <tbody>
          <tr><td>Echar una siesta reparadora (mínimo 3 horas de siesta)</td><td>1 punto</td></tr>
          <tr><td>Recibir un masaje</td><td>1 punto</td></tr>
          <tr><td>Tirarse un buen rato a remojo en el balneario</td><td>1 punto</td></tr>
          <tr><td>Comer o cenar abundantemente en un restorán sacando una tirada de Ingesta a dificultad 10</td><td>2 puntos (con un crítico en esta tirada 4 puntos)</td></tr>
          <tr><td>Echar un casquete con un ligue del viaje</td><td>3 puntos</td></tr>
          <tr><td>Echar una buena partida al bingo, al cinquillo, al dominó</td><td>1 punto</td></tr>
        </tbody>
      </table>
    `, "wide")}
    ${ruleCard("Otras reglas", `
      ${termLine("Acciones al alimón ▶", "+1D a la tirada por PJ ayudante hasta un máximo de 3D6.")}
      ${termLine("Echar un capote ▶", "Se presta 1D a la tirada de habilidad de cada personaje que se quiere ayudar, ya sea PJ o extra.")}
      ${termLine("Es que yo a tus años… ▶", "Posibilidad de interrumpir la partida una vez por sesión para improvisar un flashback que justifique la adición de 1D extra a alguna tirada de habilidad o de Jamacuco.")}
      ${termLine("Tiradas de miedo ▶", "El Sr. Ministro tira de 1 a 5D6 contra los Bemoles de los PJ. Si los iguala o supera, el PJ pierde tantos puntos de Salud como dados se hayan tirado.")}
      ${termLine("Persecuciones ▶", "Tirada de Gimnasia o Archiperres contra el Nervio del oponente. Las distancias son corta, media y larga. Por debajo de corta suele comenzar una pelea. Los críticos otorgan una distancia extra, mientras que las pifias provocan accidentes.")}
      ${termLine("Experiencia y empeoramiento de los PJ ▶", "-1 a un atributo que esté por encima de 0 puntos, a elegir, tras cada aventura en la que el PJ sobreviva.")}
    `, "wide")}
  `, "ims-gm-rules");
}

function renderReglasPage(page) {
  if (page.name === "Tiradas y dificultades") return renderTiradasYDicultades();
  if (page.name === "Peleas") return renderPeleas();
  if (page.name === "Salud y otras reglas") return renderSaludYOtrasReglas();
  return rulesArticle(page.name, textToHtml(page.text), "ims-gm-rules");
}

export function buildReglasJournals() {
  return [
    {
      name: "Ayuda al jubilado",
      img: "icons/svg/book.svg",
      pages: AYUDA_PAGES.map((page) => textPage(page.name, renderAyudaPage(page.name)))
    },
    {
      name: "REGLAS · Encartes",
      img: "icons/svg/book.svg",
      ownership: { default: 0 },
      pages: ENCARTES_PAGES.map((page) => textPage(page.name, renderReglasPage(page)))
    },
    {
      name: "Lista de 100 achaques",
      img: "icons/svg/d20-grey.svg",
      pages: [
        textPage("Tirada de achaques", rulesArticle("Lista de 100 achaques", achaquesListHtml(), "ims-achaques-journal"))
      ]
    }
  ];
}
