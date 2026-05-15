/* =====================================================
   WIFUS contra ZOMBIES — chicas.js
   Definiciones de unidades jugables y carga de sprites
   ===================================================== */

"use strict";

const DEF_CHICAS = [
  {
    id: "shooter",
    nombre: "Stremer",
    emoji: "🌸",
    costo: 500,
    vida: 80,
    danio: 0,
    alcance: 0,
    cadencia: 0,
    velProyectil: 0,
    aoe: 0,
    oroIngreso: 250,
    primerIntervaloOro: 8,
    intervaloOro: 20,
    tiempoEspera: 7.5,
    icono: "Personajes/Streamer/Streamer.png",
    sprite: {
      src: "Personajes/Streamer/Streamer_SS.png",
      cols: 6,
      filas: 6,
      frames: 36,
      fps: 14,
    },
    color: "#66f6ff",
    desc: "ORO:+250 10s/24s",
  },
  {
    id: "archer",
    nombre: "Pistolera",
    emoji: "🏹",
    costo: 1000,
    vida: 60,
    danio: 1,
    alcance: COLUMNAS,
    cadencia: 0.8,
    velProyectil: 6,
    tiempoEspera: 8,
    aoe: 0,
    icono: "Personajes/Pistolera/Pistolera.png",
    spriteEstados: {
      idle: {
        src: "Personajes/Pistolera/Pistolera_Idle.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 12,
      },
      apuntando: {
        src: "Personajes/Pistolera/Pistolera_Apuntando.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 14,
      },
      disparo: {
        src: "Personajes/Pistolera/Pistolera_Disparo.png",
        cols: 5,
        filas: 5,
        frames: 25,
        fps: 22,
        duracion: 0.35,
      },
    },
    color: "#ffb300",
    desc: "ATK:1 RNG:FULL COST:150",
  },
  {
    id: "mage",
    nombre: "Cazadora",
    emoji: "🔮",
    costo: 1500,
    vida: 55,
    danio: 25,
    alcance: 3,
    cadencia: 1,
    velProyectil: 3.5,
    aoe: 0,
    rafagaDisparos: 2,
    intervaloRafaga: 0.18,
    tiempoEspera: 10,
    cooldownRafaga: 2,
    icono: "Personajes/Cazadora/Cazadora.png",
    spriteEstados: {
      idle: {
        src: "Personajes/Cazadora/Cazadora_Idle.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 12,
      },
      apuntando: {
        src: "Personajes/Cazadora/Cazadora_Apuntando.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 14,
      },
      disparo: {
        src: "Personajes/Cazadora/Cazadora_Disparo.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 22,
        duracion: 0.25,
      },
    },
    color: "#b388ff",
    desc: "ATK:30 x2 CD:2s",
  },
  {
    id: "tank",
    nombre: "Tanque",
    emoji: "🛡️",
    costo: 900,
    vida: 300,
    danio: 8,
    alcance: 1.5,
    cadencia: 1.5,
    velProyectil: 3,
    aoe: 0,
    icono: "Personajes/Tanque/Tanque.png",
    spriteEstados: {
      idle: {
        src: "Personajes/Tanque/Tanque_Idle.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 12,
      },
    },
    color: "#4fc3f7",
    desc: "HP:300 ATK:8 NEAR",
  },
  {
    id: "healer",
    nombre: "Doctora",
    emoji: "💊",
    costo: 800,
    vida: 35,
    danio: 0,
    alcance: 1,
    cadencia: 0.5,
    velProyectil: 0,
    aoe: 0,
    curacionPct: 0.1,
    tiempoEspera: 30,
    icono: "Personajes/Doctora/Doctora.png",
    spriteEstados: {
      idle: {
        src: "Personajes/Doctora/Doctora_Idle.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 12,
      },
      disparo: {
        src: "Personajes/Doctora/Doctora_Curar.png",
        cols: 6,
        filas: 6,
        frames: 36,
        fps: 18,
        duracion: 0.45,
      },
    },
    color: "#39e87a",
    desc: "HEAL:10% 2s ESP:30s",
  },
  {
    id: "bomber",
    nombre: "Bomber",
    emoji: "💣",
    costo: 1200,
    vida: 65,
    danio: 50,
    alcance: 2,
    cadencia: 0.35,
    velProyectil: 2.5,
    aoe: 1.5,
    color: "#ff8f00",
    desc: "ATK:50 AOE:1.5",
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

DEF_CHICAS.forEach((def) => {
  if (def.icono) cargarImagenJuego(def.icono);
  if (def.sprite) def.sprite.imagen = cargarImagenJuego(def.sprite.src);
  if (def.spriteEstados) {
    Object.values(def.spriteEstados).forEach((sprite) => {
      sprite.imagen = cargarImagenJuego(sprite.src);
    });
  }
});
