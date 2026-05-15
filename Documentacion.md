# 🌸 Wifus contra Zombies — Documentación Técnica

> **Objetivo:** Este documento sirve como referencia antes de hacer cualquier cambio al proyecto. Leelo primero para entender qué hace cada archivo, qué funciones tiene, y dónde modificar cada aspecto del juego.

---

## 1. Visión General del Proyecto

| Concepto | Detalle |
|----------|---------|
| **Género** | Tower Defense (estilo Plants vs Zombies) |
| **Temática** | Anime / waifus con emojis y sprites 2D para personajes principales |
| **Tecnología** | HTML5 + CSS3 + JavaScript vanilla (sin frameworks, sin dependencias, sin build) |
| **Motor gráfico** | Canvas 2D (`getContext('2d')`) |
| **Responsive** | Sí — funciona en PC (click) y móvil (touch), landscape y portrait |
| **Idioma** | Español (código y nombres) |
| **Niveles** | Niveles con fases de ataque irregular y oleada grupal |
| **Torres** | 6 chicas (Stremer, Pistolera, Cazadora, Tanque, Doctora, Bomber) |
| **Requisitos** | Solo un navegador moderno. No necesita servidor local. |

---

## 2. Estructura de Archivos

```
girls-vs-zombies/
├── index.html              — Estructura HTML y pantallas del juego
├── style.css               — Estilos, tema oscuro azul eléctrico, responsive
│
├── config.js               — Constantes globales y paleta visual
├── chicas.js               — Definiciones de unidades jugables y carga de sprites
├── zombis.js               — Definiciones de enemigos
├── niveles.js              — Definiciones de niveles, fases y recompensas
├── nucleo.js               — Estado global (ESTADO) y referencias al DOM
├── particulas.js           — Creación de efectos visuales (partículas)
├── interfaz.js             — Pantallas, HUD, tienda, mensajes flotantes
├── tablero.js              — Canvas, celdas, colocación de chicas, input
├── oleadas.js              — Inicio de oleada, spawn, surge
├── motor.js                — Game loop y lógica de actualización
├── dibujo.js               — Renderizado completo del canvas
├── guardado.js             — Progreso local y opciones con localStorage
├── control.js              — Inicio/fin del juego, eventos de botones, init
│
├── game.js                 — ⚠️ Archivo original (ya no se usa, quedó como respaldo)
├── Documentacion.md        — Este archivo
├── Checklist.md            — Estado de cambios, pendientes y mejoras futuras
├── workspace.code-workspace — Configuración de VS Code
├── Icono/                  — Logo y favicon del juego
│   ├── WifusContraZombies.png
│   └── WifusContraZombies.ico
└── Personajes/             — Sprites de personajes
    └── Cazadora/
        ├── Cazadora.png
        ├── Cazadora_Idle.png
        ├── Cazadora_Apuntando.png
        └── Cazadora_Disparo.png
    └── Streamer/
        ├── Streamer.png
        └── Streamer_SS.png
    └── Pistolera/
        ├── Pistolera.png
        ├── Pistolera_Idle.png
        ├── Pistolera_Apuntando.png
        └── Pistolera_Disparo.png
    └── Tanque/
        ├── Tanque.png
        └── Tanque_Idle.png
    └── Doctora/
        ├── Doctora.png
        ├── Doctora_Idle.png
        └── Doctora_Curar.png
```

**No hay** `package.json`, ni `node_modules`, ni build tool. Todo es vanilla.

---

## 3. Orden de Carga y Dependencias

Los scripts se cargan en `index.html` en este orden (cada uno depende de los anteriores):

```
config.js      → Constantes y paleta, sin dependencias
chicas.js      → Usa config.js (COLUMNAS) y precarga sprites
zombis.js      → Datos puros de enemigos
niveles.js     → Datos puros de niveles
nucleo.js      → Usa config.js/chicas.js/niveles.js para construir estado inicial
particulas.js  → Usa ESTADO (definido en nucleo.js)
interfaz.js    → Usa ESTADO + referencias DOM (nucleo.js)
tablero.js     → Usa ESTADO + interfaz.js (mostrarFlotante, renderizarTienda, actualizarHUD)
oleadas.js     → Usa config.js + nucleo.js + tablero.js (celdaX) + interfaz.js
motor.js       → Usa nucleo.js + oleadas.js + particulas.js + interfaz.js + tablero.js (centroX, centroY)
dibujo.js      → Usa nucleo.js + tablero.js (celdaX, celdaY, centroX, centroY)
guardado.js    → Usa config.js (TOTAL_NIVELES) y localStorage del navegador
control.js     → Usa todo lo anterior — cablea botones, progreso local e inicia la app
```

---

## 4. index.html — Estructura de Pantallas

### 4.1. Arquitectura de pantallas

El juego usa un sistema de pantallas (screens) controlado por la clase CSS `.active`. Solo **una** pantalla está activa a la vez. La función `mostrarPantalla(id)` en `interfaz.js` se encarga de alternarlas.

### 4.2. Pantalla de Inicio (`#screen-start`)

| Elemento | `id` | Propósito |
|----------|------|-----------|
| Logo principal | `.game-title-logo` | Imagen `Icono/WifusContraZombies.png` |
| Botón Continuar/Iniciar | `#btn-play` | Inicia desde el nivel desbloqueado guardado en localStorage |
| Botón Niveles | `#btn-levels` | Abre `#screen-levels` con niveles desbloqueados/bloqueados |
| Botón Modos | `#btn-modes` | Abre `#screen-modes` y guarda el modo elegido |
| Botón Opciones | `#btn-options` | Abre `#screen-options` y guarda preferencias locales |
| Botón Cómo Jugar | `#btn-how` | Llama a `mostrarPantalla('screen-how')` |
| Estado local | `#menu-status` | Muestra oleada desbloqueada y modo actual |
| Créditos | `.credits` | Texto de versión/tema |

El favicon se declara en `index.html` con `Icono/WifusContraZombies.ico`.

### 4.2.1. Pantalla Niveles (`#screen-levels`)

`#level-grid` se rellena desde `control.js → renderizarNiveles()`. Usa `guardado.js` para leer `nivelDesbloqueado`; los niveles bloqueados quedan deshabilitados y los disponibles pueden iniciar partida desde ese nivel.

### 4.2.2. Pantalla Modos (`#screen-modes`)

Lista modos preparados (`historia`, `supervivencia`, `desafio`). Actualmente guardan la elección local para futuras reglas de partida; el gameplay activo sigue usando el flujo clásico de oleadas.

### 4.2.3. Pantalla Opciones (`#screen-options`)

Guarda preferencias locales con `localStorage`: efectos visuales y movimiento de menú. Incluye botón para reiniciar progreso local.

### 4.3. Pantalla Cómo Jugar (`#screen-how`)

Grid responsive de 6 tarjetas explicativas. Botón `#btn-back` vuelve al inicio.

### 4.4. Pantalla de Juego (`#screen-game`)

Se compone de 3 zonas:

#### HUD Superior (`#hud`)

