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

// ──────────────────────────────────────────────
// ACTUALIZAR HUD
// ──────────────────────────────────────────────
function actualizarHUD() {
  elOro.textContent       = Math.floor(ESTADO.oro);
  elVidaNexo.textContent  = Math.max(0, ESTADO.vidaNexo);
  elOleada.textContent    = `${ESTADO.oleada}/${TOTAL_OLEADAS}`;
}

function actualizarHerramientas() {
  btnHerramientaRecolocar.classList.toggle('active', ESTADO.herramientaActiva === 'recolocar');
  btnHerramientaQuitar.classList.toggle('active', ESTADO.herramientaActiva === 'quitar');
}

// ──────────────────────────────────────────────
// RENDERIZAR TIENDA
// ──────────────────────────────────────────────
function renderizarTienda() {
  tarjetasTienda.innerHTML = '';
  DEF_CHICAS.forEach(def => {
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
  const def = DEF_CHICAS.find(d => d.id === id);
  const espera = obtenerEsperaTienda(id);
  if (!def || ESTADO.oro < def.costo || espera > 0) {
    if (def && ESTADO.oro < def.costo) mostrarFlotante('💰 ¡Oro insuficiente!', '#ff3355');
    if (def && espera > 0) mostrarFlotante(`⏳ Espera ${formatearEsperaTienda(espera)}`, def.color);
    return;
  }
  ESTADO.herramientaActiva = null;
  ESTADO.chicaRecolocando = null;
  ESTADO.chicaSeleccionada = (ESTADO.chicaSeleccionada === id) ? null : id;
  pistaTienda.textContent = ESTADO.chicaSeleccionada
    ? `Coloca: ${def.emoji} ${def.nombre}`
    : 'Selecciona una chica';
  actualizarHerramientas();
  renderizarTienda();
}

function seleccionarHerramienta(herramienta) {
  const repetir = ESTADO.herramientaActiva === herramienta;
  ESTADO.herramientaActiva = repetir ? null : herramienta;
  ESTADO.chicaSeleccionada = null;
  ESTADO.chicaRecolocando = null;
  if (!ESTADO.herramientaActiva) {
    pistaTienda.textContent = 'Selecciona una chica';
  } else if (ESTADO.herramientaActiva === 'recolocar') {
    pistaTienda.textContent = 'Elige una wifu para mover';
  } else {
    pistaTienda.textContent = 'Elige una wifu para quitar';
  }
  actualizarHerramientas();
  renderizarTienda();
}
