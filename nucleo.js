/* =====================================================
   WIFUS contra ZOMBIES — nucleo.js
   Estado global del juego y referencias al DOM
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────────
let ESTADO = {};

function iniciarEstado() {
  ESTADO = {
    oro               : 750,
    vidaNexo          : 1,
    vidaMaxNexo       : 1,
    oleada            : 0,
    oleadaActiva      : false,
    oleadaCompleta    : false,
    todasOleadasHechas: false,
    pausado           : false,
    chicaSeleccionada : null,
    celdaPreviaColocacion: null,
    celdaPreviaHerramienta: null,
    herramientaActiva : null,
    chicaRecolocando  : null,
    chicaRecolocandoOrigen: null,
    enfriamientosTienda: {},
    chicas            : [],
    zombis            : [],
    proyectiles       : [],
    misilesDefensa    : Array(FILAS).fill(true),
    misilesActivos    : [],
    particulas        : [],
    colaSpawn         : [],
    bajasOleada       : 0,
    surgeActivado     : false,
    defOleadaActual   : null,
    oleadas           : construirOleadas(),
    ultimoTiempo      : 0,
    anchoCelda        : 60,
    altoCelda         : 60,
    offsetX           : 0,
    offsetY           : 0,
  };
}

// ──────────────────────────────────────────────
// REFERENCIAS AL DOM
// ──────────────────────────────────────────────
const lienzo       = document.getElementById('game-canvas');
const ctx          = lienzo.getContext('2d');
const tarjetasTienda = document.getElementById('shop-cards');
const btnHerramientaRecolocar = document.getElementById('tool-move');
const btnHerramientaQuitar = document.getElementById('tool-remove');
const pistaTienda  = document.getElementById('shop-hint');
const elEstadoOleada = document.getElementById('wave-status');
const btnIniciarOleada = document.getElementById('btn-start-wave');
const elOro         = document.getElementById('gold-display');
const elVidaNexo    = document.getElementById('nexo-hp');
const elOleada      = document.getElementById('wave-display');
const elFlotante    = document.getElementById('float-msg');