| Elemento | `id` | Muestra | Se actualiza en |
|----------|------|---------|-----------------|
| Nivel/fase | `#wave-display` | `1-1` | `interfaz.js → actualizarHUD()` |
| HP del Nexo | `#nexo-hp` | `1` | `interfaz.js → actualizarHUD()` |
| Progreso de nivel | `#level-progress` | Barra con marcadores de ataque y banderas de oleada | `interfaz.js → renderizarProgresoNivel()` |
| Botón pausa | `#btn-pause` | ⏸ | `control.js` |

#### Panel inferior / Shop (`#shop`)

Barra inferior bajo el tablero. Aloja hasta 8 cartas horizontales, herramientas compactas y economía/oleada a la derecha.

| Elemento | `id` | Propósito |
|----------|------|-----------|
| Contenedor de cartas | `#shop-cards` | Poblado por `renderizarTienda()` en `interfaz.js` |
| Herramientas | `#tool-move`, `#tool-remove` | Recolocar o quitar wifus desde el tablero |
| Oro | `#gold-display` | Oro disponible, mostrado en el bloque derecho de economía |
| Texto hint | `#shop-hint` | "Selecciona una chica" o "Coloca: 🌸 Stremer" |
| Estado de fase | `#wave-status` | Ataque/oleada/listo |
| Botón de fase | `#btn-start-wave` | Elemento oculto de compatibilidad; las fases inician automáticamente |

#### Tablero (`#board-container`)

Contiene `<canvas id="game-canvas">`. Dimensiones responsivas calculadas en `redimensionarLienzo()` (`tablero.js`). Grid visible: 13 celdas de largo × 6 filas (`Nexo` + 12 columnas de tablero). Columna 0 = Nexo/línea azul con misiles de defensa por carril, Columna 12 = borde/spawn de zombis.

### 4.5. Pantalla Previa de Nivel (`#screen-level-briefing`)

Antes de entrar al tablero, muestra el nivel, carriles activos y tipos/cantidades de zombis del nivel. El jugador puede pulsar `Iniciar` para comenzar la primera fase automáticamente o `Salir` para volver al menú.

### 4.6. Pantalla de Pausa (`#screen-pause`)

| Botón | `id` | Acción |
|-------|------|--------|
| Continuar | `#btn-resume` | `ESTADO.pausado = false`, vuelve a juego |
| Menú | `#btn-menu-from-pause` | Vuelve a inicio |

### 4.7. Pantalla Game Over (`#screen-gameover`)

| Elemento | `id` | Acción |
|----------|------|--------|
| Mensaje oleada | `#go-wave-reached` | Se actualiza en `juegoPerdido()` (`control.js`) |
| Reintentar | `#btn-retry` | `iniciarJuego()` |
| Menú | `#btn-menu-go` | `mostrarPantalla('screen-start')` |

### 4.8. Pantalla Victoria (`#screen-win`)

| Botón | `id` | Acción |
|-------|------|--------|
| Jugar de nuevo | `#btn-play-again` | `iniciarJuego()` |
| Menú | `#btn-menu-win` | `mostrarPantalla('screen-start')` |

### 4.9. Mensaje Flotante (`#float-msg`)

Toast de notificaciones. Se muestra con `mostrarFlotante(msg, color)` en `interfaz.js`. Auto-oculta a los 1.8s.

### 4.10. Pantalla Colección (`#screen-collection`)

Se muestra al recoger una carta de recompensa al completar un nivel. `#collection-grid` lista las cartas desbloqueadas, `#collection-detail` muestra sus stats y `#btn-next-level` inicia el siguiente nivel si existe.

### 4.11. Cinemática de Recompensa (`#reward-cinematic`)

Overlay temporal que muestra la carta recogida en grande con fundido a negro antes de abrir la colección/cierre del nivel.

### 4.12. Fundido de Entrada (`#level-fade`)

Overlay negro temporal usado para revelar el tablero al iniciar niveles que saltan el briefing, como Nivel 1.

---

## 5. style.css — Sistema de Estilos

### 5.1. Variables CSS (`:root`)

| Variable | Color | Uso |
|----------|-------|-----|
| `--pink` | `#00e5ff` | Azul eléctrico principal (botones, bordes, títulos) |
| `--pink2` | `#66f6ff` | Azul eléctrico secundario |
| `--dark` | `#06142f` | Fondo principal |
| `--dark2` | `#0b1f45` | Fondo de tarjetas/paneles |
| `--gold` | `#ffd700` | Oro / monedas |
| `--green` | `#39e87a` | Verde (HP alto, victoria) |
| `--red` | `#ff3355` | Rojo (HP bajo, derrota) |
| `--blue` | `#4fc3f7` | Azul (Nexo) |
| `--purple` | `#7c4dff` | Violeta de acento |
| `--text` | `#e6f7ff` | Color de texto general |
| `--font-title` | `Georgia, serif` | Fuente para títulos |
| `--font-body` | `Segoe UI, sans-serif` | Fuente para cuerpo |

### 5.2. Clases CSS clave

| Clase | Efecto |
|-------|--------|
| `.screen.active` | Muestra una pantalla |
| `.shop-card.selected` | Borde azul eléctrico + glow cuando una chica está seleccionada |
| `.shop-card.disabled` | Opacidad reducida cuando no hay oro suficiente |
| `.overlay-box.bad` | Borde rojo para Game Over |
| `.overlay-box.good` | Borde verde para Victoria |
| `.float-msg.hidden` | Oculta el toast |

---

## 6. Módulos JS — Catálogo Completo

### 6.1. config.js — Constantes Globales

**Variables exportadas al scope global:**

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `COLUMNAS` | `12` | Columnas del tablero; con el Nexo son 13 celdas visibles de largo |
| `FILAS` | `6` | Filas del tablero |
| `COL_NEXO` | `0` | Columna del nexo (izquierda) |
| `COL_SPAWN` | `12` | Columna de spawn de zombis (derecha) |
| `TOTAL_NIVELES` | `2` | Número de niveles definidos actualmente |
| `TOTAL_OLEADAS` | alias de `TOTAL_NIVELES` | Compatibilidad temporal con textos/funciones antiguos |
| `PALETA` | Object | Colores usados en el Canvas |
**Funciones:**

| Función | Qué hace |
|---------|----------|
| `construirOleadas()` | Compatibilidad temporal con el sistema anterior; actualmente retorna `[]` |

### 6.1.1. chicas.js — Unidades Jugables

Define `DEF_CHICAS`, `CACHE_IMAGENES` y `cargarImagenJuego(src)`. También precarga iconos y sprites declarados en cada unidad.

