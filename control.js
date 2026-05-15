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
    `Llegaste al nivel <strong>${ESTADO.nivel}</strong>`;
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
function iniciarJuego(nivelInicial = 1) {
  const nivelElegido = limitarNivel(nivelInicial);
  const defNivel = NIVELES.find(nivel => nivel.id === nivelElegido) || NIVELES[0];
  const progreso = obtenerProgreso();
  bucleIniciado = false;
  iniciarEstado();
  ESTADO.ejecucionNivel = performance.now();
  ESTADO.nivel = defNivel.id;
  ESTADO.nivelActual = defNivel;
  ESTADO.oro = defNivel.oroInicial;
  ESTADO.faseIndice = -1;
  ESTADO.faseActual = null;
  ESTADO.faseActiva = false;
  ESTADO.nivelCompleto = false;
  ESTADO.bajasNivel = 0;
  ESTADO.zombisTotalesNivel = contarZombisNivel(defNivel);
  ESTADO.carrilesActivos = [...defNivel.carrilesActivos];
  ESTADO.cartasDisponibles = [...new Set(defNivel.cartasIniciales)];
  ESTADO.herramientasDisponibles = [...(defNivel.herramientasIniciales || ['recolocar', 'quitar'])];
  ESTADO.recompensaPendiente = defNivel.recompensaCarta;
  ESTADO.recompensaCaida = null;
  ESTADO.misilesDefensa = Array(FILAS).fill(false).map((_, fila) => ESTADO.carrilesActivos.includes(fila));
  crearUnidadesIniciales(defNivel);
  prepararTutorialNivel(defNivel);
  prepararJuegoVisual();
  if (defNivel.id === 1) {
    comenzarNivelActual({ conFundido: true });
  } else {
    mostrarBriefingNivel();
  }
}

function prepararJuegoVisual() {
  renderizarTienda();
  actualizarHerramientas();
  actualizarHUD();
  actualizarBotonFase();
}

function comenzarNivelActual(opciones = {}) {
  ESTADO.ejecucionNivel = performance.now();
  ESTADO.pausado = false;
  mostrarPantalla('screen-game');
  if (opciones.conFundido) reproducirFundidoEntradaNivel();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      redimensionarLienzo();
      ESTADO.ultimoTiempo = performance.now();
      if (idAnimacion) cancelAnimationFrame(idAnimacion);
      idAnimacion = requestAnimationFrame(cicloJuego);
      bucleIniciado = true;
      if (!iniciarTutorialNivel()) iniciarSiguienteFase();
    });
  });
}

function reproducirFundidoEntradaNivel() {
  if (!fundidoNivel) return;
  fundidoNivel.classList.remove('hidden');
  fundidoNivel.style.animation = 'none';
  fundidoNivel.offsetHeight;
  fundidoNivel.style.animation = '';
  setTimeout(() => fundidoNivel.classList.add('hidden'), 1700);
}

function crearUnidadesIniciales(nivel) {
  (nivel.unidadesIniciales || []).forEach(unidad => {
    const def = DEF_CHICAS.find(chica => chica.id === unidad.id);
    if (!def) return;
    ESTADO.chicas.push(crearInstanciaChica(def, unidad.col, unidad.fila, {
      tutorialDestino: unidad.tutorialDestino || null,
    }));
  });
}

function crearInstanciaChica(def, col, fila, extra = {}) {
  return {
    def,
    col,
    fila,
    vida: def.vida,
    vidaMax: def.vida,
    enfriamiento: def.primerIntervaloOro ?? def.intervaloOro ?? 0,
    objetivo: null,
    animacion: 'idle',
    disparoAnim: 0,
    disparosRafaga: def.rafagaDisparos || 1,
    ...extra,
  };
}

function prepararTutorialNivel(nivel) {
  const tutorial = nivel.tutorial;
  ESTADO.tutorial = tutorial
    ? {
      ...tutorial,
      activo: true,
      finalizado: false,
      esperaHerramienta: tutorial.tipo === 'reubicar',
    }
    : null;
}

function iniciarTutorialNivel() {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo) return false;

  if (tutorial.tipo === 'colocar') {
    mostrarCapitana(tutorial.intro);
    pistaTienda.textContent = 'Coloca la Pistolera en la casilla marcada';
    return true;
  }

  if (tutorial.tipo === 'reubicar') {
    mostrarCapitana(tutorial.intro);
    pistaTienda.textContent = 'Pulsa la herramienta ↔';
    actualizarHerramientas();
    return true;
  }

  if (tutorial.tipo === 'misil') {
    ESTADO.herramientasDisponibles = [];
    mostrarCapitana('');
    pistaTienda.textContent = 'Observa la defensa del nexo';
    lanzarAmenazaTutorialMisil(tutorial);
    return true;
  }

  if (tutorial.tipo === 'capitana') {
    mostrarDialogoCapitanaContinuable(tutorial.intro, () => {
      tutorial.activo = false;
      ocultarCapitana();
      iniciarSiguienteFase();
    });
    return true;
  }

  mostrarCapitana(tutorial.intro);
  return false;
}

