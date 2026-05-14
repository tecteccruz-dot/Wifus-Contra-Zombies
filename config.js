/* =====================================================
   WIFUS contra ZOMBIES — config.js
   Constantes, paleta, definiciones de chicas, zombis y oleadas
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// DIMENSIONES DEL TABLERO
// ──────────────────────────────────────────────
const COLUMNAS     = 10;   // columnas del tablero
const FILAS        = 6;    // filas del tablero
const COL_NEXO     = 0;    // columna donde está el nexo (lado izquierdo)
const COL_SPAWN    = COLUMNAS; // columna de aparición de zombis (fuera a la derecha)
const TOTAL_OLEADAS = 10;

// ──────────────────────────────────────────────
// PALETA DE COLORES
// ──────────────────────────────────────────────
const PALETA = {
  cesped1  : '#2e7d32',
  cesped2  : '#388e3c',
  lineaCuad: 'rgba(0,0,0,0.25)',
  nexoBase : '#1565c0',
  nexoFondo: '#0d47a1',
  rosa     : '#ff4d8d',
  rosa2    : '#ff80b0',
  oro      : '#ffd700',
  oroOscuro: '#ffb300',
  rojo     : '#ff3355',
  verde    : '#39e87a',
  oscuro   : '#1a0a2e',
  oscuro2  : '#2d1b4e',
  blanco   : '#ffffff',
  gris     : 'rgba(255,255,255,0.15)',
  fondoBarraVida: 'rgba(0,0,0,0.6)',
  verdeVida : '#39e87a',
  rojoVida  : '#ff3355',
  proyectil : '#ffe082',
  anilloAoe : 'rgba(179,136,255,0.4)',
};

// ──────────────────────────────────────────────
// DEFINICIÓN DE CHICAS
// ──────────────────────────────────────────────
const DEF_CHICAS = [
  {
    id          : 'shooter',
    nombre      : 'Stremer',
    emoji       : '🌸',
    costo       : 500,
    vida        : 80,
    danio       : 0,
    alcance     : 0,
    cadencia    : 0,
    velProyectil: 0,
    aoe         : 0,
    oroIngreso  : 250,
    primerIntervaloOro: 8,
    intervaloOro: 20,
    tiempoEspera: 7.5,
    icono       : 'Personajes/Streamer/Streamer.png',
    sprite      : {
      src   : 'Personajes/Streamer/Streamer_SS.png',
      cols  : 6,
      filas : 6,
      frames: 36,
      fps   : 14,
    },
    color       : '#ff80b0',
    desc        : 'ORO:+250 10s/24s',
  },
  {
    id          : 'archer',
    nombre      : 'Pistolera',
    emoji       : '🏹',
    costo       : 750,
    vida        : 60,
    danio       : 1,
    alcance     : COLUMNAS,
    cadencia    : 0.8,
    velProyectil: 6,
    aoe         : 0,
    icono       : 'Personajes/Pistolera/Pistolera.png',
    spriteEstados: {
      idle: {
        src   : 'Personajes/Pistolera/Pistolera_Idle.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 12,
      },
      apuntando: {
        src   : 'Personajes/Pistolera/Pistolera_Apuntando.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 14,
      },
      disparo: {
        src   : 'Personajes/Pistolera/Pistolera_Disparo.png',
        cols  : 5,
        filas : 5,
        frames: 25,
        fps   : 22,
        duracion: 0.35,
      },
    },
    color       : '#ffb300',
    desc        : 'ATK:1 RNG:FULL RPM:0.8',
  },
  {
    id          : 'mage',
    nombre      : 'Cazadora',
    emoji       : '🔮',
    costo       : 1000,
    vida        : 55,
    danio       : 30,
    alcance     : 3,
    cadencia    : 0.5,
    velProyectil: 3.5,
    aoe         : 0,
    rafagaDisparos: 2,
    intervaloRafaga: 0.18,
    cooldownRafaga: 2,
    icono       : 'Personajes/Cazadora/Cazadora.png',
    spriteEstados: {
      idle: {
        src   : 'Personajes/Cazadora/Cazadora_Idle.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 12,
      },
      apuntando: {
        src   : 'Personajes/Cazadora/Cazadora_Apuntando.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 14,
      },
      disparo: {
        src   : 'Personajes/Cazadora/Cazadora_Disparo.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 22,
        duracion: 0.25,
      },
    },
    color       : '#b388ff',
    desc        : 'ATK:30 x2 CD:2s',
  },
  {
    id          : 'tank',
    nombre      : 'Tanque',
    emoji       : '🛡️',
    costo       : 900,
    vida        : 300,
    danio       : 8,
    alcance     : 1.5,
    cadencia    : 1.5,
    velProyectil: 3,
    aoe         : 0,
    icono       : 'Personajes/Tanque/Tanque.png',
    spriteEstados: {
      idle: {
        src   : 'Personajes/Tanque/Tanque_Idle.png',
        cols  : 6,
        filas : 6,
        frames: 36,
        fps   : 12,
      },
    },
    color       : '#4fc3f7',
    desc        : 'HP:300 ATK:8 NEAR',
  },
  {
    id          : 'healer',
    nombre      : 'Healer',
    emoji       : '💊',
    costo       : 800,
    vida        : 70,
    danio       : 0,
    alcance     : 2.5,
    cadencia    : 0.4,
    velProyectil: 0,
    aoe         : 0,
    curacion    : 10,
    color       : '#39e87a',
    desc        : 'HEAL:10 RNG:2.5',
  },
  {
    id          : 'bomber',
    nombre      : 'Bomber',
    emoji       : '💣',
    costo       : 1200,
    vida        : 65,
    danio       : 50,
    alcance     : 2,
    cadencia    : 0.35,
    velProyectil: 2.5,
    aoe         : 1.5,
    color       : '#ff8f00',
    desc        : 'ATK:50 AOE:1.5',
  },
];

const CACHE_IMAGENES = {};

function cargarImagenJuego(src) {
  if (!src) return null;
  if (CACHE_IMAGENES[src]) return CACHE_IMAGENES[src];

  const img = new Image();
  img.src = src;
  CACHE_IMAGENES[src] = img;
  return img;
}

DEF_CHICAS.forEach(def => {
  if (def.icono) cargarImagenJuego(def.icono);
  if (def.sprite) def.sprite.imagen = cargarImagenJuego(def.sprite.src);
  if (def.spriteEstados) {
    Object.values(def.spriteEstados).forEach(sprite => {
      sprite.imagen = cargarImagenJuego(sprite.src);
    });
  }
});

// ──────────────────────────────────────────────
// DEFINICIÓN DE ZOMBIS
// ──────────────────────────────────────────────
const TIPOS_ZOMBI = [
  { id:'basic',  emoji:'🧟', nombre:'Zombi',     vida:10,  vel:0.12, danio:10, oro:0, color:'#7cb342', tam:0.7 },
  { id:'fast',   emoji:'🏃', nombre:'Corredor',  vida:8,  vel:0.5,  danio:8,  oro:0, color:'#ef9a9a', tam:0.6 },
  { id:'tank',   emoji:'🧟‍♂️',nombre:'Tanque',   vida:200, vel:0.25, danio:20, oro:0, color:'#37474f', tam:0.85},
  { id:'healer', emoji:'🩸', nombre:'CuraZombi', vida:80,  vel:0.45, danio:12, oro:0, color:'#e91e63', tam:0.7,
    auraCuracion: 5, radioCuracion: 1.5 },
  { id:'boss',   emoji:'👹', nombre:'JEFE',      vida:600, vel:0.18, danio:40, oro:0, color:'#b71c1c', tam:1.0 },
];

// ──────────────────────────────────────────────
// CONSTRUCCIÓN DE OLEADAS
// ──────────────────────────────────────────────
// Cada oleada tiene dos fases:
//   - goteo: avanzada inicial, lenta, espaciada tras leadDelay.
//   - surge: gran oleada masiva al alcanzar surgeAlBajas.
function construirOleadas() {
  return [
    // 1
    { leadDelay: 18000, surgeAlBajas: 2,
      goteo:[{ type:'basic', count:2, delay:8500, row:2 }],
      surge:[{ type:'basic', count:3, delay:2500, row:2 }] },
    // 2
    { leadDelay: 6000, surgeAlBajas: 5,
      goteo:[{ type:'basic', count:4, delay:1800 }, { type:'fast', count:1, delay:1600 }],
      surge:[{ type:'basic', count:6, delay:800 }, { type:'fast', count:2, delay:900 }] },
    // 3
    { leadDelay: 6000, surgeAlBajas: 6,
      goteo:[{ type:'fast', count:3, delay:1100 }, { type:'basic', count:3, delay:1300 }],
      surge:[{ type:'fast', count:6, delay:130 }, { type:'basic', count:4, delay:160 }] },
    // 4
    { leadDelay: 6000, surgeAlBajas: 7,
      goteo:[{ type:'basic', count:6, delay:1100 }, { type:'tank', count:1, delay:2000 }],
      surge:[{ type:'basic', count:8, delay:140 }, { type:'tank', count:2, delay:350 }] },
    // 5
    { leadDelay: 6000, surgeAlBajas: 7,
      goteo:[{ type:'fast', count:5, delay:900 }, { type:'tank', count:2, delay:2200 }],
      surge:[{ type:'fast', count:8, delay:120 }, { type:'tank', count:3, delay:320 }] },
    // 6
    { leadDelay: 6000, surgeAlBajas: 9,
      goteo:[{ type:'basic', count:6, delay:950 }, { type:'fast', count:3, delay:800 }],
      surge:[{ type:'basic', count:10, delay:110 }, { type:'fast', count:5, delay:100 }] },
    // 7
    { leadDelay: 6000, surgeAlBajas: 8,
      goteo:[{ type:'healer', count:2, delay:1500 }, { type:'tank', count:2, delay:2000 }, { type:'basic', count:4, delay:900 }],
      surge:[{ type:'healer', count:3, delay:180 }, { type:'tank', count:3, delay:300 }, { type:'basic', count:6, delay:120 }] },
    // 8
    { leadDelay: 6000, surgeAlBajas: 10,
      goteo:[{ type:'fast', count:7, delay:750 }, { type:'healer', count:3, delay:1200 }],
      surge:[{ type:'fast', count:12, delay:90 }, { type:'healer', count:4, delay:160 }] },
    // 9
    { leadDelay: 6000, surgeAlBajas: 10,
      goteo:[{ type:'tank', count:4, delay:1800 }, { type:'fast', count:6, delay:650 }],
      surge:[{ type:'tank', count:5, delay:260 }, { type:'fast', count:10, delay:90 }, { type:'healer', count:3, delay:180 }] },
    // 10 — jefe final
    { leadDelay: 6000, surgeAlBajas: 9,
      goteo:[{ type:'tank', count:3, delay:1600 }, { type:'fast', count:6, delay:650 }],
      surge:[{ type:'boss', count:1, delay:0 }, { type:'tank', count:5, delay:260 }, { type:'fast', count:12, delay:80 }] },
  ];
}