**Estructura de cada chica en `DEF_CHICAS`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único |
| `nombre` | string | Nombre para mostrar |
| `emoji` | string | Emoji renderizado |
| `costo` | number | Costo en oro |
| `vida` | number | Puntos de vida |
| `danio` | number | Daño por disparo (0 = no ataca) |
| `alcance` | number | Alcance en celdas |
| `cadencia` | number | Acciones por segundo |
| `velProyectil` | number | Velocidad del proyectil (0 = sin proyectil) |
| `aoe` | number | Radio de daño en área (0 = sin AOE) |
| `oroIngreso` | number | (Solo Stremer) Oro generado por ciclo |
| `primerIntervaloOro` | number | (Solo Stremer) Segundos hasta la primera entrega de oro tras colocarla |
| `intervaloOro` | number | (Solo Stremer) Segundos entre generación de oro |
| `tiempoEspera` | number | Segundos de espera de la tarjeta tras colocar la unidad |
| `icono` | string | Ruta opcional al retrato usado en la tienda |
| `sprite` | object | Configuración opcional de spritesheet para Canvas |
| `spriteEstados` | object | Configuración opcional de spritesheets por estado (`idle`, `apuntando`, `disparo`) |
| `rafagaDisparos` | number | (Solo Cazadora) Disparos rápidos antes de entrar en cooldown |
| `intervaloRafaga` | number | (Solo Cazadora) Segundos entre disparos rápidos de la ráfaga |
| `cooldownRafaga` | number | (Solo Cazadora) Segundos de enfriamiento tras completar la ráfaga |
| `curacionPct` | number | (Solo Doctora) Porcentaje de vida máxima curado por tick |
| `color` | string | Color del aura/glow |
| `desc` | string | Texto de stats en la tienda |

**Tabla de chicas:**

| ID | Emoji | Nombre | Costo | Vida | Daño | Alcance | Cadencia | AOE | Especial |
|----|-------|--------|-------|------|------|---------|----------|-----|----------|
| `shooter` | 🌸 | Stremer | 50 | 80 | 0 | 0 | — | 0 | +250 oro: primera entrega a 10s, luego c/24s; espera de tarjeta 7.5s, icono y spritesheet 6×6 |
| `archer` | 🏹 | Pistolera | 750 | 60 | 1 | Todo el frente | 0.8/s | 0 | Sprites idle/apuntando/disparo; solo dispara hacia adelante |
| `mage` | 🔮 | Cazadora | 1000 | 55 | 30 | 3 | ráfaga x2 + 2s CD | 0 | Icono/sprites por estado; dispara 2 veces rápido a un solo objetivo |
| `tank` | 🛡️ | Tanque | 900 | 300 | 8 | 1.5 | 1.5/s | 0 | Icono y spritesheet idle 6×6 |
| `healer` | 💊 | Doctora | 800 | 35 | 0 | 1 | 0.5/s | 0 | Cura 10% de vida máxima cada 2s a una unidad herida justo delante o detrás; espera de tarjeta 30s; icono y sprites idle/curar 6×6 |
| `bomber` | 💣 | Bomber | 1200 | 65 | 50 | 2 | 0.35/s | 1.5 | AOE grande |

### 6.1.2. zombis.js — Enemigos

Define `TIPOS_ZOMBI`.

**Estructura de cada zombi en `TIPOS_ZOMBI`:**

| ID | Emoji | Nombre | Vida | Vel | Daño | Oro | Especial |
|----|-------|--------|------|-----|------|-----|----------|
| `basic` | 🧟 | Zombi | 10 | 0.28 | 10 | 0 | Muere con 10 disparos de Pistolera |
| `fast` | 🏃 | Corredor | 40 | 0.7 | 8 | 0 | — |
| `tank` | 🧟‍♂️ | Tanque | 200 | 0.25 | 20 | 0 | — |
| `healer` | 🩸 | CuraZombi | 80 | 0.45 | 12 | 0 | Aura cura +5 HP/s (radio 1.5) |
| `boss` | 👹 | JEFE | 600 | 0.18 | 40 | 0 | Solo oleada 10 |

### 6.1.3. niveles.js — Niveles y Fases

Define `NIVELES`.

**Estructura de niveles (`NIVELES`):**

Cada nivel define cartas, carriles activos y una lista de fases. Las fases pueden ser:
- `ataque`: zombis lentos, irregulares y progresivos.
- `oleada`: zombis agrupados con salida compacta.

```js
{
  id: 1,
  oroInicial: 450,
  carrilesActivos: [2, 3, 4],
  cartasIniciales: ['archer'],
  recompensaCarta: 'shooter',
  fases: [
    { tipo: 'ataque', grupos: [{ type:'basic', count:3, delay:3600 }] },
    { tipo: 'oleada', grupos: [{ type:'basic', count:4, delay:650 }] },
  ],
}
```

**Campos principales de cada nivel:**

| Campo | Tipo | Qué hace |
|-------|------|----------|
| `id` | number | Identificador del nivel. Debe ser único y coincide con el número que se usa para desbloquear/iniciar niveles. |
| `nombre` | string | Nombre visible del nivel en briefing, HUD o textos de estado. |
| `oroInicial` | number | Oro con el que inicia el jugador al entrar al nivel. Puede ser `0` si el tutorial entrega oro después. |
| `carrilesActivos` | Array<number> | Filas jugables del tablero. Usa índices desde `0`; por ejemplo, carriles visuales 3 y 5 son `fila` 2 y 4. Las filas no incluidas quedan bloqueadas. |
| `cartasIniciales` | Array<string> | IDs de unidades disponibles en la tienda durante ese nivel, como `archer`, `shooter` o `mage`. |
| `herramientasIniciales` | Array<string> | Herramientas disponibles al iniciar el nivel. Valores actuales: `recolocar` y `quitar`. Si está vacío, no aparecen herramientas. |
| `herramientasPostTutorial` | Array<string> | Herramientas que se desbloquean cuando termina una misión de tutorial. |
| `recompensaCarta` | string\|null | ID de la carta que cae del cielo al terminar el nivel. Si es `null`, no hay carta nueva. |
| `siguienteNivel` | number\|null | ID del nivel al que lleva el botón de siguiente nivel. Si es `null`, no hay siguiente nivel definido. |
| `unidadesIniciales` | Array<object> | Unidades ya colocadas al iniciar el nivel. Sirve para tutoriales o escenarios preparados. |
| `tutorial` | object\|null | Configuración de Capitana y misiones de tutorial. Puede bloquear tienda, herramientas o fases hasta cumplir una orden. |
| `fases` | Array<object> | Secuencia de ataques y oleadas del nivel. Se ejecutan en orden. |

**Campos de `unidadesIniciales`:**

| Campo | Tipo | Qué hace |
|-------|------|----------|
| `id` | string | ID de la unidad a colocar, tomado de `DEF_CHICAS`. |
| `col` | number | Columna inicial de la unidad. Debe estar dentro de una celda colocable. |
| `fila` | number | Fila inicial de la unidad, usando índice desde `0`. |
| `tutorialDestino` | object\|null | Destino obligatorio para tutorial de reubicación, con forma `{ col, fila }`. |

**Campos de `tutorial`:**

