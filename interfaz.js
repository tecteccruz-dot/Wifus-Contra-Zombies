/* =====================================================
   WIFUS contra ZOMBIES — interfaz.js
   Control de pantallas, HUD, tienda y mensajes flotantes
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// CAMBIO DE PANTALLAS
// ──────────────────────────────────────────────
function mostrarPantalla(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ──────────────────────────────────────────────
// MENSAJES FLOTANTES (TOAST)
// ──────────────────────────────────────────────
let temporizadorFlotante = null;
function mostrarFlotante(mensaje, color = '#00e5ff') {
  elFlotante.textContent = mensaje;
  elFlotante.style.borderColor = color;
  elFlotante.style.color = '#fff';
  elFlotante.classList.remove('hidden');
  clearTimeout(temporizadorFlotante);
  temporizadorFlotante = setTimeout(() => elFlotante.classList.add('hidden'), 1800);
}

let temporizadorAlertaPeligro = null;
function mostrarAlertaPeligro(mensaje = 'OLEADA DE ZOMBIS') {
  if (!alertaPeligro || !textoAlertaPeligro) return;

  textoAlertaPeligro.textContent = mensaje;
  alertaPeligro.classList.remove('hidden', 'danger-alert-show');
  alertaPeligro.offsetHeight;
  alertaPeligro.classList.add('danger-alert-show');
  document.body.classList.add('danger-screen-pulse');

  clearTimeout(temporizadorAlertaPeligro);
  temporizadorAlertaPeligro = setTimeout(() => {
    alertaPeligro.classList.add('hidden');
    alertaPeligro.classList.remove('danger-alert-show');
    document.body.classList.remove('danger-screen-pulse');
  }, 2600);
}

// ──────────────────────────────────────────────
// ACTUALIZAR HUD
// ──────────────────────────────────────────────
function actualizarHUD() {
  elOro.textContent       = Math.floor(ESTADO.oro);
  elVidaNexo.textContent  = Math.max(0, ESTADO.vidaNexo);
  elOleada.textContent    = ESTADO.faseActual
    ? `${ESTADO.nivel}-${ESTADO.faseIndice + 1}`
    : `${ESTADO.nivel}/${TOTAL_NIVELES}`;
  renderizarProgresoNivel();
}

function renderizarProgresoNivel() {
  if (!barraProgresoNivel) return;

  const fases = ESTADO.nivelActual?.fases || [];
  const totalZombis = Math.max(1, ESTADO.zombisTotalesNivel || contarZombisNivel(ESTADO.nivelActual || { fases: [] }));
  const progreso = ESTADO.nivelCompleto
    ? 1
    : Math.min(1, (ESTADO.bajasNivel || 0) / totalZombis);

  barraProgresoNivel.innerHTML = `
    <div class="progress-zombie">🧟</div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${Math.round(progreso * 100)}%"></div>
      ${renderizarMarcadoresNivel(fases, totalZombis)}
    </div>`;
}

function renderizarMarcadoresNivel(fases, totalZombis) {
  let acumulado = 0;
  return fases.map((fase, indice) => {
    acumulado += contarZombisFase(fase);
    return renderizarMarcadorFase(fase, indice, acumulado, totalZombis);
  }).join('');
}

function contarZombisFase(fase) {
  return fase.grupos.reduce((total, grupo) => total + grupo.count, 0);
}

function renderizarMarcadorFase(fase, indice, acumulado, totalZombis) {
  const left = totalZombis <= 0 ? 100 : (acumulado / totalZombis) * 100;
  const clase = [
    'progress-marker',
    fase.tipo === 'oleada' ? 'wave' : 'attack',
    (ESTADO.bajasNivel || 0) >= acumulado || ESTADO.nivelCompleto ? 'done' : '',
    indice === ESTADO.faseIndice && ESTADO.faseActiva ? 'current' : '',
  ].filter(Boolean).join(' ');
  const icono = fase.tipo === 'oleada' ? '⚑' : '•';
  return `<span class="${clase}" style="left:${left}%">${icono}</span>`;
}

function actualizarHerramientas() {
  const disponibles = ESTADO.herramientasDisponibles || [];
  btnHerramientaRecolocar.hidden = !disponibles.includes('recolocar');
  btnHerramientaQuitar.hidden = !disponibles.includes('quitar');
  btnHerramientaRecolocar.classList.toggle('tool-unavailable', btnHerramientaRecolocar.hidden);
  btnHerramientaQuitar.classList.toggle('tool-unavailable', btnHerramientaQuitar.hidden);
  btnHerramientaRecolocar.classList.toggle('active', ESTADO.herramientaActiva === 'recolocar');
  btnHerramientaQuitar.classList.toggle('active', ESTADO.herramientaActiva === 'quitar');
  lienzo.classList.toggle('cursor-quitar', ESTADO.herramientaActiva === 'quitar');
  lienzo.classList.toggle(
    'cursor-recolocar',
    ESTADO.herramientaActiva === 'recolocar' && !ESTADO.chicaRecolocando
  );
  lienzo.classList.toggle(
    'cursor-reubicando',
    ESTADO.herramientaActiva === 'recolocar' && Boolean(ESTADO.chicaRecolocando)
  );
}

function mostrarCapitana(mensaje) {
  if (!dialogoCapitana || !mensajeCapitana) return;
  mensajeCapitana.textContent = mensaje || '';
  dialogoCapitana.classList.toggle('hidden', !mensaje);
}

function ocultarCapitana() {
  mostrarCapitana('');
}

// ──────────────────────────────────────────────
// RENDERIZAR TIENDA
// ──────────────────────────────────────────────
function renderizarTienda() {
  tarjetasTienda.innerHTML = '';
  DEF_CHICAS
    .filter(def => !ESTADO.cartasDisponibles || ESTADO.cartasDisponibles.includes(def.id))
    .forEach(def => {
    const espera = obtenerEsperaTienda(def.id);
    const sinOro = ESTADO.oro < def.costo;
    const bloqueada = sinOro || espera > 0;
    const div = document.createElement('div');
    div.className = 'shop-card' +
      (ESTADO.chicaSeleccionada === def.id ? ' selected' : '') +
      (bloqueada ? ' disabled' : '') +
      (espera > 0 ? ' cooling' : '');
    div.dataset.id = def.id;
    div.innerHTML = `
      <div class="card-emoji">${renderizarVisualTienda(def)}</div>
      <div class="card-name">${def.nombre}</div>
      <div class="card-cost">💰${def.costo}</div>
      <div class="card-stats">${def.desc}</div>
      ${espera > 0 ? `<div class="card-cooldown">⏳ ${formatearEsperaTienda(espera)}</div>` : ''}`;
    div.addEventListener('pointerup', evento => manejarPointerCartaTienda(evento, def.id));
    tarjetasTienda.appendChild(div);
  });
}

let ultimaCartaSeleccionada = { id: null, tiempo: 0 };

function manejarPointerCartaTienda(evento, id) {
  evento.preventDefault();
  evento.stopPropagation();

  const ahora = performance.now();
  const esDuplicadoRapido =
    ultimaCartaSeleccionada.id === id &&
    ahora - ultimaCartaSeleccionada.tiempo < 250;

  ultimaCartaSeleccionada = { id, tiempo: ahora };
  if (esDuplicadoRapido) return;

  seleccionarChica(id);
}

function obtenerEsperaTienda(id) {
  return Math.max(0, ESTADO.enfriamientosTienda?.[id] || 0);
}

function formatearEsperaTienda(segundos) {
  return segundos >= 10
    ? `${Math.ceil(segundos)}s`
    : `${Math.ceil(segundos * 10) / 10}s`;
}

function renderizarVisualTienda(def) {
  if (def.icono) {
    return `<img class="card-icon" src="${def.icono}" alt="${def.nombre}" onerror="this.replaceWith(document.createTextNode('${def.emoji}'))">`;
  }
  return def.emoji;
}

// ──────────────────────────────────────────────
// SELECCIONAR CHICA EN LA TIENDA
// ──────────────────────────────────────────────
function seleccionarChica(id) {
  if (ESTADO.tutorial?.activo && ESTADO.tutorial?.bloqueaTienda) {
    mostrarFlotante('La Capitana bloqueó la tienda por ahora', '#ffd000');
    return;
  }
  const def = DEF_CHICAS.find(d => d.id === id);
  const espera = obtenerEsperaTienda(id);
  if (!def || ESTADO.oro < def.costo || espera > 0) {
    if (def && ESTADO.oro < def.costo) mostrarFlotante('💰 ¡Oro insuficiente!', '#ff3355');
    if (def && espera > 0) mostrarFlotante(`⏳ Espera ${formatearEsperaTienda(espera)}`, def.color);
    return;
  }
  ESTADO.herramientaActiva = null;
  ESTADO.chicaRecolocando = null;
  ESTADO.chicaRecolocandoOrigen = null;
  ESTADO.chicaSeleccionada = (ESTADO.chicaSeleccionada === id) ? null : id;
  if (!ESTADO.chicaSeleccionada) ESTADO.celdaPreviaColocacion = null;
  ESTADO.celdaPreviaHerramienta = null;
  pistaTienda.textContent = ESTADO.chicaSeleccionada
    ? `Coloca: ${def.emoji} ${def.nombre}`
    : 'Selecciona una chica';
  actualizarHerramientas();
  renderizarTienda();
}

function seleccionarHerramienta(herramienta) {
  if (!ESTADO.herramientasDisponibles?.includes(herramienta)) {
    mostrarFlotante('Herramienta bloqueada en este nivel', '#ffd000');
    return;
  }
  const repetir = ESTADO.herramientaActiva === herramienta;
  ESTADO.herramientaActiva = repetir ? null : herramienta;
  ESTADO.chicaSeleccionada = null;
  ESTADO.chicaRecolocando = null;
  ESTADO.chicaRecolocandoOrigen = null;
  ESTADO.celdaPreviaColocacion = null;
  ESTADO.celdaPreviaHerramienta = null;
  if (!ESTADO.herramientaActiva) {
    pistaTienda.textContent = 'Selecciona una chica';
  } else if (ESTADO.herramientaActiva === 'recolocar') {
    pistaTienda.textContent = 'Elige una wifu para mover';
  } else {
    pistaTienda.textContent = 'Elige una wifu para quitar';
  }
  actualizarHerramientas();
  renderizarTienda();
  notificarHerramientaTutorial(herramienta);
}
