/* =====================================================
   WIFUS contra ZOMBIES — guardado.js
   Progreso y preferencias locales con localStorage
   ===================================================== */

'use strict';

const CLAVE_GUARDADO = 'wifusContraZombies.progreso.v1';

const PROGRESO_BASE = {
  version: 1,
  nivelDesbloqueado: 1,
  ultimoNivel: 1,
  cartasDesbloqueadas: ['archer'],
  oleadaDesbloqueada: 1,
  ultimaOleada: 1,
  modo: 'historia',
  opciones: {
    efectos: true,
    movimientoMenu: true,
  },
};

function clonarProgresoBase() {
  return JSON.parse(JSON.stringify(PROGRESO_BASE));
}

function normalizarProgreso(datos) {
  const base = clonarProgresoBase();
  const progreso = { ...base, ...(datos || {}) };
  progreso.opciones = { ...base.opciones, ...(datos?.opciones || {}) };
  progreso.nivelDesbloqueado = limitarNivel(progreso.nivelDesbloqueado ?? progreso.oleadaDesbloqueada);
  progreso.ultimoNivel = limitarNivel(progreso.ultimoNivel ?? progreso.ultimaOleada);
  progreso.cartasDesbloqueadas = normalizarCartasDesbloqueadas(progreso.cartasDesbloqueadas);
  progreso.oleadaDesbloqueada = limitarOleada(progreso.oleadaDesbloqueada);
  progreso.ultimaOleada = limitarOleada(progreso.ultimaOleada);
  return progreso;
}

function normalizarCartasDesbloqueadas(cartas) {
  const idsValidos = new Set(DEF_CHICAS.map(def => def.id));
  const lista = Array.isArray(cartas) ? cartas : PROGRESO_BASE.cartasDesbloqueadas;
  const normalizadas = [...new Set(lista.filter(id => idsValidos.has(id)))];
  return normalizadas.length > 0 ? normalizadas : [...PROGRESO_BASE.cartasDesbloqueadas];
}

function limitarNivel(valor) {
  const numero = Number.parseInt(valor, 10);
  if (!Number.isFinite(numero)) return 1;
  return Math.min(TOTAL_NIVELES, Math.max(1, numero));
}

function limitarOleada(valor) {
  const numero = Number.parseInt(valor, 10);
  if (!Number.isFinite(numero)) return 1;
  return Math.min(TOTAL_OLEADAS, Math.max(1, numero));
}

function obtenerProgreso() {
  try {
    const crudo = localStorage.getItem(CLAVE_GUARDADO);
    return normalizarProgreso(crudo ? JSON.parse(crudo) : null);
  } catch (error) {
    return clonarProgresoBase();
  }
}

function guardarProgreso(progreso) {
  const normalizado = normalizarProgreso(progreso);
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(normalizado));
  } catch (error) {
    // Si el navegador bloquea localStorage, el juego sigue funcionando sin progreso persistente.
  }
  return normalizado;
}

function guardarProgresoOleada(oleadaCompletada) {
  const progreso = obtenerProgreso();
  const siguiente = limitarOleada(oleadaCompletada + 1);
  progreso.oleadaDesbloqueada = Math.max(progreso.oleadaDesbloqueada, siguiente);
  progreso.ultimaOleada = progreso.oleadaDesbloqueada;
  return guardarProgreso(progreso);
}

function guardarProgresoNivel(nivelCompletado, cartasNuevas = []) {
  const progreso = obtenerProgreso();
  const siguiente = limitarNivel(nivelCompletado + 1);
  progreso.nivelDesbloqueado = Math.max(progreso.nivelDesbloqueado, siguiente);
  progreso.ultimoNivel = progreso.nivelDesbloqueado;
  progreso.oleadaDesbloqueada = progreso.nivelDesbloqueado;
  progreso.ultimaOleada = progreso.ultimoNivel;
  progreso.cartasDesbloqueadas = normalizarCartasDesbloqueadas([
    ...progreso.cartasDesbloqueadas,
    ...cartasNuevas,
  ]);
  return guardarProgreso(progreso);
}

function guardarModoJuego(modo) {
  const progreso = obtenerProgreso();
  progreso.modo = modo;
  return guardarProgreso(progreso);
}

function guardarOpcionJuego(nombre, valor) {
  const progreso = obtenerProgreso();
  progreso.opciones[nombre] = Boolean(valor);
  return guardarProgreso(progreso);
}

function reiniciarProgresoLocal() {
  try {
    localStorage.removeItem(CLAVE_GUARDADO);
  } catch (error) {
    // Sin accion: el estado base se usara en memoria.
  }
  return clonarProgresoBase();
}