| Campo | Tipo | Qué hace |
|-------|------|----------|
| `tipo` | string | Tipo de tutorial. Actuales: `colocar`, `reubicar`, `misil`, `capitana`. |
| `bloqueaFases` | boolean | Indica que el nivel no debe iniciar ataques/oleadas hasta completar la misión. |
| `bloqueaTienda` | boolean | Impide seleccionar cartas de la tienda mientras el tutorial está activo. |
| `bloqueaHerramientas` | boolean | Usado como intención de diseño para niveles donde las herramientas deben estar apagadas; el control real se hace con `herramientasIniciales`. |
| `objetivo` | object | Para `tipo: "colocar"`. Define unidad y celda obligatoria: `{ unidad, col, fila }`. |
| `herramientaRequerida` | string | Para `tipo: "reubicar"`. Herramienta que el jugador debe pulsar, normalmente `recolocar`. |
| `filaAmenazada` | number | Para `tipo: "misil"`. Fila donde se colocan zombis de preludio cerca del nexo. |
| `zombiesAmenaza` | object | Para `tipo: "misil"`. Define amenaza de preludio: `{ type, count }`. |
| `intro` | string | Primer mensaje que dice Capitana al iniciar el tutorial. |
| `herramientaActiva` | string | Mensaje que aparece tras activar la herramienta requerida. |
| `completado` | string | Mensaje al completar la misión tutorial. |
| `completadoEspera` | boolean | Si es `true`, el mensaje de completado espera clic o Enter antes de continuar. |
| `despuesMisil` | string | Para `tipo: "misil"`. Mensaje después de que el misil defensivo se activa. |
| `oro` | number | Oro entregado por Capitana durante el tutorial. |
| `entreFases` | object | Eventos narrativos tras terminar una fase. La clave es el índice de fase terminada, por ejemplo `0`. |
| `finNivel` | object | Mensaje narrativo antes de cerrar el nivel o soltar recompensa. |

**Campos de cada fase:**

| Campo | Tipo | Qué hace |
|-------|------|----------|
| `tipo` | string | `ataque` o `oleada`. `ataque` usa aparición irregular; `oleada` usa grupos compactos. |
| `nombre` | string | Nombre descriptivo de la fase. |
| `grupos` | Array<object> | Lista de grupos de zombis que aparecerán en esa fase. |

**Campos de cada grupo de zombis:**

| Campo | Tipo | Qué hace |
|-------|------|----------|
| `type` | string | ID del zombi en `TIPOS_ZOMBI`, como `basic`, `fast`, `tank`, `healer` o `boss`. |
| `count` | number | Cantidad total de zombis del grupo. |
| `rows` | Array<number> | Filas posibles para spawnear. Si se omite, usa los carriles activos del nivel. |
| `row` | number | Fila fija para todo el grupo. Tiene prioridad sobre `rows`. |
| `delay` | number | Separación en milisegundos para oleadas o grupos compactos. |
| `minDelay` | number | Mínimo intervalo aleatorio en milisegundos para ataques irregulares. |
| `maxDelay` | number | Máximo intervalo aleatorio en milisegundos para ataques irregulares. |
| `burstChance` | number | Probabilidad de que salgan 2 zombis casi juntos en un ataque irregular. `0.1` es raro, `0.8` es muy frecuente. |

---

### 6.2. nucleo.js — Estado Global

**Variables exportadas:**

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `ESTADO` | Object | Estado global del juego |
| `lienzo` | Canvas | Elemento `<canvas>` |
| `ctx` | Context2D | Contexto 2D del canvas |
| `tarjetasTienda` | Element | Contenedor `#shop-cards` |
| `pistaTienda` | Element | Texto `#shop-hint` |
| `elEstadoOleada` | Element | `#wave-status` |
| `btnIniciarOleada` | Element | Botón `#btn-start-wave` |
| `elOro` | Element | `#gold-display` |
| `elVidaNexo` | Element | `#nexo-hp` |
| `elOleada` | Element | `#wave-display` |
| `elFlotante` | Element | `#float-msg` |

**Funciones:**

| Función | Qué hace |
|---------|----------|
| `iniciarEstado()` | Reinicia `ESTADO` a sus valores iniciales |

**Campos de `ESTADO`:**

| Campo | Tipo | Inicial | Descripción |
|-------|------|---------|-------------|
| `oro` | number | 500 | Oro disponible |
| `vidaNexo` | number | 1 | HP actual del nexo |
| `vidaMaxNexo` | number | 1 | HP máximo del nexo |
| `oleada` | number | 0 | Oleada actual |
| `oleadaActiva` | boolean | false | ¿Hay oleada en curso? |
| `oleadaCompleta` | boolean | false | ¿Oleada terminada? |
| `todasOleadasHechas` | boolean | false | ¿10 oleadas completadas? |
| `nivel` | number | 1 | Nivel actual |
| `nivelActual` | object\|null | null | Definición de nivel en curso |
| `faseIndice` | number | -1 | Índice de fase actual dentro del nivel |
| `faseActual` | object\|null | null | Ataque u oleada actual |
| `faseActiva` | boolean | false | ¿Hay ataque/oleada en curso? |
| `nivelCompleto` | boolean | false | ¿El nivel terminó? |
| `bajasNivel` | number | 0 | Zombis eliminados acumulados en el nivel actual |
| `zombisTotalesNivel` | number | 0 | Total de zombis definidos por todas las fases del nivel |
| `carrilesActivos` | Array<number> | todas las filas | Filas disponibles para colocar y spawnear zombis |
| `cartasDisponibles` | Array<string> | todas las chicas | Cartas disponibles en tienda para el nivel |
| `recompensaPendiente` | string\|null | null | Carta que se soltará al completar el nivel |
| `recompensaCaida` | object\|null | null | Carta visible cayendo en el tablero hasta ser recogida |
| `pausado` | boolean | false | ¿Juego en pausa? |
| `chicaSeleccionada` | string\|null | null | ID de chica seleccionada |
| `celdaPreviaColocacion` | object\|null | null | Celda bajo cursor/touch para dibujar fantasma de colocación (`{ col, fila, valida }`) |
| `celdaPreviaHerramienta` | object\|null | null | Celda bajo cursor/touch para previsualizar herramientas como quitar o recolocar (`{ col, fila, accion, tieneUnidad, valida }`) |
| `herramientaActiva` | string\|null | null | Herramienta de tablero activa (`recolocar` o `quitar`) |
| `chicaRecolocando` | object\|null | null | Wifu seleccionada como origen para recolocar |
| `chicaRecolocandoOrigen` | object\|null | null | Coordenadas originales de la wifu levantada para poder cancelar con ESC |
| `tutorial` | object\|null | null | Tutorial activo del nivel, dirigido por Capitana |
| `dialogoCapitanaContinuable` | object\|null | null | Diálogo de Capitana que espera clic o Enter para continuar |
| `herramientasDisponibles` | Array<string> | `['recolocar','quitar']` | Herramientas habilitadas para el nivel/tutorial actual |
| `chicas` | Array | [] | Chicas colocadas |
| `zombis` | Array | [] | Zombis activos |
| `proyectiles` | Array | [] | Proyectiles en vuelo |
| `misilesDefensa` | Array<boolean> | true por fila | Misil defensivo disponible en cada carril |
| `misilesActivos` | Array | [] | Animaciones de misiles defensivos disparados |
| `particulas` | Array | [] | Partículas visuales |
| `colaSpawn` | Array | [] | Zombis por spawnear |
| `bajasOleada` | number | 0 | Zombis eliminados en oleada actual |
| `surgeActivado` | boolean | false | ¿Ya se disparó la gran oleada? |
| `defOleadaActual` | object\|null | null | Definición de oleada en curso |
| `oleadas` | Array | construirOleadas() | Las 10 oleadas |
| `ultimoTiempo` | number | 0 | Timestamp del último frame |
| `anchoCelda` | number | 60 | Ancho de celda en píxeles |
| `altoCelda` | number | 60 | Alto de celda en píxeles |
| `offsetX` | number | 0 | Offset X para centrar grid |
| `offsetY` | number | 0 | Offset Y para centrar grid |

