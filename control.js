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
function iniciarJuego() {
  bucleIniciado = false;
  iniciarEstado();
  renderizarTienda();
  actualizarHerramientas();
  actualizarHUD();
  elEstadoOleada.textContent = 'Inicia la oleada para desplegar wifus';
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
// EVENTOS DE BOTONES
// ──────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', iniciarJuego);
document.getElementById('btn-how').addEventListener('click', () => mostrarPantalla('screen-how'));
document.getElementById('btn-back').addEventListener('click', () => mostrarPantalla('screen-start'));

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
  mostrarPantalla('screen-start');
});

document.getElementById('btn-retry').addEventListener('click', iniciarJuego);
document.getElementById('btn-menu-go').addEventListener('click', () => mostrarPantalla('screen-start'));
document.getElementById('btn-play-again').addEventListener('click', iniciarJuego);
document.getElementById('btn-menu-win').addEventListener('click', () => mostrarPantalla('screen-start'));

// ──────────────────────────────────────────────
// INICIALIZACIÓN
// ──────────────────────────────────────────────
mostrarPantalla('screen-start');
