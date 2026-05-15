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
    nivel             : 1,
    ejecucionNivel    : 0,
    nivelActual       : null,
    faseIndice        : -1,
    faseActual        : null,
    faseActiva        : false,
    nivelCompleto     : false,
    bajasNivel        : 0,
    zombisTotalesNivel: 0,
    tutorial          : null,
    dialogoCapitanaContinuable: null,
    carrilesActivos   : Array.from({ length: FILAS }, (_, fila) => fila),
    cartasDisponibles : DEF_CHICAS.map(def => def.id),
    herramientasDisponibles: ['recolocar', 'quitar'],
    recompensaPendiente: null,
    recompensaCaida   : null,
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
const gridColeccion = document.getElementById('collection-grid');
const detalleColeccion = document.getElementById('collection-detail');
const resumenColeccion = document.getElementById('collection-summary');
const kickerColeccion = document.getElementById('collection-kicker');
const btnSiguienteNivel = document.getElementById('btn-next-level');
const briefingKicker = document.getElementById('briefing-kicker');
const briefingTitle = document.getElementById('briefing-title');
const briefingSummary = document.getElementById('briefing-summary');
const briefingLanes = document.getElementById('briefing-lanes');
const briefingZombies = document.getElementById('briefing-zombies');
const btnBriefingStart = document.getElementById('btn-briefing-start');
const btnBriefingExit = document.getElementById('btn-briefing-exit');
const barraProgresoNivel = document.getElementById('level-progress');
const dialogoCapitana = document.getElementById('captain-dialog');
const mensajeCapitana = document.getElementById('captain-message');
const alertaPeligro = document.getElementById('danger-alert');
const textoAlertaPeligro = document.getElementById('danger-alert-text');
const cinematicaRecompensa = document.getElementById('reward-cinematic');
const cartaGrandeRecompensa = document.getElementById('reward-big-card');
const fundidoNivel = document.getElementById('level-fade');
const elOro         = document.getElementById('gold-display');
const elVidaNexo    = document.getElementById('nexo-hp');
const elOleada      = document.getElementById('wave-display');
const elFlotante    = document.getElementById('float-msg');