**Estructura de cada chica en `ESTADO.chicas[]`:**
```js
{ def,          // referencia a DEF_CHICAS[i]
  col, fila,    // posición en grid
  vida, vidaMax, // puntos de vida
  enfriamiento, // segundos hasta próxima acción
  disparosRafaga, // disparos restantes en ráfaga si aplica
  objetivo }    // zombi objetivo (o null)
```

**Estructura de cada zombi en `ESTADO.zombis[]`:**
```js
{ def,          // referencia a TIPOS_ZOMBI[i]
  x,            // posición X en píxeles
  fila,         // fila
  vida, vidaMax,// vida escalada
  danio,        // daño escalado
  enfAtaque,    // cooldown de ataque
  aturdido }    // tiempo restante de stun
```

**Estructura de cada proyectil en `ESTADO.proyectiles[]`:**
```js
{ x, y,         // posición actual
  destX, destY, // destino (actualizado con homing)
  objetivo,     // zombi objetivo
  danio, aoe,   // daño y radio de área
  velocidad,    // px/s
  color,        // color
  deChica }     // chica que disparó
```

**Estructura de cada partícula en `ESTADO.particulas[]`:**
```js
{ x, y, texto, color,  // posición, texto, color
  vx, vy,              // velocidad
  vida, vidaMax,       // tiempo de vida
  alpha,               // opacidad
  esCirculo,           // ¿anillo AOE?
  radio }              // radio si es anillo
```

---

### 6.3. particulas.js — Efectos Visuales

| Función | Parámetros | Qué hace |
|---------|------------|----------|
| `crearParticula(x, y, texto, color, flotarArriba)` | Posición, texto, color, bool | Crea partícula de texto flotante |
| `crearParticulaCirculo(x, y, radio, color)` | Posición, radio, color | Crea anillo expansivo para explosiones AOE |

---

### 6.4. interfaz.js — Pantallas, HUD y Tienda

| Función | Parámetros | Qué hace |
|---------|------------|----------|
| `mostrarPantalla(id)` | ID de pantalla | Cambia la pantalla activa |
| `mostrarFlotante(mensaje, color)` | Texto, color borde | Muestra toast temporal (1.8s) |
| `mostrarAlertaPeligro(mensaje)` | Texto | Muestra alerta grande roja sobre el tablero y pulso de peligro en pantalla |
| `actualizarHUD()` | — | Refresca oro, vida nexo y oleada en el HUD |
| `renderizarProgresoNivel()` | — | Dibuja barra central según `bajasNivel / zombisTotalesNivel` |
| `renderizarMarcadoresNivel(fases, totalZombis)` | Fases, total | Coloca marcadores en el punto acumulado donde termina cada fase |
| `renderizarMarcadorFase(fase, indice, acumulado, totalZombis)` | Fase, índice, acumulado, total | Retorna marcador HTML: punto para ataque, bandera para oleada |
| `actualizarHerramientas()` | — | Refresca estado visual de botones de herramientas y cursores del canvas |
| `mostrarCapitana(mensaje)` | Texto | Muestra el panel de diálogo de Capitana |
| `ocultarCapitana()` | — | Oculta el panel de Capitana |
| `renderizarTienda()` | — | Reconstruye cartas de la tienda desde `DEF_CHICAS`; muestra bloqueo por oro o espera; las cartas usan `pointerup` con guardia anti-doble disparo |
| `seleccionarChica(id)` | ID de chica | Selecciona/deselecciona chica; valida oro y espera de tarjeta |
| `seleccionarHerramienta(herramienta)` | ID de herramienta | Alterna los modos `recolocar` y `quitar`, cancelando selección de chica |

---

### 6.5. tablero.js — Canvas, Celdas e Input

| Función | Parámetros | Qué hace |
|---------|------------|----------|
| `redimensionarLienzo()` | — | Calcula tamaño de celdas y offsets para llenar el viewport |
| `celdaX(col)` | Columna | Retorna X en píxeles |
| `celdaY(fila)` | Fila | Retorna Y en píxeles |
| `centroX(col)` | Columna | Retorna centro X |
| `centroY(fila)` | Fila | Retorna centro Y |
| `pixelesACelda(px, py)` | Píxeles X, Y | Convierte a {col, fila} |
| `esColocacionValida(col, fila)` | Coordenadas | Verifica que la celda sea válida y esté libre |
| `obtenerChicaEnCelda(col, fila)` | Coordenadas | Devuelve la wifu colocada en esa celda o `null` |
| `actualizarPreviaColocacion(ex, ey)` | Coordenadas evento | Actualiza la celda fantasma al mover mouse/touch; verde si se puede colocar, rojo si no |
| `actualizarPreviaHerramienta(ex, ey)` | Coordenadas evento | Actualiza el objetivo bajo cursor para `quitar` y `recolocar`; en recolocación marca origen amarillo y destino verde/rojo |
| `limpiarPreviaColocacion()` | — | Borra la previsualización al salir del tablero o cancelar selección |
| `colocarChica(col, fila)` | Coordenadas | Coloca una chica en el grid solo si hay `oleadaActiva`; al colocar limpia la selección de tienda |
| `recolocarChica(col, fila)` | Coordenadas | Primer clic levanta una wifu; segundo clic la mueve a una celda libre siguiendo reglas normales de colocación |
| `tutorialPermiteColocacion(idUnidad, col, fila)` | ID y celda | Restringe colocación si el tutorial exige una casilla concreta |
| `tutorialPermiteReubicacion(chica, col, fila)` | Unidad y celda | Restringe reubicación si el tutorial exige un destino concreto |
| `cancelarRecolocacion()` | — | Cancela el modo de reubicación; si había unidad levantada, la devuelve a su celda original |
| `cancelarHerramientaActiva()` | — | Cancela con `Escape` la herramienta activa (`quitar` o `recolocar`) y limpia cursores/previsualizaciones |
| `quitarChica(col, fila)` | Coordenadas | Retira una wifu y devuelve 10% de su costo redondeado hacia abajo |
| `manejarClickLienzo(ex, ey)` | Coordenadas evento | Convierte click/touch a celda e intenta colocar chica o usar herramienta |

**Eventos registrados:**
- `lienzo.click` → `manejarClickLienzo`
- `lienzo.mousemove` → `actualizarPreviaColocacion`
- `lienzo.mouseleave` → `limpiarPreviaColocacion`
- `lienzo.touchmove` → `actualizarPreviaColocacion`
- `lienzo.touchend` → `manejarClickLienzo`
- `window.keydown` → `Escape` cancela la herramienta activa (`quitar` o `recolocar`)
- `window.resize` → `redimensionarLienzo()` (si el juego está activo)

---

### 6.6. oleadas.js — Manejo de Oleadas