function notificarHerramientaTutorial(herramienta) {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo || tutorial.tipo !== 'reubicar') return;
  if (herramienta !== tutorial.herramientaRequerida || !ESTADO.herramientaActiva) return;
  tutorial.esperaHerramienta = false;
  mostrarCapitana(tutorial.herramientaActiva);
  pistaTienda.textContent = 'Reubica las Streamer en las casillas marcadas';
}

function completarTutorialNivel(mensaje = null) {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo || tutorial.finalizado) return;
  tutorial.finalizado = true;
  tutorial.bloqueaTienda = false;
  tutorial.activo = false;
  ESTADO.faseActiva = false;
  ESTADO.oleadaActiva = false;
  ESTADO.herramientaActiva = null;
  ESTADO.chicaSeleccionada = null;
  ESTADO.celdaPreviaColocacion = null;
  ESTADO.celdaPreviaHerramienta = null;

  if (ESTADO.nivelActual?.herramientasPostTutorial) {
    ESTADO.herramientasDisponibles = [...ESTADO.nivelActual.herramientasPostTutorial];
  }

  mostrarCapitana(mensaje || tutorial.completado || '');
  pistaTienda.textContent = 'Selecciona una chica';
  actualizarHerramientas();
  renderizarTienda();
  actualizarHUD();

  if (tutorial.completadoEspera) {
    mostrarDialogoCapitanaContinuable(mensaje || tutorial.completado || '', () => {
      ocultarCapitana();
      iniciarSiguienteFase();
    });
    return;
  }

  const ejecucion = ESTADO.ejecucionNivel;
  setTimeout(() => {
    if (ESTADO.ejecucionNivel !== ejecucion || ESTADO.nivelCompleto) return;
    ocultarCapitana();
    iniciarSiguienteFase();
  }, ESTADO.nivel === 2 ? 4200 : 3000);
}

function lanzarAmenazaTutorialMisil(tutorial) {
  const defTipo = TIPOS_ZOMBI.find(zombi => zombi.id === tutorial.zombiesAmenaza?.type);
  if (!defTipo) return;

  const fila = tutorial.filaAmenazada ?? ESTADO.carrilesActivos[0];
  const count = tutorial.zombiesAmenaza?.count || 1;
  for (let i = 0; i < count; i++) {
    ESTADO.zombis.push({
      def: defTipo,
      x: celdaX(COL_NEXO) + ESTADO.anchoCelda * (0.72 + i * 0.08),
      fila,
      vida: defTipo.vida,
      vidaMax: defTipo.vida,
      danio: defTipo.danio,
      enfAtaque: 0,
      aturdido: 0,
      noCuentaProgreso: true,
    });
  }
}

function revisarTutorialMisil(fila) {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo || tutorial.tipo !== 'misil') return;
  if (fila !== tutorial.filaAmenazada) return;
  tutorial.activo = false;

  mostrarDialogoCapitanaContinuable(tutorial.despuesMisil, () => {
    mostrarDialogoCapitanaContinuable(tutorial.completado, () => {
      tutorial.finalizado = true;
      tutorial.bloqueaTienda = false;
      ESTADO.herramientasDisponibles = [...(ESTADO.nivelActual.herramientasPostTutorial || ['recolocar', 'quitar'])];
      pistaTienda.textContent = 'Selecciona una chica';
      actualizarHerramientas();
      renderizarTienda();
      ocultarCapitana();
      iniciarSiguienteFase();
    }, { oro: tutorial.oro || 0 });
  });
}

function revisarTutorialColocacion(chica) {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo || tutorial.tipo !== 'colocar') return;
  const objetivo = tutorial.objetivo;
  if (
    chica.def.id === objetivo.unidad &&
    chica.col === objetivo.col &&
    chica.fila === objetivo.fila
  ) {
    completarTutorialNivel(tutorial.completado);
  }
}

function revisarTutorialReubicacion() {
  const tutorial = ESTADO.tutorial;
  if (!tutorial?.activo || tutorial.tipo !== 'reubicar') return;
  const pendientes = ESTADO.chicas.filter(chica => {
    const destino = chica.tutorialDestino;
    return destino && (chica.col !== destino.col || chica.fila !== destino.fila);
  });
  if (pendientes.length === 0) completarTutorialNivel(tutorial.completado);
}

