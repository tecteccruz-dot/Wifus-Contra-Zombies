/* =====================================================
   GIRLS vs ZOMBIES — particulas.js
   Creación de efectos visuales (partículas)
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// PARTÍCULA DE TEXTO FLOTANTE
// ──────────────────────────────────────────────
function crearParticula(x, y, texto, color, flotarArriba = false) {
  if (typeof obtenerProgreso === 'function' && !obtenerProgreso().opciones.efectos) return;
  ESTADO.particulas.push({
    x, y, texto, color,
    vx: (Math.random() - 0.5) * 20,
    vy: flotarArriba ? 40 : 20,
    vida: 1.2,
    vidaMax: 1.2,
    alpha: 1,
    esCirculo: false,
  });
}

// ──────────────────────────────────────────────
// PARTÍCULA DE ANILLO (EXPLOSIÓN AOE)
// ──────────────────────────────────────────────
function crearParticulaCirculo(x, y, radio, color) {
  if (typeof obtenerProgreso === 'function' && !obtenerProgreso().opciones.efectos) return;
  ESTADO.particulas.push({
    x, y, texto: null, color,
    vx: 0, vy: 0,
    vida: 0.5,
    vidaMax: 0.5,
    alpha: 1,
    esCirculo: true,
    radio,
  });
}