| Función | Parámetros | Qué hace |
|---------|------------|----------|
| `iniciarOleada()` | — | Alias que inicia la siguiente fase del nivel |
| `iniciarSiguienteFase()` | — | Avanza a ataque/oleada siguiente y encola sus zombis |
| `actualizarBotonFase()` | — | Mantiene oculto/deshabilitado el botón antiguo y actualiza texto de estado |
| `encolarGruposFase(grupos, irregular)` | Grupos, bool | Agrega zombis a `colaSpawn`; irregular para ataques, compacto para oleadas |
| `numeroAleatorioEntre(min, max)` | ms min/max | Genera intervalos aleatorios para ataques irregulares |
| `elegirFilaSpawn(grupo)` | Grupo | Elige fila fija, de `rows` o de carriles activos |
| `aparecerZombi(defTipo, fila)` | Tipo, fila | Crea un zombi en la columna derecha con vida/daño escalados |

---

### 6.7. motor.js — Game Loop y Lógica

| Función | Qué hace |
|---------|----------|
| `cicloJuego(ts)` | Bucle principal con `requestAnimationFrame`. Calcula delta time. |
| `actualizar(dt)` | Orquesta: esperaTienda → misiles → colaSpawn → zombis → chicas → proyectiles → partículas → recompensa → check fase |
| `actualizarEnfriamientosTienda(dt)` | Descuenta el tiempo de espera de las tarjetas y refresca la tienda cuando cambia el contador |
| `actualizarMisilesDefensa(dt)` | Avanza y limpia animaciones de misiles defensivos |
| `actualizarColaSpawn(dt)` | Procesa la cola: spawnea zombis al cumplir su retraso |
| `actualizarZombis(dt)` | **Lógica zombi:** aura de cura, ataque melee a chicas, avance al nexo, disparo de misil por carril al llegar a media celda del Nexo, daño al Nexo solo al cruzar toda su celda, muerte y conteo de bajas para activar surge |
| `actualizarChicas(dt)` | **Lógica chicas:** Stremer genera oro solo con oleada activa. Doctora cura a una aliada herida justo delante o detrás en la misma fila. Cazadora dispara ráfaga de 2 tiros rápidos y luego entra en cooldown de 2s. Las demás buscan zombi más cercano en su fila y disparan. |
| `dispararProyectil(g, objetivo, desdeX, desdeY)` | Crea proyectil hacia el zombi objetivo |
| `dispararMisilDefensa(fila)` | Consume el misil de una fila, elimina zombis de ese carril y cuenta bajas |
| `actualizarProyectiles(dt)` | **Lógica proyectiles:** movimiento con homing, impacto single-target o AOE |
| `actualizarParticulas(dt)` | Actualiza vida, posición y alpha de partículas |
| `actualizarRecompensaNivel(dt)` | Anima la carta de recompensa cayendo |
| `soltarRecompensaNivel()` | Crea la carta de recompensa al completar un nivel |
| `recogerRecompensaNivel(px, py)` | Recoge la carta si el click/touch cae sobre ella |
| `completarNivel()` | Cierra el nivel, bloquea el botón de fase y suelta recompensa |
| `verificarOleadaCompleta()` | Detecta fin de fase cuando no quedan zombis ni spawns |

---

### 6.8. dibujo.js — Renderizado Canvas

| Función | Qué dibuja |
|---------|------------|
| `dibujar()` | Orquesta: cuadrícula → nexo → misiles → chicas → indicadores de herramienta → zombis → proyectiles → partículas → guía |
| `dibujarCuadricula()` | Celdas 10×6 alternando verde claro/oscuro |
| `dibujarNexo()` | Columna 0: fondo azul, línea azul de activación, 💎, barra de vida, texto "NEXO" |
| `dibujarMisilesDefensa()` | Iconos/indicadores de misil disponible por fila |
| `dibujarMisilesActivos()` | Animación breve del misil disparado por carril |
| `dibujarChicas()` | Cada chica: sombra, círculo de color, visual, barra de vida |
| `dibujarVisualChica()` | Dibuja spritesheet por estado o spritesheet simple si existe; si no, usa emoji como fallback |
| `dibujarZombis()` | Cada zombi: sombra elíptica, círculo, emoji, barra de vida |
| `dibujarBarraVida(x, y, w, h, pct)` | Barra genérica: fondo oscuro + verde/amarilla/roja según % |
| `dibujarProyectiles()` | Círculo pequeño con glow exterior |
| `dibujarParticulas()` | Texto flotante o anillos AOE expansivos |
| `dibujarGuiaColocacion()` | Tiñe celdas vacías con azul eléctrico semitransparente al tener chica seleccionada |
| `dibujarFantasmaColocacion()` | Dibuja previsualización de la unidad seleccionada: verde si la casilla es colocable, rojo si está ocupada/no válida |
| `dibujarIndicadorEliminar()` | Dibuja overlay rojo y X sobre la wifu bajo cursor cuando la herramienta `quitar` está activa |
| `dibujarIndicadorRecolocar()` | Dibuja overlay amarillo sobre la wifu elegible, origen de reubicación y fantasma verde/rojo del destino |
| `dibujarObjetivosTutorial()` | Dibuja casillas marcadas por la Capitana para colocar o reubicar unidades |

---

### 6.9. control.js — Control de Partida

| Función | Qué hace |
|---------|----------|
| `juegoPerdido()` | Pausa, muestra oleada alcanzada, va a Game Over |
| `mostrarVictoria()` | Pausa, va a pantalla de victoria |
| `iniciarJuego(nivelInicial)` | Reinicia estado desde un nivel y muestra el briefing previo |
| `comenzarNivelActual(opciones)` | Entra al tablero, inicia el game loop y lanza la primera fase; puede reproducir fundido de entrada |
| `reproducirFundidoEntradaNivel()` | Muestra `#level-fade` y lo desvanece para revelar el tablero |
| `crearUnidadesIniciales(nivel)` | Coloca unidades predefinidas del nivel antes de iniciar |
| `prepararTutorialNivel(nivel)` | Crea el estado tutorial del nivel |
| `iniciarTutorialNivel()` | Muestra la orden inicial de Capitana y bloquea fases si aplica |
| `notificarHerramientaTutorial(herramienta)` | Reacciona cuando el jugador pulsa una herramienta requerida |
| `completarTutorialNivel(mensaje)` | Cierra el tutorial, desbloquea herramientas post-tutorial y arranca fases |
| `mostrarDialogoCapitanaContinuable(mensaje, alContinuar, opciones)` | Muestra texto de Capitana y espera clic/Enter antes de ejecutar callback |
| `avanzarDialogoCapitana()` | Avanza el diálogo continuable activo |
| `mostrarDialogoEntreFases(faseIndiceTerminada, continuar)` | Busca evento narrativo entre fases y pausa la transición |
| `mostrarDialogoFinNivel(continuar)` | Busca evento narrativo de cierre y pausa el fin de nivel |
| `reproducirCinematicaCarta(cartaId, alTerminar)` | Muestra la carta grande con fade negro y ejecuta callback al terminar |
| `revisarTutorialColocacion(chica)` | Comprueba misión de colocar unidad |
| `lanzarAmenazaTutorialMisil(tutorial)` | Crea zombis de preludio cerca del nexo para demostrar el misil defensivo |
| `revisarTutorialMisil(fila)` | Detecta el disparo del misil del tutorial y muestra diálogos continuables |
| `revisarTutorialReubicacion()` | Comprueba misión de reubicar unidades |
| `mostrarBriefingNivel()` | Muestra carriles activos y zombis que apareceran en el nivel |
| `obtenerResumenZombisNivel(nivel)` | Agrupa los zombis del nivel para la pantalla previa |
| `contarZombisNivel(nivel)` | Cuenta los zombis totales definidos por las fases del nivel |
| `actualizarMenuPrincipal()` | Refresca etiqueta Continuar/Iniciar, estado local y animación de menú |
| `mostrarMenuPrincipal()` | Vuelve al menú y actualiza progreso visible |
| `renderizarNiveles()` | Crea botones de oleada según progreso desbloqueado |
| `mostrarNiveles()` | Abre la pantalla de niveles |
| `mostrarModos()` | Abre la pantalla de modos y marca el modo activo |
| `mostrarOpciones()` | Abre la pantalla de opciones y sincroniza checkboxes |

