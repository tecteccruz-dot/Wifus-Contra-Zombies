/* =====================================================
   WIFUS contra ZOMBIES — config.js
   Constantes globales y paleta visual
   ===================================================== */

"use strict";

// ──────────────────────────────────────────────
// DIMENSIONES DEL TABLERO
// ──────────────────────────────────────────────
const COLUMNAS = 11; // columnas del tablero: 11 + Nexo = 12 celdas visibles
const FILAS = 7; // filas del tablero
const COL_NEXO = 0; // columna donde está el nexo (lado izquierdo)
const COL_SPAWN = COLUMNAS; // columna de aparición de zombis (fuera a la derecha)
const TOTAL_NIVELES = 4;
const TOTAL_OLEADAS = TOTAL_NIVELES;

// ──────────────────────────────────────────────
// PALETA DE COLORES
// ──────────────────────────────────────────────
const PALETA = {
  cesped1: "#2e7d32",
  cesped2: "#388e3c",
  lineaCuad: "rgba(0,0,0,0.25)",
  nexoBase: "#1565c0",
  nexoFondo: "#0d47a1",
  rosa: "#00e5ff",
  rosa2: "#66f6ff",
  oro: "#ffd700",
  oroOscuro: "#ffb300",
  rojo: "#ff3355",
  verde: "#39e87a",
  oscuro: "#06142f",
  oscuro2: "#0b1f45",
  blanco: "#ffffff",
  gris: "rgba(255,255,255,0.15)",
  fondoBarraVida: "rgba(0,0,0,0.6)",
  verdeVida: "#39e87a",
  rojoVida: "#ff3355",
  proyectil: "#ffe082",
  anilloAoe: "rgba(0,229,255,0.38)",
};

// ──────────────────────────────────────────────
// COMPATIBILIDAD CON SISTEMA ANTERIOR DE OLEADAS
// ──────────────────────────────────────────────
function construirOleadas() {
  return [];
}
