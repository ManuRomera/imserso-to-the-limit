# Auditoría de IMSERSO to the limit (v1.0.5 → v2.0.0)

Fuente de las reglas: *Manual Imserso FINAL.pdf* (pp. 8-41). Fecha: 2026-10-03.

## 1. Problemas de la v1 y qué se hizo

| # | Problema | Gravedad | Estado en 2.0.0 |
|---|---|---|---|
| 1 | Hojas, diálogos y aplicación del creador en **V1** (`foundry.appv1`, `Dialog`, `Application`), `renderChatMessage`, `template.json`: no funciona en Foundry 14 y es obsoleto en 13 | Alta | Reescrito en V2 + DataModels + `compat.mjs` |
| 2 | `system.json` decía mínimo 11 pero el código usaba `foundry.appv1` (solo existe desde 13) | Alta | Mínimo 13, verificado 13.351 |
| 3 | Instalación desde `main` (manifiesto *raw* y zip de la rama): sin versiones, el zip lleva archivos de desarrollo | Media | Release por etiqueta con workflow |
| 4 | Compendios **sembrados en caliente** en cada mundo (`world.imserso-*`) y `packs: []`; la carpeta `packs/` iba vacía | Media | Compendios compilados (`npm run build`) |
| 5 | **Achaques mal modelados**: casillas que marca el jugador *antes* de tirar. El manual (p. 11): los activa solo el Ministro sobre una tirada ya sacada | Alta | Botones en la tarjeta, solo GM |
| 6 | Sin cierre de sesión: nada devolvía «Es que yo a tus años…», achaque menor, usos de talentos; los yayopoints sobrantes (p. 13) no se quitaban | Media | Fin de sesión / nueva aventura / nuevo día |
| 7 | Curación: siesta, masaje y balneario fundidos en una fuente; sin límite diario ni por sesión; buffet con dificultad inventada | Media | Fuentes separadas y con control (buffet: Ingesta 12 por defecto, editable) |
| 8 | Refuerzo de Bemoles/Nervio con yayopoints (p. 12): solo un mensaje; no cambiaba el valor, no caducaba y el miedo lo ignoraba | Media | Se aplica al valor, caduca al cambiar de asalto y cuenta en el miedo |
| 9 | Defensa activa: usaba «habilidad = Petanca» para saber si es arma de fuego (un canto rodado o un arco contaba como fuego) | Media | Usa el tipo de ataque |
| 10 | Iniciativa a mano (valor −999 al sorprendido, acción extra solo escrita en el chat, sin integrarse en el *tracker*); la fórmula de `system.json` ignoraba el arma | Media | `Combatant` propio, distintivos en el tracker |
| 11 | Efectos de un asalto (reservar acción, sorpresa) nunca caducaban | Media | Hook `updateCombat` |
| 12 | Etiquetas sin tilde («Discusion», «Internes», «Dificil», «pequena»), `es.json` sin el tipo Arquetipo | Baja | Corregido |
| 13 | Objetos del módulo con claves de automatismo que el sistema no conocía (`brazaletes`, `visor-bionico`) y claves por nombre (`traje-de-batman`) que no coincidían con las del selector | Media | Alias en `reglas.mjs` |
| 14 | Fallar el Jamacuco marcaba «muerto» de inmediato aunque un yayopoint pudiera repetirla | Media | Se revive si la repetición sale bien |
| 15 | Ficha de 860×680 calcada del impreso: hueco enorme, 28 casillas de Salud en rejilla, pestañas laterales, popover de ayuda a los 2,2 s, hacks de restauración de scroll | Media | Nuevo diseño (ver README) |
| 16 | Sin tests, sin CI, sin changelog; versiones incoherentes (`1.0.5` en el manifiesto, «1.0.4» en el commit, `1.0.0` en el mundo) | Baja | 15 pruebas, `check`, CI, CHANGELOG |
| 17 | `ficha-jubilado-referencia.png` (la ficha oficial) dentro del repositorio: identidad de producto | Baja | Retirada del repo |
| 18 | `primaryTokenAttribute: "salud.valor"`: sin barra de token | Baja | Barra de Salud que respeta las reglas |

Datos revisados contra el manual y **correctos**: los 14 arquetipos (atributos, 3D/2D, yayopoints, Bemoles, Nervio, Jamacuco, Salud base, talentos; ahora comprobado por test), fórmulas de Bemoles/Nervio/Jamacuco/Salud, penalizadores de Salud, umbrales 15-10-6-3-1, daños base, bonificadores de iniciativa y dificultades de defensa.

## 2. Cobertura de automatismos

✅ automatizado · 🟡 parcial (el sistema ayuda, decide una persona) · ⬜ no automatizable o sin sentido automatizarlo

