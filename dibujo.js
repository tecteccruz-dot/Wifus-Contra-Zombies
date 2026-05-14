/* =====================================================
   WIFUS contra ZOMBIES — dibujo.js
   Renderizado completo del canvas:
   cuadrícula, nexo, chicas, zombis, proyectiles,
   partículas, barras de vida y guía de colocación
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// ORQUESTADOR DE DIBUJO
// ──────────────────────────────────────────────
function dibujar() {
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  dibujarCuadricula();
  dibujarNexo();
  dibujarMisilesDefensa();
  dibujarChicas();
  dibujarZombis();
  dibujarMisilesActivos();
  dibujarProyectiles();
  dibujarParticulas();
  if (ESTADO.chicaSeleccionada) dibujarGuiaColocacion();
}

// ──────────────────────────────────────────────
// CUADRÍCULA DEL TABLERO
// ──────────────────────────────────────────────
function dibujarCuadricula() {
  for (let fila = 0; fila < FILAS; fila++) {
    for (let col = 1; col <= COLUMNAS; col++) {
      const x = celdaX(col), y = celdaY(fila);
      const tono = (fila + col) % 2 === 0 ? PALETA.cesped1 : PALETA.cesped2;
      ctx.fillStyle = tono;
      ctx.fillRect(x, y, ESTADO.anchoCelda, ESTADO.altoCelda);
      ctx.strokeStyle = PALETA.lineaCuad;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, ESTADO.anchoCelda, ESTADO.altoCelda);
    }
  }
}

// ──────────────────────────────────────────────
// NEXO (BASE A DEFENDER)
// ──────────────────────────────────────────────
function dibujarNexo() {
  const x = celdaX(COL_NEXO);
  const w = ESTADO.anchoCelda;
  const h = ESTADO.altoCelda * FILAS;
  const y = celdaY(0);

  // fondo
  ctx.fillStyle = PALETA.nexoFondo;
  ctx.fillRect(x, y, w, h);

  // icono por fila
  for (let fila = 0; fila < FILAS; fila++) {
    const cy = centroY(fila);
    ctx.font = `${ESTADO.anchoCelda * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.35;
    ctx.fillText('💎', centroX(COL_NEXO), cy);
    ctx.globalAlpha = 1;
  }

  // línea azul de activación
  ctx.strokeStyle = '#12a8e8';
  ctx.lineWidth = Math.max(3, ESTADO.anchoCelda * 0.08);
  ctx.beginPath();
  ctx.moveTo(x + w - ctx.lineWidth / 2, y);
  ctx.lineTo(x + w - ctx.lineWidth / 2, y + h);
  ctx.stroke();

  // barra de vida
  const anchoBarra = w - 4;
  const altoBarra  = 7;
  const pct = Math.max(0, ESTADO.vidaNexo / ESTADO.vidaMaxNexo);
  ctx.fillStyle = PALETA.fondoBarraVida;
  ctx.fillRect(x + 2, y + 2, anchoBarra, altoBarra);
  ctx.fillStyle = pct > 0.5 ? PALETA.verdeVida : pct > 0.25 ? '#ffb300' : PALETA.rojoVida;
  ctx.fillRect(x + 2, y + 2, anchoBarra * pct, altoBarra);

  // etiqueta
  ctx.fillStyle = '#90caf9';
  ctx.font = `bold ${Math.max(8, ESTADO.anchoCelda * 0.18)}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body')}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('NEXO', centroX(COL_NEXO), y + altoBarra + 4);
}

function dibujarMisilesDefensa() {
  for (let fila = 0; fila < FILAS; fila++) {
    const disponible = ESTADO.misilesDefensa[fila];
    const cx = celdaX(COL_NEXO) + ESTADO.anchoCelda * 0.48;
    const cy = centroY(fila);
    const largo = ESTADO.anchoCelda * 0.62;
    const alto = ESTADO.altoCelda * 0.34;

    ctx.globalAlpha = disponible ? 1 : 0.22;
    ctx.strokeStyle = disponible ? '#c27a4a' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(2, ESTADO.anchoCelda * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx - largo * 0.45, cy - alto * 0.45);
    ctx.lineTo(cx + largo * 0.18, cy - alto * 0.45);
    ctx.lineTo(cx + largo * 0.48, cy);
    ctx.lineTo(cx + largo * 0.18, cy + alto * 0.45);
    ctx.lineTo(cx - largo * 0.45, cy + alto * 0.45);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function dibujarMisilesActivos() {
  ESTADO.misilesActivos.forEach(m => {
    const cy = centroY(m.fila);
    const alpha = Math.max(0.15, m.vida / m.vidaMax);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = Math.max(4, ESTADO.altoCelda * 0.08);
    ctx.beginPath();
    ctx.moveTo(celdaX(COL_NEXO) + ESTADO.anchoCelda, cy);
    ctx.lineTo(Math.min(m.x, celdaX(COL_SPAWN) + ESTADO.anchoCelda), cy);
    ctx.stroke();
    ctx.fillStyle = '#ffd180';
    ctx.font = `${ESTADO.anchoCelda * 0.42}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', m.x, cy);
    ctx.globalAlpha = 1;
  });
}

// ──────────────────────────────────────────────
// CHICAS COLOCADAS
// ──────────────────────────────────────────────
function dibujarChicas() {
  ESTADO.chicas.forEach(g => {
    const x  = celdaX(g.col), y = celdaY(g.fila);
    const cx = centroX(g.col), cy = centroY(g.fila);
    const cw = ESTADO.anchoCelda, ch = ESTADO.altoCelda;

    // sombra
    ctx.beginPath();
    ctx.arc(cx, cy + ch * 0.28, cw * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // círculo del cuerpo
    ctx.beginPath();
    ctx.arc(cx, cy, cw * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = g.def.color + '33';
    ctx.fill();
    ctx.strokeStyle = g.def.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    dibujarVisualChica(g, cx, cy, cw, ch);

    // barra de vida
    dibujarBarraVida(x + 2, y + ch - 9, cw - 4, 6, g.vida / g.vidaMax);
  });
}

function dibujarVisualChica(g, cx, cy, cw, ch) {
  const sprite = obtenerSpriteChica(g);
  const img = sprite && sprite.imagen;

  if (img && img.complete && img.naturalWidth > 0) {
    const frameW = img.naturalWidth / sprite.cols;
    const frameH = img.naturalHeight / sprite.filas;
    const frame = Math.floor(performance.now() / (1000 / sprite.fps)) % sprite.frames;
    const sx = (frame % sprite.cols) * frameW;
    const sy = Math.floor(frame / sprite.cols) * frameH;
    const escala = Math.min((cw * 0.82) / frameW, (ch * 0.9) / frameH);
    const dw = frameW * escala;
    const dh = frameH * escala;

    ctx.drawImage(img, sx, sy, frameW, frameH, cx - dw / 2, cy - dh * 0.56, dw, dh);
    return;
  }

  ctx.font = `${cw * 0.5}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(g.def.emoji, cx, cy);
}

function obtenerSpriteChica(g) {
  if (g.def.spriteEstados) {
    return g.def.spriteEstados[g.animacion] || g.def.spriteEstados.idle;
  }
  return g.def.sprite;
}

// ──────────────────────────────────────────────
// ZOMBIS ACTIVOS
// ──────────────────────────────────────────────
function dibujarZombis() {
  ESTADO.zombis.forEach(z => {
    const cy = centroY(z.fila);
    const cw = ESTADO.anchoCelda, ch = ESTADO.altoCelda;
    const tam = cw * z.def.tam;

    // sombra
    ctx.beginPath();
    ctx.ellipse(z.x, cy + tam * 0.4, tam * 0.4, tam * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // círculo del cuerpo
    ctx.beginPath();
    ctx.arc(z.x, cy, tam * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = z.def.color + '44';
    ctx.fill();
    ctx.strokeStyle = z.def.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // emoji
    ctx.font = `${tam * 0.65}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(z.def.emoji, z.x, cy);

    // barra de vida
    const bx = z.x - cw * 0.4;
    const by = cy - tam * 0.5 - 9;
    dibujarBarraVida(bx, by, cw * 0.8, 5, z.vida / z.vidaMax);
  });
}

// ──────────────────────────────────────────────
// BARRA DE VIDA GENÉRICA
// ──────────────────────────────────────────────
function dibujarBarraVida(x, y, w, h, pct) {
  ctx.fillStyle = PALETA.fondoBarraVida;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pct > 0.5 ? PALETA.verdeVida : pct > 0.25 ? '#ffb300' : PALETA.rojoVida;
  ctx.fillRect(x, y, w * Math.max(0, pct), h);
}

// ──────────────────────────────────────────────
// PROYECTILES EN VUELO
// ──────────────────────────────────────────────
function dibujarProyectiles() {
  ESTADO.proyectiles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    // resplandor
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '44';
    ctx.fill();
  });
}

// ──────────────────────────────────────────────
// PARTÍCULAS VISUALES
// ──────────────────────────────────────────────
function dibujarParticulas() {
  ESTADO.particulas.forEach(p => {
    ctx.globalAlpha = p.alpha;
    if (p.esCirculo) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio * (1 - p.alpha * 0.5), 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.font = `bold ${Math.max(10, ESTADO.anchoCelda * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.color;
      ctx.fillText(p.texto, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  });
}

// ──────────────────────────────────────────────
// GUÍA DE COLOCACIÓN (CELDAS DISPONIBLES)
// ──────────────────────────────────────────────
function dibujarGuiaColocacion() {
  for (let fila = 0; fila < FILAS; fila++) {
    for (let col = 1; col < COLUMNAS; col++) {
      if (!ESTADO.chicas.some(g => g.col === col && g.fila === fila)) {
        ctx.fillStyle = 'rgba(255,77,141,0.10)';
        ctx.fillRect(celdaX(col) + 1, celdaY(fila) + 1, ESTADO.anchoCelda - 2, ESTADO.altoCelda - 2);
      }
    }
  }
}
