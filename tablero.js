/* =====================================================
   WIFUS contra ZOMBIES — tablero.js
   Dimensiones del canvas, ayudantes de celdas,
   colocación de chicas e input del jugador
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// REDIMENSIONAR CANVAS AL TAMAÑO DEL CONTENEDOR
// ──────────────────────────────────────────────
function redimensionarLienzo() {
  const contenedor = document.getElementById('board-container');
  const rect = contenedor.getBoundingClientRect();
  const anchoCont = Math.floor(rect.width)  || contenedor.offsetWidth  || 600;
  const altoCont  = Math.floor(rect.height) || contenedor.offsetHeight || 400;

  const tamCelda = Math.max(10, Math.floor(Math.min(anchoCont / (COLUMNAS + 1), altoCont / FILAS)));
  ESTADO.anchoCelda = tamCelda;
  ESTADO.altoCelda  = tamCelda;
  ESTADO.offsetX = Math.floor((anchoCont - tamCelda * (COLUMNAS + 1)) / 2);
  ESTADO.offsetY = Math.floor((altoCont  - tamCelda * FILAS) / 2);

  lienzo.width  = anchoCont;
  lienzo.height = altoCont;
}

// ──────────────────────────────────────────────
// AYUDANTES DE COORDENADAS DE CELDA
// ──────────────────────────────────────────────
function celdaX(col) { return ESTADO.offsetX + col * ESTADO.anchoCelda; }
function celdaY(fila) { return ESTADO.offsetY + fila * ESTADO.altoCelda; }
function centroX(col) { return celdaX(col) + ESTADO.anchoCelda / 2; }
function centroY(fila) { return celdaY(fila) + ESTADO.altoCelda / 2; }

// ──────────────────────────────────────────────
// CONVERTIR PÍXELES A COORDENADAS DE CELDA
// ──────────────────────────────────────────────
function pixelesACelda(px, py) {
  const col = Math.floor((px - ESTADO.offsetX) / ESTADO.anchoCelda);
  const fila = Math.floor((py - ESTADO.offsetY) / ESTADO.altoCelda);
  return { col, fila };
}

// ──────────────────────────────────────────────
// VERIFICAR SI UNA CELDA ES VÁLIDA PARA COLOCAR
// ──────────────────────────────────────────────
function esColocacionValida(col, fila) {
  if (col <= 0 || col >= COLUMNAS) return false;
  if (fila < 0 || fila >= FILAS) return false;
  return !ESTADO.chicas.some(g => g.col === col && g.fila === fila);
}

function obtenerChicaEnCelda(col, fila) {
  return ESTADO.chicas.find(g => g.col === col && g.fila === fila) || null;
}

// ──────────────────────────────────────────────
// COLOCAR UNA CHICA EN EL TABLERO
// ──────────────────────────────────────────────
function colocarChica(col, fila) {
  if (!ESTADO.chicaSeleccionada) return;
  const def = DEF_CHICAS.find(d => d.id === ESTADO.chicaSeleccionada);
  if (!def) return;
  if (!ESTADO.oleadaActiva) { mostrarFlotante('⚠️ Inicia una oleada para desplegar wifus', '#ffd700'); return; }
  const espera = obtenerEsperaTienda(def.id);
  if (espera > 0) { mostrarFlotante(`⏳ Espera ${formatearEsperaTienda(espera)}`, def.color); return; }
  if (ESTADO.oro < def.costo) { mostrarFlotante('💰 ¡Oro insuficiente!', '#ff3355'); return; }
  if (!esColocacionValida(col, fila)) { mostrarFlotante('❌ Celda no válida'); return; }

  ESTADO.chicas.push({
    def,
    col, fila,
    vida     : def.vida,
    vidaMax  : def.vida,
    enfriamiento: def.primerIntervaloOro ?? def.intervaloOro ?? 0,
    objetivo : null,
    animacion: 'idle',
    disparoAnim: 0,
    disparosRafaga: def.rafagaDisparos || 1,
  });
  ESTADO.oro -= def.costo;
  if (def.tiempoEspera > 0) ESTADO.enfriamientosTienda[def.id] = def.tiempoEspera;
  ESTADO.chicaSeleccionada = null;
  pistaTienda.textContent = 'Selecciona una chica';
  mostrarFlotante(`${def.emoji} ¡${def.nombre} colocada!`, def.color);
  renderizarTienda();
  actualizarHUD();
}

function recolocarChica(col, fila) {
  if (!ESTADO.chicaRecolocando) {
    const chica = obtenerChicaEnCelda(col, fila);
    if (!chica) { mostrarFlotante('↔ Elige una wifu para mover'); return; }
    ESTADO.chicaRecolocando = chica;
    ESTADO.chicaRecolocandoOrigen = { col: chica.col, fila: chica.fila };
    pistaTienda.textContent = `Mueve a: ${chica.def.emoji} ${chica.def.nombre}`;
    mostrarFlotante('↔ Elige la nueva celda', chica.def.color);
    actualizarHerramientas();
    return;
  }

  if (!ESTADO.chicas.includes(ESTADO.chicaRecolocando)) {
    ESTADO.chicaRecolocando = null;
    ESTADO.chicaRecolocandoOrigen = null;
    pistaTienda.textContent = 'Elige una wifu para mover';
    mostrarFlotante('↔ Esa wifu ya no está en el tablero');
    actualizarHerramientas();
    return;
  }

  if (ESTADO.chicaRecolocando.col === col && ESTADO.chicaRecolocando.fila === fila) {
    ESTADO.chicaRecolocando = null;
    ESTADO.chicaRecolocandoOrigen = null;
    ESTADO.herramientaActiva = null;
    pistaTienda.textContent = 'Elige una wifu para mover';
    mostrarFlotante('↔ Recolocación cancelada');
    ESTADO.celdaPreviaHerramienta = null;
    actualizarHerramientas();
    return;
  }

  if (!esColocacionValida(col, fila)) { mostrarFlotante('❌ Celda no válida'); return; }
  ESTADO.chicaRecolocando.col = col;
  ESTADO.chicaRecolocando.fila = fila;
  mostrarFlotante('↔ Wifu recolocada', ESTADO.chicaRecolocando.def.color);
  ESTADO.chicaRecolocando = null;
  ESTADO.chicaRecolocandoOrigen = null;
  ESTADO.herramientaActiva = null;
  pistaTienda.textContent = 'Selecciona una chica';
  ESTADO.celdaPreviaHerramienta = null;
  actualizarHerramientas();
}

function cancelarRecolocacion() {
  if (ESTADO.chicaRecolocandoOrigen && ESTADO.chicas.includes(ESTADO.chicaRecolocando)) {
    ESTADO.chicaRecolocando.col = ESTADO.chicaRecolocandoOrigen.col;
    ESTADO.chicaRecolocando.fila = ESTADO.chicaRecolocandoOrigen.fila;
  }

  ESTADO.chicaRecolocando = null;
  ESTADO.chicaRecolocandoOrigen = null;
  ESTADO.herramientaActiva = null;
  ESTADO.celdaPreviaHerramienta = null;
  pistaTienda.textContent = 'Selecciona una chica';
  mostrarFlotante('↔ Recolocación cancelada');
  actualizarHerramientas();
}

function cancelarHerramientaActiva() {
  const herramienta = ESTADO.herramientaActiva;
  if (!herramienta) return;

  if (herramienta === 'recolocar') {
    cancelarRecolocacion();
    return;
  }

  ESTADO.herramientaActiva = null;
  ESTADO.celdaPreviaHerramienta = null;
  pistaTienda.textContent = 'Selecciona una chica';
  mostrarFlotante('✖ Herramienta cancelada');
  actualizarHerramientas();
}

function quitarChica(col, fila) {
  const chica = obtenerChicaEnCelda(col, fila);
  if (!chica) { mostrarFlotante('✖ No hay wifu en esa celda'); return; }
  const reembolso = Math.floor(chica.def.costo * 0.1);
  ESTADO.oro += reembolso;
  ESTADO.chicas = ESTADO.chicas.filter(g => g !== chica);
  ESTADO.proyectiles = ESTADO.proyectiles.filter(p => p.deChica !== chica);
  if (ESTADO.chicaRecolocando === chica) {
    ESTADO.chicaRecolocando = null;
    ESTADO.chicaRecolocandoOrigen = null;
  }
  ESTADO.celdaPreviaHerramienta = null;
  mostrarFlotante(`✖ ${chica.def.nombre} retirada +${reembolso}💰`, chica.def.color);
  renderizarTienda();
  actualizarHUD();
}

// ──────────────────────────────────────────────
// PREVISUALIZACIÓN Y CLICK / TOUCH SOBRE EL CANVAS
// ──────────────────────────────────────────────
function actualizarPreviaColocacion(ex, ey) {
  if (!ESTADO.chicaSeleccionada || ESTADO.herramientaActiva) {
    ESTADO.celdaPreviaColocacion = null;
    return;
  }

  const rect = lienzo.getBoundingClientRect();
  const px = ex - rect.left;
  const py = ey - rect.top;
  const { col, fila } = pixelesACelda(px, py);
  const def = DEF_CHICAS.find(d => d.id === ESTADO.chicaSeleccionada);

  ESTADO.celdaPreviaColocacion = {
    col,
    fila,
    valida:
      Boolean(def) &&
      ESTADO.oleadaActiva &&
      ESTADO.oro >= def.costo &&
      obtenerEsperaTienda(def.id) <= 0 &&
      esColocacionValida(col, fila),
  };
}

function actualizarPreviaHerramienta(ex, ey) {
  if (!['quitar', 'recolocar'].includes(ESTADO.herramientaActiva)) {
    ESTADO.celdaPreviaHerramienta = null;
    return;
  }

  const rect = lienzo.getBoundingClientRect();
  const px = ex - rect.left;
  const py = ey - rect.top;
  const { col, fila } = pixelesACelda(px, py);
  const chica = obtenerChicaEnCelda(col, fila);

  if (ESTADO.herramientaActiva === 'quitar') {
    ESTADO.celdaPreviaHerramienta = {
      col,
      fila,
      accion: 'quitar',
      tieneUnidad: Boolean(chica),
    };
    return;
  }

  if (!ESTADO.chicaRecolocando) {
    ESTADO.celdaPreviaHerramienta = {
      col,
      fila,
      accion: 'recolocar-origen',
      tieneUnidad: Boolean(chica),
    };
    return;
  }

  ESTADO.celdaPreviaHerramienta = {
    col,
    fila,
    accion: 'recolocar-destino',
    tieneUnidad: Boolean(chica),
    valida: esColocacionValida(col, fila),
  };
}

function limpiarPreviaColocacion() {
  ESTADO.celdaPreviaColocacion = null;
  ESTADO.celdaPreviaHerramienta = null;
}

function manejarClickLienzo(ex, ey) {
  const rect = lienzo.getBoundingClientRect();
  const px = ex - rect.left;
  const py = ey - rect.top;
  const { col, fila } = pixelesACelda(px, py);
  if (col >= 1 && col < COLUMNAS && fila >= 0 && fila < FILAS) {
    if (ESTADO.herramientaActiva === 'recolocar') { recolocarChica(col, fila); return; }
    if (ESTADO.herramientaActiva === 'quitar') { quitarChica(col, fila); return; }
    colocarChica(col, fila);
  }
  if (!ESTADO.chicaSeleccionada) limpiarPreviaColocacion();
}

// ──────────────────────────────────────────────
// EVENTOS DE INPUT
// ──────────────────────────────────────────────
lienzo.addEventListener('click', e => {
  if (ESTADO.pausado) return;
  manejarClickLienzo(e.clientX, e.clientY);
});

lienzo.addEventListener('mousemove', e => {
  if (ESTADO.pausado) return;
  actualizarPreviaColocacion(e.clientX, e.clientY);
  actualizarPreviaHerramienta(e.clientX, e.clientY);
});

lienzo.addEventListener('mouseleave', limpiarPreviaColocacion);

lienzo.addEventListener('touchmove', e => {
  if (ESTADO.pausado) return;
  e.preventDefault();
  const t = e.changedTouches[0];
  actualizarPreviaColocacion(t.clientX, t.clientY);
  actualizarPreviaHerramienta(t.clientX, t.clientY);
}, { passive: false });

lienzo.addEventListener('touchend', e => {
  if (ESTADO.pausado) return;
  e.preventDefault();
  const t = e.changedTouches[0];
  actualizarPreviaColocacion(t.clientX, t.clientY);
  actualizarPreviaHerramienta(t.clientX, t.clientY);
  manejarClickLienzo(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !ESTADO.herramientaActiva) return;
  e.preventDefault();
  cancelarHerramientaActiva();
});

window.addEventListener('resize', () => {
  if (document.getElementById('screen-game').classList.contains('active')) {
    redimensionarLienzo();
  }
});