**Eventos de botones registrados:**

| Botón | Acción |
|-------|--------|
| `#btn-play` | `iniciarJuego()` |
| `#btn-levels` | Abre Niveles |
| `#btn-modes` | Abre Modos |
| `#btn-options` | Abre Opciones |
| `#btn-how` | `mostrarPantalla('screen-how')` |
| `#btn-back` | `mostrarPantalla('screen-start')` |
| `#btn-start-wave` | `iniciarOleada()` |
| `#tool-move` | `seleccionarHerramienta('recolocar')` |
| `#tool-remove` | `seleccionarHerramienta('quitar')` |
| `#btn-pause` | Pausa + pantalla de pausa |
| `#btn-resume` | Reanuda |
| `#btn-menu-from-pause` | Sale al menú |
| `#btn-retry` | `iniciarJuego()` |
| `#btn-menu-go` | `mostrarPantalla('screen-start')` |
| `#btn-play-again` | `iniciarJuego()` |
| `#btn-menu-win` | `mostrarPantalla('screen-start')` |

**Inicialización:** Al cargar `control.js`, se ejecuta `mostrarPantalla('screen-start')` para mostrar la pantalla de inicio.

### 6.10. guardado.js — Progreso Local

Usa `localStorage` con la clave `wifusContraZombies.progreso.v1`. No requiere backend, por lo que funciona en GitHub Pages y Firebase Hosting. El progreso queda vinculado al navegador y dominio del jugador.

| Función | Qué hace |
|---------|----------|
| `obtenerProgreso()` | Lee y normaliza progreso local |
| `guardarProgreso(progreso)` | Persiste progreso normalizado |
| `guardarProgresoOleada(oleadaCompletada)` | Desbloquea la siguiente oleada al completar una |
| `guardarModoJuego(modo)` | Guarda el modo elegido |
| `guardarOpcionJuego(nombre, valor)` | Guarda preferencias locales |
| `reiniciarProgresoLocal()` | Borra progreso y vuelve a valores base |

---

## 7. Flujo del Juego

```
Inicio → iniciarJuego()
  ├── iniciarEstado()            // Reinicia ESTADO
  ├── renderizarTienda()         // Puebla tienda
  ├── actualizarHerramientas()   // Limpia modo de herramientas
  ├── actualizarHUD()
  ├── mostrarPantalla('screen-game')
  ├── redimensionarLienzo()      // Ajusta canvas al viewport
  └── cicloJuego(ts)             // Inicia game loop

Game Loop (cada frame, ~60fps):
  ├── actualizar(dt)
  │   ├── actualizarColaSpawn()     // Spawnea zombis según sus delays
  │   ├── actualizarZombis()        // Mueve, ataca, cura, mata zombis
  │   ├── actualizarChicas()        // Oro pasivo con oleada activa, curación, disparos
  │   ├── actualizarProyectiles()   // Mueve proyectiles, aplica daño/AOE
  │   ├── actualizarParticulas()    // Actualiza efectos visuales
  │   └── verificarOleadaCompleta() // ¿Oleada terminada? → botón o victoria
  └── dibujar()
      ├── dibujarCuadricula()       // Césped 10×6
      ├── dibujarNexo()             // Columna azul + 💎
      ├── dibujarChicas()           // Chicas con barras de vida
      ├── dibujarZombis()           // Zombis con barras de vida
      ├── dibujarProyectiles()      // Proyectiles con glow
      ├── dibujarParticulas()       // Efectos visuales
      └── dibujarGuiaColocacion()   // Resalte de celdas disponibles
```

**Ciclo de un nivel:**
1. `iniciarJuego(nivel)` prepara estado. Nivel 1 entra directo con fundido; otros niveles muestran `screen-level-briefing`.
2. Si hay briefing, jugador pulsa `Iniciar` → `comenzarNivelActual()`.
3. La primera fase inicia automáticamente.
4. En ataques, los zombis salen lento e irregular; el Nivel 1 usa intervalos aleatorios de 2 a 6 segundos y raramente 2 zombis juntos.
5. Cada zombi eliminado incrementa `bajasNivel`, lo que avanza la barra central sin reiniciarse entre ataque y oleada.
6. Cuando muere el último zombi y no quedan spawns, `verificarOleadaCompleta()` cierra la fase.
7. Si queda otra fase, se inicia automáticamente tras una pausa corta.
8. Si terminó la última oleada del nivel, cae la carta de recompensa para recogerla.

---

## 8. Guía para Cambios Comunes

### 8.1. Agregar una nueva chica

1. **`chicas.js`** — Agregar objeto a `DEF_CHICAS` con todos los campos
2. Si tiene comportamiento especial, agregar lógica en `actualizarChicas()` en `motor.js`
3. La tienda se actualiza sola (`renderizarTienda()` itera `DEF_CHICAS`)

### 8.2. Agregar un nuevo tipo de zombi

1. **`zombis.js`** — Agregar objeto a `TIPOS_ZOMBI`
2. **`niveles.js`** — Agregarlo en los grupos de fases deseadas
3. Si tiene comportamiento especial (como CuraZombi), agregar lógica en `actualizarZombis()` en `motor.js`

### 8.3. Cambiar el balance (oro, HP, daño, costos)

| Qué cambiar | Dónde |
|-------------|-------|
| Estadísticas de chicas | `chicas.js` → `DEF_CHICAS` |
| Estadísticas de zombis | `zombis.js` → `TIPOS_ZOMBI` |
| Composición de niveles/fases | `niveles.js` → `NIVELES` |
| Escalamiento por oleada | `oleadas.js` → `aparecerZombi()` (multiplicadores 0.18 y 0.10) |
| Oro inicial | `nucleo.js` → `iniciarEstado()` (`oro: 500`) |
| Vida del Nexo | `nucleo.js` → `iniciarEstado()` (`vidaNexo: 1`) |

### 8.4. Cambiar la cantidad de oleadas

1. **`config.js`** — Cambiar `TOTAL_OLEADAS`
2. **`niveles.js`** — Agregar o quitar entradas en `NIVELES`

