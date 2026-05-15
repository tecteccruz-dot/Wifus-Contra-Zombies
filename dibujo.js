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
  dibujarIndicadorEliminar();
  dibujarIndicadorRecolocar();
  dibujarZombis();
  dibujarMisilesActivos();
  dibujarProyectiles();
  dibujarParticulas();
  if (ESTADO.chicaSeleccionada) {
    dibujarGuiaColocacion();
    dibujarFantasmaColocacion();
  }
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
    const levantada = ESTADO.herramientaActiva === 'recolocar' && ESTADO.chicaRecolocando === g;
    const x  = celdaX(g.col), y = celdaY(g.fila);
    const cx = centroX(g.col), cy = centroY(g.fila);
    const cw = ESTADO.anchoCelda, ch = ESTADO.altoCelda;

    ctx.save();
    if (levantada) ctx.globalAlpha = 0.28;

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
    ctx.restore();
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
        ctx.fillStyle = 'rgba(0,229,255,0.10)';
        ctx.fillRect(celdaX(col) + 1, celdaY(fila) + 1, ESTADO.anchoCelda - 2, ESTADO.altoCelda - 2);
      }
    }
  }
}

function dibujarFantasmaColocacion() {
  const previa = ESTADO.celdaPreviaColocacion;
  if (!previa) return;

  const def = DEF_CHICAS.find(d => d.id === ESTADO.chicaSeleccionada);
  if (!def) return;

  const dentroTablero = previa.col >= 1 && previa.col < COLUMNAS && previa.fila >= 0 && previa.fila < FILAS;
  if (!dentroTablero) return;

  const x = celdaX(previa.col);
  const y = celdaY(previa.fila);
  const cx = centroX(previa.col);
  const cy = centroY(previa.fila);
  const color = previa.valida ? '#39e87a' : '#ff3355';

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, ESTADO.anchoCelda - 4, ESTADO.altoCelda - 4);
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, ESTADO.anchoCelda * 0.05);
  ctx.setLineDash([ESTADO.anchoCelda * 0.16, ESTADO.anchoCelda * 0.08]);
  ctx.strokeRect(x + 3, y + 3, ESTADO.anchoCelda - 6, ESTADO.altoCelda - 6);
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(cx, cy, ESTADO.anchoCelda * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.globalAlpha = 0.56;
  dibujarVisualChica({ def, animacion: 'idle' }, cx, cy, ESTADO.anchoCelda, ESTADO.altoCelda);

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(11, ESTADO.anchoCelda * 0.2)}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body')}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(previa.valida ? 'OK' : 'NO', cx, y + ESTADO.altoCelda * 0.15);
  ctx.restore();
}

function dibujarIndicadorEliminar() {
  const previa = ESTADO.celdaPreviaHerramienta;
  if (!previa || ESTADO.herramientaActiva !== 'quitar' || !previa.tieneUnidad) return;

  const chica = obtenerChicaEnCelda(previa.col, previa.fila);
  if (!chica) return;

  const x = celdaX(chica.col);
  const y = celdaY(chica.fila);
  const cx = centroX(chica.col);
  const cy = centroY(chica.fila);
  const w = ESTADO.anchoCelda;
  const h = ESTADO.altoCelda;

  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ff3355';
  ctx.lineWidth = Math.max(3, w * 0.07);
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(4, w * 0.1);
  ctx.strokeStyle = 'rgba(5,7,13,0.78)';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, cy - h * 0.24);
  ctx.lineTo(cx + w * 0.24, cy + h * 0.24);
  ctx.moveTo(cx + w * 0.24, cy - h * 0.24);
  ctx.lineTo(cx - w * 0.24, cy + h * 0.24);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, w * 0.055);
  ctx.strokeStyle = '#ffebee';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, cy - h * 0.24);
  ctx.lineTo(cx + w * 0.24, cy + h * 0.24);
  ctx.moveTo(cx + w * 0.24, cy - h * 0.24);
  ctx.lineTo(cx - w * 0.24, cy + h * 0.24);
  ctx.stroke();
  ctx.restore();
}

function dibujarIndicadorRecolocar() {
  const previa = ESTADO.celdaPreviaHerramienta;
  if (ESTADO.herramientaActiva !== 'recolocar') return;

  if (!ESTADO.chicaRecolocando) {
    if (!previa) return;
    if (previa.accion !== 'recolocar-origen' || !previa.tieneUnidad) return;
    const chica = obtenerChicaEnCelda(previa.col, previa.fila);
    if (!chica) return;
    dibujarResaltadoRecolocar(chica.col, chica.fila, '#ffd000', true);
    return;
  }

  dibujarOrigenRecolocar();
  if (!previa) return;
  if (previa.accion !== 'recolocar-destino') return;

  const dentroTablero = previa.col >= 1 && previa.col < COLUMNAS && previa.fila >= 0 && previa.fila < FILAS;
  if (!dentroTablero) return;

  const chica = ESTADO.chicaRecolocando;
  const x = celdaX(previa.col);
  const y = celdaY(previa.fila);
  const cx = centroX(previa.col);
  const cy = centroY(previa.fila);
  const w = ESTADO.anchoCelda;
  const h = ESTADO.altoCelda;
  const color = previa.valida ? '#39e87a' : '#ff3355';

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.055);
  ctx.setLineDash([w * 0.15, w * 0.08]);
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.globalAlpha = 0.58;
  dibujarVisualChica({ def: chica.def, animacion: chica.animacion || 'idle' }, cx, cy, w, h);

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(13, w * 0.24)}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body')}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(previa.valida ? '↔' : 'X', cx, y + h * 0.18);
  ctx.restore();
}

function dibujarOrigenRecolocar() {
  const origen = ESTADO.chicaRecolocandoOrigen;
  if (!origen) return;
  dibujarResaltadoRecolocar(origen.col, origen.fila, '#ffd000', false);
}

function dibujarResaltadoRecolocar(col, fila, color, mostrarIcono) {
  const x = celdaX(col);
  const y = celdaY(fila);
  const cx = centroX(col);
  const cy = centroY(fila);
  const w = ESTADO.anchoCelda;
  const h = ESTADO.altoCelda;

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, w * 0.07);
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  if (mostrarIcono) {
    ctx.fillStyle = '#05070d';
    ctx.font = `bold ${Math.max(16, w * 0.34)}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↔', cx + 1, cy + 1);
    ctx.fillStyle = '#ffd000';
    ctx.fillText('↔', cx, cy);
  }
  ctx.restore();
}
