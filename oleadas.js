/* =====================================================
   WIFUS contra ZOMBIES — oleadas.js
   Niveles, ataques, oleadas y spawn de zombis
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// INICIAR SIGUIENTE FASE DEL NIVEL
// ──────────────────────────────────────────────
function iniciarOleada() {
  iniciarSiguienteFase();
}

function iniciarSiguienteFase() {
  if (ESTADO.faseActiva || ESTADO.nivelCompleto || !ESTADO.nivelActual) return;

  const siguienteIndice = ESTADO.faseIndice + 1;
  const fase = ESTADO.nivelActual.fases[siguienteIndice];
  if (!fase) {
    completarNivel();
    return;
  }

  ESTADO.faseIndice = siguienteIndice;
  ESTADO.faseActual = fase;
  ESTADO.faseActiva = true;
  ESTADO.oleadaActiva = true;
  ESTADO.oleadaCompleta = false;
  ESTADO.bajasOleada = 0;
  ESTADO.surgeActivado = fase.tipo === 'oleada';
  ESTADO.defOleadaActual = fase;
  ESTADO.oleada = ESTADO.faseIndice + 1;

  encolarGruposFase(fase.grupos, fase.tipo === 'ataque');
  actualizarHUD();
  actualizarBotonFase();
  renderizarProgresoNivel();
  mostrarFlotante(
    fase.tipo === 'ataque' ? '🧟 Ataque entrante' : '⚠️ ¡Oleada!',
    fase.tipo === 'ataque' ? '#ffd000' : '#ff3355'
  );
  if (fase.tipo === 'oleada') mostrarAlertaPeligro('OLEADA DE ZOMBIS');
}

function actualizarBotonFase() {
  const siguiente = ESTADO.nivelActual?.fases[ESTADO.faseIndice + 1];
  btnIniciarOleada.hidden = true;
  btnIniciarOleada.disabled = true;
  if (!siguiente) {
    btnIniciarOleada.textContent = 'Nivel completo';
    return;
  }
  btnIniciarOleada.textContent = siguiente.tipo === 'ataque' ? 'Iniciar ataque' : 'Iniciar oleada';
  elEstadoOleada.textContent = `${ESTADO.nivelActual.nombre}: listo para ${siguiente.tipo}`;
}

// ──────────────────────────────────────────────
// ENCOLAR GRUPOS DE ZOMBIS
// Ataques: delay irregular y progresivo.
// Oleadas: grupos compactos.
// ──────────────────────────────────────────────
function encolarGruposFase(grupos, irregular = false) {
  let base = irregular ? 1000 : 500;

  grupos.forEach(grupo => {
    const defTipo = TIPOS_ZOMBI.find(z => z.id === grupo.type);
    if (!defTipo) return;

    let creados = 0;
    let acumulado = base;
    while (creados < grupo.count) {
      if (irregular) {
        acumulado += numeroAleatorioEntre(grupo.minDelay ?? 2000, grupo.maxDelay ?? 6000);
      }

      const restantes = grupo.count - creados;
      const doble = irregular && restantes > 1 && Math.random() < (grupo.burstChance ?? 0.12);
      const cantidad = doble ? 2 : 1;

      for (let i = 0; i < cantidad; i++) {
        ESTADO.colaSpawn.push({
          defTipo,
          fila: elegirFilaSpawn(grupo),
          retraso: irregular ? acumulado + i * 220 : base + creados * grupo.delay + i * grupo.delay,
          transcurrido: 0,
          hecho: false,
        });
      }

      creados += cantidad;
    }

    if (!irregular) {
      base += Math.max(700, grupo.count * grupo.delay * 0.45);
    } else {
      base = acumulado + 1000;
    }
  });
}

function numeroAleatorioEntre(min, max) {
  return min + Math.random() * (max - min);
}

function elegirFilaSpawn(grupo) {
  if (Number.isInteger(grupo.row)) return grupo.row;
  const filas = grupo.rows || ESTADO.carrilesActivos || Array.from({ length: FILAS }, (_, fila) => fila);
  return filas[Math.floor(Math.random() * filas.length)];
}

// ──────────────────────────────────────────────
// COMPATIBILIDAD CON SISTEMA ANTERIOR
// ──────────────────────────────────────────────
function activarSurge() {
  // En niveles nuevos la oleada es una fase propia y no se activa por contador de bajas.
}

// ──────────────────────────────────────────────
// APARECER UN ZOMBI INDIVIDUAL EN EL TABLERO
// ──────────────────────────────────────────────
function aparecerZombi(defTipo, fila) {
  const escalaVida = 1 + (ESTADO.nivel - 1) * 0.12;
  const escalaDanio = 1 + (ESTADO.nivel - 1) * 0.08;

  ESTADO.zombis.push({
    def       : defTipo,
    x         : celdaX(COL_SPAWN) + ESTADO.anchoCelda,
    fila,
    vida      : Math.round(defTipo.vida * escalaVida),
    vidaMax   : Math.round(defTipo.vida * escalaVida),
    danio     : Math.round(defTipo.danio * escalaDanio),
    enfAtaque : 0,
    aturdido  : 0,
  });
}
