/* =====================================================
   WIFUS contra ZOMBIES — niveles.js
   Definiciones de niveles, fases y tutoriales
   ===================================================== */

"use strict";

const NIVELES = [
  {
    id: 1,
    nombre: "Nivel 1",
    oroInicial: 3000,
    carrilesActivos: [3],
    cartasIniciales: ["archer"],
    herramientasIniciales: [],
    recompensaCarta: null,
    siguienteNivel: 2,
    tutorial: {
      tipo: "colocar",
      bloqueaFases: true,
      bloqueaHerramientas: true,
      objetivo: { unidad: "archer", col: 1, fila: 3 },
      intro:
        "Cadete, ese carril es nuestro primer frente. Coloca una Pistolera en la casilla marcada.",
      completado:
        "Bien. Puedes colocar más unidades si quieres, pero el oro es limitado. Cada decisión cuenta.",
      entreFases: {
        0: {
          oro: 1000,
          mensaje:
            "Buen trabajo repeliendo el ataque. Una oleada de zombis se aproxima. Te transfiero 1,000 de oro: coloca otra unidad antes de que lleguen.",
        },
      },
      finNivel: {
        mensaje:
          "Misión cumplida. Gracias por defender el nexo, cadete. Con esto terminamos tu primera práctica.",
      },
    },
    fases: [
      {
        tipo: "ataque",
        nombre: "Ataque inicial",
        grupos: [
          {
            type: "basic",
            count: 2,
            minDelay: 4000,
            maxDelay: 6000,
            burstChance: 0.14,
            rows: [3],
          },
        ],
      },
      {
        tipo: "oleada",
        nombre: "Oleada final",
        grupos: [{ type: "basic", count: 3, delay: 1650, rows: [3] }],
      },
    ],
  },
  {
    id: 2,
    nombre: "Nivel 2",
    oroInicial: 1000,
    carrilesActivos: [2, 4],
    cartasIniciales: ["archer"],
    herramientasIniciales: ["recolocar"],
    herramientasPostTutorial: ["recolocar", "quitar"],
    recompensaCarta: "shooter",
    siguienteNivel: 3,
    unidadesIniciales: [
      {
        id: "shooter",
        col: COLUMNAS - 1,
        fila: 2,
        tutorialDestino: { col: 1, fila: 2 },
      },
      {
        id: "shooter",
        col: COLUMNAS - 1,
        fila: 4,
        tutorialDestino: { col: 1, fila: 4 },
      },
    ],
    tutorial: {
      tipo: "reubicar",
      bloqueaFases: true,
      bloqueaTienda: true,
      herramientaRequerida: "recolocar",
      intro:
        "Tenemos dos Streamer demasiado lejos del frente. Pulsa la herramienta de reubicar.",
      herramientaActiva:
        "Ahora levanta cada Streamer y muévela a la casilla marcada de su mismo carril.",
      completado:
        "Excelente. Las Streamer no atacan: generan oro durante los ataques y oleadas. Protegelas y usa ese ingreso para reforzar el carril. La herramienta X sirve para retirar unidades y recuperar una pequeña parte de su costo.",
      completadoEspera: true,
      finNivel: {
        mensaje:
          "Has rescatado a las Streamer. Desde ahora estarán en nuestro equipo. Recoge su carta y avancemos.",
      },
    },
    fases: [
      {
        tipo: "ataque",
        nombre: "Ataque de prueba",
        grupos: [
          {
            type: "basic",
            count: 5,
            minDelay: 5000,
            maxDelay: 8500,
            burstChance: 0.12,
            rows: [2, 4],
          },
        ],
      },
      {
        tipo: "oleada",
        nombre: "Herramientas en campo",
        grupos: [{ type: "basic", count: 7, delay: 1600, rows: [2, 4] }],
      },
    ],
  },
  {
    id: 3,
    nombre: "Nivel 3",
    oroInicial: 0,
    carrilesActivos: [1, 2, 3, 4, 5],
    cartasIniciales: ["archer", "shooter"],
    herramientasIniciales: [],
    herramientasPostTutorial: ["recolocar", "quitar"],
    recompensaCarta: "mage",
    siguienteNivel: 4,
    unidadesIniciales: [
      { id: "shooter", col: 2, fila: 2 },
      { id: "shooter", col: 2, fila: 4 },
      { id: "archer", col: 4, fila: 1 },
      { id: "archer", col: 5, fila: 3 },
      { id: "archer", col: 4, fila: 5 },
    ],
    tutorial: {
      tipo: "misil",
      bloqueaFases: true,
      bloqueaTienda: true,
      filaAmenazada: 1,
      zombiesAmenaza: { type: "basic", count: 5 },
      despuesMisil:
        "Ese misil nos salvó. Todos los carriles tienen una defensa de emergencia, pero solo funciona una vez.",
      completado:
        "Si esa defensa se pierde, lo único que queda entre los zombis y el nexo eres tú. Prepárate. Te transfiero 2,000 de oro.",
      oro: 2000,
      finNivel: {
        mensaje:
          "La Cazadora se une al escuadrón. Dispara ráfagas de alto daño contra objetivos prioritarios, pero necesita tiempo para recargar. Recoge su carta.",
      },
    },
    fases: [
      {
        tipo: "ataque",
        nombre: "Ataque combinado",
        grupos: [
          {
            type: "basic",
            count: 8,
            minDelay: 4500,
            maxDelay: 8000,
            burstChance: 0.16,
            rows: [1, 2, 3, 4, 5],
          },
        ],
      },
      {
        tipo: "oleada",
        nombre: "Oleada de graduacion",
        grupos: [
          { type: "basic", count: 10, delay: 1400, rows: [1, 2, 3, 4, 5] },
        ],
      },
    ],
  },
  {
    id: 4,
    nombre: "Nivel 4",
    oroInicial: 1500,
    carrilesActivos: [0, 1, 2, 3, 4, 5, 6],
    cartasIniciales: ["archer", "shooter", "mage"],
    herramientasIniciales: ["recolocar", "quitar"],
    recompensaCarta: null,
    siguienteNivel: null,
    tutorial: {
      tipo: "capitana",
      bloqueaFases: false,
      intro:
        "Ahora tienes todos los carriles abiertos. Te asigno 1,500 de oro para iniciar: administra tu formación y defiende el nexo.",
    },
    fases: [
      {
        tipo: "ataque",
        nombre: "Frente abierto",
        grupos: [
          {
            type: "basic",
            count: 10,
            minDelay: 14000,
            maxDelay: 16000,
            burstChance: 0.05,
            rows: [0, 1, 2, 3, 4, 5, 6],
          },
        ],
      },
      {
        tipo: "oleada",
        nombre: "Todos los carriles",
        grupos: [
          {
            type: "basic",
            count: 14,
            delay: 1200,
            rows: [0, 1, 2, 3, 4, 5, 6],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    nombre: "Nivel 5",
    oroInicial: 1500,
    carrilesActivos: [0, 1, 2, 3, 4, 5, 6],
    cartasIniciales: ["archer", "shooter", "mage"],
    herramientasIniciales: ["recolocar", "quitar"],
    recompensaCarta: null,
    siguienteNivel: null,
    fases: [
      {
        tipo: "ataque",
        nombre: "Frente abierto",
        grupos: [
          {
            type: "basic",
            count: 15,
            minDelay: 14000,
            maxDelay: 16000,
            burstChance: 0.05,
            rows: [0, 1, 2, 3, 4, 5, 6],
          },
        ],
      },
      {
        tipo: "oleada",
        nombre: "Todos los carriles",
        grupos: [
          {
            type: "basic",
            count: 20,
            delay: 1200,
            rows: [0, 1, 2, 3, 4, 5, 6],
          },
        ],
      },
    ],
  },
];