### 8.5. Cambiar el tamaño del tablero

1. **`config.js`** — Cambiar `COLUMNAS` y/o `FILAS`
2. El canvas se redimensiona automáticamente con `redimensionarLienzo()` en `tablero.js`

### 8.6. Cambiar colores

1. **Canvas:** `config.js` → `PALETA`
2. **HTML/CSS:** `style.css` → variables `:root`
3. **Colores de chicas/zombis:** `chicas.js` / `zombis.js` → campo `color`

### 8.7. Cambiar textos / idioma

1. **HTML estático:** `index.html`
2. **Textos dinámicos:** buscar `mostrarFlotante()`, `.textContent =` en todos los `.js`
3. **Nombres:** campos `nombre` y `desc` en `chicas.js` o `zombis.js`

### 8.8. Agregar una nueva pantalla

1. **`index.html`** — Agregar `<div class="screen" id="screen-xxx">`
2. **`interfaz.js`** — Usar `mostrarPantalla('screen-xxx')` para navegar
3. **`style.css`** — Estilos específicos

### 8.9. Reemplazar emojis por sprites

Streamer ya usa assets reales:
- `Personajes/Streamer/Streamer.png` como icono de tienda.
- `Personajes/Streamer/Streamer_SS.png` como spritesheet 6×6 (36 frames) en Canvas.

Pistolera usa assets reales por estado:
- `Personajes/Pistolera/Pistolera.png` como icono de tienda.
- `Personajes/Pistolera/Pistolera_Idle.png` como idle 6×6.
- `Personajes/Pistolera/Pistolera_Apuntando.png` como apuntado 6×6.
- `Personajes/Pistolera/Pistolera_Disparo.png` como disparo 6×6.

Cazadora usa assets reales por estado:
- `Personajes/Cazadora/Cazadora.png` como icono de tienda.
- `Personajes/Cazadora/Cazadora_Idle.png` como idle 6×6.
- `Personajes/Cazadora/Cazadora_Apuntando.png` como apuntado 6×6.
- `Personajes/Cazadora/Cazadora_Disparo.png` como disparo 6×6.

Tanque usa assets reales:
- `Personajes/Tanque/Tanque.png` como icono de tienda.
- `Personajes/Tanque/Tanque_Idle.png` como spritesheet idle 6×6.

Doctora usa assets reales:
- `Personajes/Doctora/Doctora.png` como icono de tienda.
- `Personajes/Doctora/Doctora_Idle.png` como idle 6×6.
- `Personajes/Doctora/Doctora_Curar.png` como animación de curación 6×6.

Para agregar sprites a otra chica:
1. `chicas.js` → agregar `icono`, `sprite` o `spriteEstados` a su definición en `DEF_CHICAS`.
2. `interfaz.js` → `renderizarVisualTienda()` ya usa `<img>` si existe `icono`.
3. `dibujo.js` → `dibujarVisualChica()` ya usa `ctx.drawImage()` si existe `sprite` o `spriteEstados`.
4. Mantener el `emoji` como fallback mientras la imagen carga o si falta el asset.

### 8.10. Agregar sonidos

No hay sistema de audio. Habría que agregar objetos `Audio` y reproducir en los eventos clave (disparo, muerte, daño, oleada).

---

## 9. Notas Técnicas

- **Sin dependencias externas:** Todo es vanilla JS. No necesita `npm install` ni servidor.
- **Ámbito global:** Todas las variables y funciones viven en `window`. Los módulos comparten el mismo namespace.
- **Canvas responsivo:** `redimensionarLienzo()` se llama al iniciar y en `window.resize`.
- **Delta time:** `dt` en segundos para movimiento independiente del framerate. Limitado a 0.1s para evitar saltos.
- **Pausa:** Solo detiene `actualizar()`, no `dibujar()`. El canvas sigue renderizando el último estado.
- **Touch y click:** Ambos llaman a `manejarClickLienzo()`. Touch usa `preventDefault()`. Las wifus solo pueden desplegarse durante una oleada activa. Si hay herramienta activa, el clic se usa para recolocar o quitar en vez de desplegar. `Escape` cancela la herramienta activa. La herramienta `recolocar` pinta en amarillo la unidad bajo cursor, levanta la wifu al primer clic, muestra un fantasma de destino verde/rojo, se cancela antes o después de levantar unidad, y sale del modo al colocarla.
- **Tutorial por niveles:** Capitana usa `#captain-dialog` para dar órdenes. El nivel puede declarar herramientas habilitadas, unidades iniciales, casillas objetivo y bloqueos. Nivel 1 enseña colocación con Pistolera, pausa entre ataque y oleada para regalar 1,000 de oro, y muestra cierre narrativo antes de terminar. Nivel 2 enseña reubicar dos Streamer prestadas, explica con clic/Enter que generan oro durante ataques/oleadas, desbloquea la herramienta quitar al completar la misión, y al final entrega la carta Streamer como recompensa con cinemática. Nivel 3 enseña que cada carril tiene un misil defensivo de un solo uso: el jugador observa cómo se pierde esa defensa, recibe 2,000 de oro, y al final desbloquea Cazadora. Nivel 4 abre todos los carriles y comienza con 1,000 de oro.
- **Alertas de peligro:** `#danger-alert` aparece al aproximarse o iniciar una oleada. Usa texto rojo grande, brillo y viñeta temporal para comunicar peligro sin quedar permanente sobre el tablero.
- **Nexo:** Tiene `1` HP. Un zombi solo le hace daño cuando cruza toda la celda del Nexo; el misil defensivo de carril sí se activa antes, cuando el zombi llega a la mitad de esa celda.
- **Doctora:** Tiene poca vida (`35`). Busca aliadas con `vida < vidaMax` solo en la misma fila, justo delante o detrás a máximo 1 casilla. No cura diagonales, arriba, abajo ni objetivos más lejanos. Cura 10% de la vida máxima del objetivo cada 2s y su tarjeta queda en espera 30s tras colocarla.
- **Pistolera:** Tiene alcance frontal completo (`COLUMNAS`) y solo busca zombis delante de ella en su misma fila.
- **Cazadora:** Usa `rafagaDisparos`, `intervaloRafaga` y `cooldownRafaga`: dispara 2 veces rápido a un solo objetivo y luego espera 2s antes de volver a disparar.
- **Stremer:** No ataca. Genera `oroIngreso` solo si `oleadaActiva` es true. La primera entrega ocurre tras `primerIntervaloOro`; las siguientes, cada `intervaloOro`. Su tarjeta queda bloqueada por `tiempoEspera` segundos tras colocarla.
- **CuraZombi:** Aplica `auraCuracion * dt` HP/s a zombis cercanos.
- **AOE:** El daño se reduce con la distancia: `danio × (1 - dist/(radio × 1.5))`.
- **Homing de proyectiles:** Actualizan su destino cada frame si el zombi sigue vivo.
- **Verificación de oleada:** Espera a que `surgeActivado` sea true, `colaSpawn` vacía, y `zombis` vacío.

---

*Última actualización: Mayo 2026 — v1.1 (modularizado)*
