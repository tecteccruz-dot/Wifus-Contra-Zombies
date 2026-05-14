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
    pistaTienda.textContent = `Mueve a: ${chica.def.emoji} ${chica.def.nombre}`;
    mostrarFlotante('↔ Elige la nueva celda', chica.def.color);
    return;
  }

  if (!ESTADO.chicas.includes(ESTADO.chicaRecolocando)) {
    ESTADO.chicaRecolocando = null;
    pistaTienda.textContent = 'Elige una wifu para mover';
    mostrarFlotante('↔ Esa wifu ya no está en el tablero');
    return;
  }

  if (ESTADO.chicaRecolocando.col === col && ESTADO.chicaRecolocando.fila === fila) {
    ESTADO.chicaRecolocando = null;
    pistaTienda.textContent = 'Elige una wifu para mover';
    mostrarFlotante('↔ Recolocación cancelada');
    return;
  }

  if (!esColocacionValida(col, fila)) { mostrarFlotante('❌ Celda no válida'); return; }
  ESTADO.chicaRecolocando.col = col;
  ESTADO.chicaRecolocando.fila = fila;
  mostrarFlotante('↔ Wifu recolocada', ESTADO.chicaRecolocando.def.color);
  ESTADO.chicaRecolocando = null;
  pistaTienda.textContent = 'Elige una wifu para mover';
}

function quitarChica(col, fila) {
  const chica = obtenerChicaEnCelda(col, fila);
  if (!chica) { mostrarFlotante('✖ No hay wifu en esa celda'); return; }
  const reembolso = Math.floor(chica.def.costo * 0.1);
  ESTADO.oro += reembolso;
  ESTADO.chicas = ESTADO.chicas.filter(g => g !== chica);
  ESTADO.proyectiles = ESTADO.proyectiles.filter(p => p.deChica !== chica);
  if (ESTADO.chicaRecolocando === chica) ESTADO.chicaRecolocando = null;
  mostrarFlotante(`✖ ${chica.def.nombre} retirada +${reembolso}💰`, chica.def.color);
  renderizarTienda();
  actualizarHUD();
}

// ──────────────────────────────────────────────
// MANEJAR CLICK / TOUCH SOBRE EL CANVAS
// ──────────────────────────────────────────────
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
}

// ──────────────────────────────────────────────
// EVENTOS DE INPUT
// ──────────────────────────────────────────────
lienzo.addEventListener('click', e => {
  if (ESTADO.pausado) return;
  manejarClickLienzo(e.clientX, e.clientY);
});

lienzo.addEventListener('touchend', e => {
  if (ESTADO.pausado) return;
  e.preventDefault();
  const t = e.changedTouches[0];
  manejarClickLienzo(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('resize', () => {
  if (document.getElementById('screen-game').classList.contains('active')) {
    redimensionarLienzo();
  }
});
