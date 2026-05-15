/* =====================================================
   WIFUS contra ZOMBIES — control.js
   Inicio del juego, fin del juego, victoria,
   eventos de botones e inicialización general
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// JUEGO PERDIDO (GAME OVER)
// ──────────────────────────────────────────────
function juegoPerdido() {
  ESTADO.pausado = true;
  document.getElementById('go-wave-reached').innerHTML =
    `Llegaste a la oleada <strong>${ESTADO.oleada}</strong>`;
  mostrarPantalla('screen-gameover');
}

// ──────────────────────────────────────────────
// VICTORIA
// ──────────────────────────────────────────────
function mostrarVictoria() {
  ESTADO.pausado = true;
  mostrarPantalla('screen-win');
}

// ──────────────────────────────────────────────
// INICIAR PARTIDA NUEVA
// ──────────────────────────────────────────────
let bucleIniciado = false;
function iniciarJuego(oleadaInicial = 1) {
  const oleadaElegida = limitarOleada(oleadaInicial);
  bucleIniciado = false;
  iniciarEstado();
  ESTADO.oleada = oleadaElegida - 1;
  renderizarTienda();
  actualizarHerramientas();
  actualizarHUD();
  elEstadoOleada.textContent = `Inicia la oleada ${oleadaElegida} para desplegar wifus`;
  btnIniciarOleada.disabled = false;

  mostrarPantalla('screen-game');

  // esperar un frame de layout, luego redimensionar y arrancar el bucle
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      redimensionarLienzo();
      ESTADO.ultimoTiempo = performance.now();
      if (idAnimacion) cancelAnimationFrame(idAnimacion);
      idAnimacion = requestAnimationFrame(cicloJuego);
      bucleIniciado = true;
    });
  });
}

// ──────────────────────────────────────────────
// MENU PRINCIPAL
// ──────────────────────────────────────────────
function actualizarMenuPrincipal() {
  const progreso = obtenerProgreso();
  const etiqueta = document.getElementById('btn-play-label');
  const estado = document.getElementById('menu-status');
  etiqueta.textContent = progreso.oleadaDesbloqueada > 1 ? 'Continuar' : 'Iniciar';
  estado.textContent = `Oleada ${progreso.oleadaDesbloqueada}/${TOTAL_OLEADAS} · Modo ${progreso.modo}`;
  document.body.classList.toggle('menu-motion-off', !progreso.opciones.movimientoMenu);
}

function mostrarMenuPrincipal() {
  actualizarMenuPrincipal();
  mostrarPantalla('screen-start');
}

function renderizarNiveles() {
  const progreso = obtenerProgreso();
  const contenedor = document.getElementById('level-grid');
  contenedor.innerHTML = '';
  for (let nivel = 1; nivel <= TOTAL_OLEADAS; nivel++) {
    const desbloqueado = nivel <= progreso.oleadaDesbloqueada;
    const boton = document.createElement('button');
    boton.className = `level-btn${desbloqueado ? '' : ' locked'}`;
    boton.type = 'button';
    boton.disabled = !desbloqueado;
    boton.innerHTML = `<strong>${nivel}</strong><span>${desbloqueado ? 'Disponible' : 'Bloqueado'}</span>`;
    if (desbloqueado) boton.addEventListener('click', () => iniciarJuego(nivel));
    contenedor.appendChild(boton);
  }
}

function mostrarNiveles() {
  renderizarNiveles();
  mostrarPantalla('screen-levels');
}

function actualizarModos() {
  const progreso = obtenerProgreso();
  document.querySelectorAll('[data-mode]').forEach(boton => {
    boton.classList.toggle('active', boton.dataset.mode === progreso.modo);
  });
}

function mostrarModos() {
  actualizarModos();
  mostrarPantalla('screen-modes');
}

function actualizarOpciones() {
  const progreso = obtenerProgreso();
  document.getElementById('opt-effects').checked = progreso.opciones.efectos;
  document.getElementById('opt-motion').checked = progreso.opciones.movimientoMenu;
}

function mostrarOpciones() {
  actualizarOpciones();
  mostrarPantalla('screen-options');
}

// ──────────────────────────────────────────────
// EVENTOS DE BOTONES
// ──────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  const progreso = obtenerProgreso();
  iniciarJuego(progreso.oleadaDesbloqueada);
});
document.getElementById('btn-levels').addEventListener('click', mostrarNiveles);
document.getElementById('btn-modes').addEventListener('click', mostrarModos);
document.getElementById('btn-options').addEventListener('click', mostrarOpciones);
document.getElementById('btn-how').addEventListener('click', () => mostrarPantalla('screen-how'));
document.getElementById('btn-back').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-back-levels').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-back-modes').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-back-options').addEventListener('click', mostrarMenuPrincipal);

document.querySelectorAll('[data-mode]').forEach(boton => {
  boton.addEventListener('click', () => {
    guardarModoJuego(boton.dataset.mode);
    actualizarModos();
    actualizarMenuPrincipal();
  });
});

document.getElementById('opt-effects').addEventListener('change', (evento) => {
  guardarOpcionJuego('efectos', evento.target.checked);
});
document.getElementById('opt-motion').addEventListener('change', (evento) => {
  guardarOpcionJuego('movimientoMenu', evento.target.checked);
  actualizarMenuPrincipal();
});
document.getElementById('btn-reset-progress').addEventListener('click', () => {
  reiniciarProgresoLocal();
  actualizarOpciones();
  actualizarMenuPrincipal();
  mostrarFlotante('Progreso reiniciado', '#00e5ff');
});

btnIniciarOleada.addEventListener('click', iniciarOleada);
btnHerramientaRecolocar.addEventListener('click', () => seleccionarHerramienta('recolocar'));
btnHerramientaQuitar.addEventListener('click', () => seleccionarHerramienta('quitar'));

document.getElementById('btn-pause').addEventListener('click', () => {
  ESTADO.pausado = true;
  mostrarPantalla('screen-pause');
});
document.getElementById('btn-resume').addEventListener('click', () => {
  ESTADO.pausado = false;
  mostrarPantalla('screen-game');
});
document.getElementById('btn-menu-from-pause').addEventListener('click', () => {
  ESTADO.pausado = false;
  mostrarMenuPrincipal();
});

document.getElementById('btn-retry').addEventListener('click', () => iniciarJuego(Math.max(1, ESTADO.oleada || 1)));
document.getElementById('btn-menu-go').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-play-again').addEventListener('click', () => iniciarJuego(1));
document.getElementById('btn-menu-win').addEventListener('click', mostrarMenuPrincipal);

// ──────────────────────────────────────────────
// INICIALIZACIÓN
// ──────────────────────────────────────────────
actualizarMenuPrincipal();
mostrarPantalla('screen-start');