function mostrarBriefingNivel() {
  const nivel = ESTADO.nivelActual;
  briefingKicker.textContent = nivel.nombre;
  briefingTitle.textContent = 'Amenaza detectada';
  briefingSummary.textContent = `Tendrás ${nivel.oroInicial} de oro y ${nivel.cartasIniciales.length} carta inicial.`;

  briefingLanes.innerHTML = '';
  for (let fila = 0; fila < FILAS; fila++) {
    const celda = document.createElement('span');
    celda.className = `briefing-lane${nivel.carrilesActivos.includes(fila) ? ' active' : ''}`;
    celda.textContent = fila + 1;
    briefingLanes.appendChild(celda);
  }

  const resumenZombis = obtenerResumenZombisNivel(nivel);
  briefingZombies.innerHTML = '';
  resumenZombis.forEach(({ def, count }) => {
    const fila = document.createElement('div');
    fila.className = 'briefing-zombie';
    fila.innerHTML = `
      <span class="briefing-zombie-icon">${def.emoji}</span>
      <span>
        <strong>${def.nombre}</strong>
        <small>Vida ${def.vida} · Daño ${def.danio}</small>
      </span>
      <span class="briefing-zombie-count">x${count}</span>`;
    briefingZombies.appendChild(fila);
  });

  mostrarPantalla('screen-level-briefing');
}

function obtenerResumenZombisNivel(nivel) {
  const conteo = new Map();
  nivel.fases.forEach(fase => {
    fase.grupos.forEach(grupo => {
      conteo.set(grupo.type, (conteo.get(grupo.type) || 0) + grupo.count);
    });
  });
  return [...conteo.entries()]
    .map(([id, count]) => ({ def: TIPOS_ZOMBI.find(z => z.id === id), count }))
    .filter(item => item.def);
}

function contarZombisNivel(nivel) {
  return nivel.fases.reduce((total, fase) => (
    total + fase.grupos.reduce((faseTotal, grupo) => faseTotal + grupo.count, 0)
  ), 0);
}

// ──────────────────────────────────────────────
// MENU PRINCIPAL
// ──────────────────────────────────────────────
function actualizarMenuPrincipal() {
  const progreso = obtenerProgreso();
  const etiqueta = document.getElementById('btn-play-label');
  const estado = document.getElementById('menu-status');
  etiqueta.textContent = progreso.nivelDesbloqueado > 1 ? 'Continuar' : 'Iniciar';
  estado.textContent = `Nivel ${progreso.nivelDesbloqueado}/${TOTAL_NIVELES} · ${progreso.cartasDesbloqueadas.length} cartas · Modo ${progreso.modo}`;
  document.body.classList.toggle('menu-motion-off', !progreso.opciones.movimientoMenu);
}

function mostrarMenuPrincipal() {
  if (idAnimacion) {
    cancelAnimationFrame(idAnimacion);
    idAnimacion = null;
  }
  if (ESTADO) ESTADO.ejecucionNivel = 0;
  actualizarMenuPrincipal();
  mostrarPantalla('screen-start');
}

function renderizarNiveles() {
  const progreso = obtenerProgreso();
  const contenedor = document.getElementById('level-grid');
  contenedor.innerHTML = '';
  for (let nivel = 1; nivel <= TOTAL_NIVELES; nivel++) {
    const desbloqueado = nivel <= progreso.nivelDesbloqueado;
    const boton = document.createElement('button');
    boton.className = `level-btn${desbloqueado ? '' : ' locked'}`;
    boton.type = 'button';
    boton.disabled = !desbloqueado;
    boton.innerHTML = `<strong>${nivel}</strong><span>${desbloqueado ? 'Disponible' : 'Bloqueado'}</span>`;
    if (desbloqueado) boton.addEventListener('click', () => iniciarJuego(nivel));
    contenedor.appendChild(boton);
  }
}

function mostrarColeccionUnidades(cartaNuevaId = null) {
  ESTADO.pausado = true;
  const progreso = obtenerProgreso();
  const cartas = progreso.cartasDesbloqueadas;
  const cartaNueva = DEF_CHICAS.find(def => def.id === cartaNuevaId);
  kickerColeccion.textContent = cartaNueva ? 'Carta nueva desbloqueada' : 'Coleccion de unidades';
  resumenColeccion.textContent = cartaNueva
    ? `${cartaNueva.nombre} se unió a tu mazo.`
    : 'Estas son tus cartas disponibles.';

  gridColeccion.innerHTML = '';
  cartas
    .map(id => DEF_CHICAS.find(def => def.id === id))
    .filter(Boolean)
    .forEach(def => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = `collection-card${def.id === cartaNuevaId ? ' new' : ''}`;
      boton.innerHTML = `
        <span class="collection-icon">${renderizarVisualTienda(def)}</span>
        <strong>${def.nombre}</strong>
        <small>${def.desc}</small>`;
      boton.addEventListener('click', () => mostrarDetalleCarta(def));
      gridColeccion.appendChild(boton);
    });

  mostrarDetalleCarta(cartaNueva || DEF_CHICAS.find(def => def.id === cartas[0]));
  const siguienteNivel = NIVELES.find(nivel => nivel.id === ESTADO.nivelActual?.siguienteNivel);
  btnSiguienteNivel.disabled = !siguienteNivel;
  btnSiguienteNivel.textContent = siguienteNivel ? 'Siguiente nivel' : 'Sin siguiente nivel';
  mostrarPantalla('screen-collection');
}