| Regla (pp.) | Estado | Cómo |
|---|---|---|
| Tirada 1-3D6 + bonificador, profesión +3 (9) | ✅ | Diálogo + tarjeta |
| Dificultad frente a Bemoles/Nervio del objetivo (9, 19-21) | ✅ | Toma el valor del token marcado |
| Críticos y pifias (10) | ✅ | |
| Flasbas +1D, una vez por sesión (10) | ✅ | Casilla en el diálogo y en la ficha |
| Achaque mayor/menor (11-12) | ✅ | Botones GM en la tarjeta; menor una vez por sesión |
| Yayopoints: repetir dados, +1D previo, +3 Bemoles/Nervio, +1D6 daño (12-13) | ✅ | Repetición eligiendo dados; no vale tras un achaque ni dos veces |
| Ganar yayopoints: achaque mayor, crítico (13) | ✅ | Ajuste para el crítico |
| Ganar yayopoints: buena interpretación, nietos en peligro (13) | 🟡 | Botón «Premiar» del Ministro (es decisión suya) |
| Quitar sobrantes al acabar la sesión (13) | ✅ | Fin de sesión |
| Al alimón y capotes (14) | ✅ | Campos del diálogo |
| Iniciativa, 6 = acción extra, armas, sorpresa (21-22) | ✅ | Tracker |
| Desempate de iniciativa (22) | ✅ | Orden estable del tracker (equivale a tirar de nuevo) |
| Declarar acciones en orden inverso (22) | ⬜ | Mesa |
| Atacar, daño fijo + atributo + yayopoints, apuntar, crítico ×2 (22) | ✅ | |
| Reservar acción (23) | 🟡 | +2 Nervio automático; «actuar antes» y «no defenderse» lo vigila la mesa |
| Defensa activa y pifia ×2 (23) | ✅ | «Una vez por turno tras actuar» lo vigila la mesa 🟡 |
| Salir pitando (23) | ⬜ | Se resuelve como sorpresa marcando «Sorprendido» |
| Otras cosas que hacen daño (24-25) | ✅ | Diálogo por fuente; la asfixia por turno la cuenta la mesa 🟡 |
| Salud, penalizadores y umbrales de Jamacuco (26-27) | ✅ | |
| Jamacuco obligatoria una vez por partida (27) | 🟡 | Avisos en la ficha, el panel y el fin de sesión; la exención por roleo es del Ministro |
| Miedo (29) | ✅ | |
| Curación (30) | ✅ | |
| Persecuciones (30-31) | ✅ | Pifia = accidente: el Ministro decide el daño 🟡 |
| Empeoramiento (31) | ✅ | |
| Talentos de arquetipo | 🟡 | Mecánicos: meditar, dulce, proeza, +3, Ojo de Halcón, Carpe diem. Narrativos: gasta el uso y avisa en el chat |
| Creación libre y arquetipos (32-41) | ✅ | Asistente con validación |

**Pendiente razonable para una 2.1** (no implementado a propósito): contador de turnos de asfixia, «salir pitando» como botón con ataque de oportunidad, importar arquetipos arrastrando desde el compendio con asistente.

## 3. Notas para actualizar el módulo *Los Abuelos de la Justicia*

El módulo escribe directamente los datos del sistema, así que **conservar las rutas** era obligatorio y se ha hecho. Comprobado: actores `jubilado`/`extra` y objetos con la forma exacta de `pjSystem`, `extraSystem` e `itemSystem` se crean sin errores ni avisos.

Cambios recomendados en el módulo:

1. `module.json`: `compatibility` mínimo 13 (verificado 13.351) y sin `maximum: 13`; `relationships.systems[imserso-to-the-limit].compatibility.minimum: "2.0.0"`; manifiesto y descarga desde **releases**, no desde `main`.
2. `scripts/installer.js` usa `Dialog` (V1) en la ventana de instalación: pasar a `DialogV2`.
3. Automatismos de objetos: el sistema entiende `botiquin`, `traje-superman`, `traje-batman`, `traje-flash`, `traje-wonder-woman`, `traje-cyborg`, `visor-de-cyborg`, `brazaletes-de-wonder-woman`, y acepta como alias `brazaletes`, `visor-bionico`, `punteria`, `defensa`. **No** entiende `cachivache`, `la-bane-dopada` ni `flashback` (los objetos se crean, pero «usar» solo los muestra en el chat): o se resuelven en el módulo o se añaden al sistema.
4. Los actores se crean con `prototypeToken.bar1.attribute: null`: el sistema ofrece barra de Salud, y conviene poner `"salud"`.
5. El campo `modificadores` de los objetos no lo usa el sistema (se conserva).
6. El objeto «Es que yo a tus años...» duplica lo que ya hace el sistema (casilla en ficha y en cada tirada): se puede retirar.
7. `itemSystem` pone `uso: categoria`; el sistema usa ese texto como último recurso para deducir el automatismo (como antes), así que una categoría «Curación» sin `automatismo` se trata como botiquín.
8. La rama `ysystem3-srd` no se ha tocado.
9. Las macros del módulo no dependen de nada del sistema. `game.imserso.rollSkill/rollJamacuco/openCharacterCreator/rollAchaques/rollMiedo` siguen existiendo con los mismos nombres.

## 4. Lo que no se ha podido comprobar

- Foundry 14: la instalación local es la 13.351. Las diferencias conocidas (modo de mensajes, hooks de chat) están enrutadas en `compat.mjs`, pero no se han ejecutado en 14.
- Partidas con varios jugadores reales: se comprobó el flujo como GM; el reenvío por socket de tarjetas ajenas está escrito pero no probado con un segundo cliente.
