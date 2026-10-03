# Cambios

## 2.1.0

### Nuevo
- **Accesibilidad**: icono en la cabecera de todas las ventanas del sistema, junto al de cerrar, con tamaño del texto (85–160 %), alto contraste, fuente de alta legibilidad, reducir movimiento y ayuda inmediata. Son ajustes de cada navegador y también están en *Configuración → Ajustes del sistema*.
- **Encuadre del retrato**: pulsa el retrato de la ficha y elige la zona de la imagen y el zoom (hasta 6×), con vista previa a tres tamaños, ratón, rueda y teclado. Se guarda en el personaje y se ve igual en la ficha, el panel del Sr. Ministro, el directorio de Actores y el *tracker* de combate.
- **Atributos con nombre completo y abreviatura**: «Gracejo GRA», «Cacumen CAC»…
- Los refuerzos de Bemoles/Nervio con yayopoints se ven como un `+3` con una ✕ para quitarlos.

### Corregido
- Los refuerzos de yayopoints solo caducaban al cambiar de asalto dentro de un combate; sin combate se quedaban activos para siempre. Ahora también caducan al terminar el combate y en el fin de sesión, y se pueden quitar a mano desde la ficha.

## 2.0.0

Reescritura completa sobre la API V2 de Foundry. **Los datos de los mundos existentes se conservan** (mismas rutas `system.*`; los modelos migran solos al cargar) y el módulo «Los Abuelos de la Justicia» sigue funcionando.

### Nuevo
- **Ficha de jubilado rediseñada**: vitales siempre visibles (Salud con barra por zonas y umbrales de Jamacuco, yayopoints como pastillas, Bemoles, Nervio, Jamacuco), habilidades agrupadas por atributo con tirada de un clic, pestañas Habilidades / Pertenencias / Vida / Ministro. Tema claro y oscuro, **modo compacto**, **candado de edición** y diseño adaptable a cualquier ancho.
- **Memoria de ventanas**: posición, tamaño (normal y compacto), pestaña y desplazamiento por usuario y mundo.
- **Panel del Sr. Ministro**: todos los jubilados de un vistazo, miedo, premiar yayopoints, nuevo día, fin de sesión y nueva aventura.
- **Achaques como dicta el manual**: los activa solo el Sr. Ministro sobre una tirada ya sacada (mayor: repite con −1D y entrega 1 yayopoint; menor: repite, una vez por sesión).
- **Tiradas**: acciones al alimón (+1D por ayudante, máx. 3), capotes (prestar/recibir dados), talentos de +3 (*Aparejador de raza*, *Oyssss*), *Ojo de Halcón*, dificultad automática contra Bemoles/Nervio del objetivo marcado.
- **Combate**: iniciativa integrada en el *tracker* (1D6 fijo + PRE + arma; un 6 = acción extra; sorprendido pierde la iniciativa), refuerzos de yayopoints y «reservar acción» que caducan al cambiar de asalto, sorpresa que dura el primer asalto, defensa activa con sus dificultades, daño pendiente de aplicar, y la barra de Salud del token pasa por las reglas (dispara los umbrales de Jamacuco).
- **Persecuciones** con las tres distancias, **miedo** con refuerzo de yayopoints previo, **cogorza** (−1D 6 h) y **cadera rota** como estados.
- **Curación** con las fuentes del manual separadas (siesta, masaje y balneario ya no son una sola) y control de «una vez al día» / «una vez por sesión» y de fuentes que no se acumulan.
- **Fin de sesión**: quita los yayopoints por encima de los iniciales, devuelve «Es que yo a tus años…», el achaque menor, las curaciones por sesión y los usos de talentos; avisa de quién no tiró su Jamacuco obligatoria.
- **Nueva aventura**: Salud ROB×2+10+1D6, yayopoints iniciales y umbrales a cero.
- **Talentos** con efecto propio: *Ooooommmmm*, *Sugar power*, *Hércules Farnesio*.
- **Asistente de creación** en V2: creación libre validada, 14 arquetipos o al azar; abre solo al crear un jubilado nuevo.
- **Compendios compilados** (arquetipos, hoja de ayuda y encartes, 100 achaques) en lugar de sembrarse en cada mundo.
- Ajuste *Yayopoint por crítico* (activable/desactivable).
- Publicación por etiqueta con GitHub Actions, comprobación estática, 15 pruebas de las reglas y `CHANGELOG`.

### Corregido
- Compatible con Foundry 13 (y preparado para 14): fuera `template.json`, hojas y diálogos V1 y `renderChatMessage`.
- Las habilidades «Discusión» e «Internés» (y varias dificultades) salían sin tilde.
- La defensa activa usaba la habilidad Petanca para decidir «arma de fuego»; ahora usa el tipo de ataque.
- Un fallo de Jamacuco marcaba al personaje como muerto aunque un yayopoint diera la vuelta a la tirada; ahora se revive.
- El tipo «Arquetipo» no tenía nombre traducido.
- Los objetos que usa «Los Abuelos de la Justicia» (`brazaletes`, `visor-bionico`) no activaban su efecto: se aceptan como alias.
- La versión de `system.json`, el mundo y los commits no coincidían.

### Cambios que conviene saber
- El título pasa a «MR- IMSERSO to the limit (YayoSystem)». El id no cambia.
- Se instala desde la **release** (`releases/latest/download/system.json`), no desde `main`.
- Los compendios antiguos de los mundos (`world.imserso-*`) ya no se actualizan; se pueden borrar.
- Se retira del repositorio la imagen de la ficha oficial (`ficha-jubilado-referencia.png`): no se usaba.