function mostrarDialogoCapitanaContinuable(mensaje, alContinuar, opciones = {}) {
  if (opciones.oro) {
    ESTADO.oro += opciones.oro;
    crearParticula(lienzo.width * 0.5, ESTADO.offsetY + ESTADO.altoCelda, `+${opciones.oro}💰`, PALETA.oro, true);
    actualizarHUD();
    renderizarTienda();
  }

  ESTADO.dialogoCapitanaContinuable = {
    activo: true,
    alContinuar,
  };
  mostrarCapitana(`${mensaje}  [Clic o Enter]`);
}

function avanzarDialogoCapitana() {
  const dialogo = ESTADO.dialogoCapitanaContinuable;
  if (!dialogo?.activo) return false;

  ESTADO.dialogoCapitanaContinuable = null;
  ocultarCapitana();
  if (typeof dialogo.alContinuar === 'function') dialogo.alContinuar();
  return true;
}

function mostrarDialogoEntreFases(faseIndiceTerminada, continuar) {
  const evento = ESTADO.nivelActual?.tutorial?.entreFases?.[faseIndiceTerminada];
  if (!evento) return false;
  mostrarDialogoCapitanaContinuable(evento.mensaje, continuar, { oro: evento.oro || 0 });
  return true;
}

function mostrarDialogoFinNivel(continuar) {
  const evento = ESTADO.nivelActual?.tutorial?.finNivel;
  if (!evento) return false;
  mostrarDialogoCapitanaContinuable(evento.mensaje, continuar);
  return true;
}

function reproducirCinematicaCarta(cartaId, alTerminar) {
  const def = DEF_CHICAS.find(chica => chica.id === cartaId);
  if (!def || !cinematicaRecompensa || !cartaGrandeRecompensa) {
    if (typeof alTerminar === 'function') alTerminar();
    return;
  }

  cartaGrandeRecompensa.innerHTML = `
    <span>${renderizarVisualTienda(def)}</span>
    <strong>${def.nombre}</strong>
    <small>${def.desc}</small>`;
  cinematicaRecompensa.classList.remove('hidden');

  setTimeout(() => {
    cinematicaRecompensa.classList.add('hidden');
    if (typeof alTerminar === 'function') alTerminar();
  }, 2100);
}

function mostrarDetalleCarta(def) {
  if (!def) {
    detalleColeccion.textContent = 'Sin cartas desbloqueadas.';
    return;
  }

  detalleColeccion.innerHTML = `
    <div class="detail-head">
      <span class="detail-icon">${renderizarVisualTienda(def)}</span>
      <span>
        <strong>${def.nombre}</strong>
        <small>${def.desc}</small>
      </span>
    </div>
    <div class="detail-stats">
      <span>Vida ${def.vida}</span>
      <span>Costo ${def.costo}</span>
      <span>Daño ${def.danio}</span>
      <span>Alcance ${def.alcance}</span>
    </div>`;
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
  iniciarJuego(progreso.nivelDesbloqueado);
});

document.addEventListener('click', evento => {
  if (!avanzarDialogoCapitana()) return;
  evento.preventDefault();
  evento.stopPropagation();
}, true);

document.addEventListener('keydown', evento => {
  if (evento.key !== 'Enter') return;
  if (!avanzarDialogoCapitana()) return;
  evento.preventDefault();
  evento.stopPropagation();
}, true);
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
btnBriefingStart.addEventListener('click', comenzarNivelActual);
btnBriefingExit.addEventListener('click', mostrarMenuPrincipal);
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

document.getElementById('btn-retry').addEventListener('click', () => iniciarJuego(Math.max(1, ESTADO.nivel || 1)));
document.getElementById('btn-menu-go').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-play-again').addEventListener('click', () => iniciarJuego(1));
document.getElementById('btn-menu-win').addEventListener('click', mostrarMenuPrincipal);
document.getElementById('btn-collection-menu').addEventListener('click', mostrarMenuPrincipal);
btnSiguienteNivel.addEventListener('click', () => {
  const siguiente = ESTADO.nivelActual?.siguienteNivel;
  if (siguiente) iniciarJuego(siguiente);
});

// ──────────────────────────────────────────────
// INICIALIZACIÓN
// ──────────────────────────────────────────────
actualizarMenuPrincipal();
mostrarPantalla('screen-start');
