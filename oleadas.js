/* =====================================================
   WIFUS contra ZOMBIES — oleadas.js
   Inicio de oleada, encolado de grupos,
   activación de surge y spawn de zombis individuales
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// INICIAR OLEADA
// ──────────────────────────────────────────────
function iniciarOleada() {
  if (ESTADO.oleadaActiva || ESTADO.todasOleadasHechas) return;
  ESTADO.oleada++;
  if (ESTADO.oleada > TOTAL_OLEADAS) { ESTADO.todasOleadasHechas = true; mostrarVictoria(); return; }

  ESTADO.oleadaActiva   = true;
  ESTADO.oleadaCompleta = false;
  ESTADO.bajasOleada    = 0;
  ESTADO.surgeActivado  = false;
  ESTADO.defOleadaActual = ESTADO.oleadas[ESTADO.oleada - 1];
  elOleada.textContent     = `${ESTADO.oleada}/${TOTAL_OLEADAS}`;
  elEstadoOleada.textContent = `Oleada ${ESTADO.oleada}: preparando`;
  btnIniciarOleada.disabled = true;

  encolarGruposOleada(ESTADO.defOleadaActual.goteo, ESTADO.defOleadaActual.leadDelay, true);
  mostrarFlotante(`🌊 ¡Oleada ${ESTADO.oleada}!`, '#ffd700');
}

// ──────────────────────────────────────────────
// ENCOLAR GRUPOS DE ZOMBIS EN LA COLA DE SPAWN
// Si encadenar=true: cada grupo empieza tras el anterior.
// Si encadenar=false: los grupos se superponen (surge).
// ──────────────────────────────────────────────
function encolarGruposOleada(grupos, retrasoBase = 0, encadenar = true) {
  let siguienteRetraso = retrasoBase;

  grupos.forEach(grupo => {
    const defTipo = TIPOS_ZOMBI.find(z => z.id === grupo.type);
    if (!defTipo) return;

    for (let i = 0; i < grupo.count; i++) {
      ESTADO.colaSpawn.push({
        defTipo,
        fila      : grupo.row ?? Math.floor(Math.random() * FILAS),
        retraso   : siguienteRetraso + i * grupo.delay,
        transcurrido: 0,
        hecho     : false,
      });
    }
    if (encadenar) siguienteRetraso += grupo.count * grupo.delay + 700;
  });
}

// ──────────────────────────────────────────────
// ACTIVAR GRAN OLEADA (SURGE)
// ──────────────────────────────────────────────
function activarSurge() {
  if (!ESTADO.defOleadaActual || ESTADO.surgeActivado) return;

  ESTADO.surgeActivado = true;
  encolarGruposOleada(ESTADO.defOleadaActual.surge, 700, false);
  elEstadoOleada.textContent = `Oleada ${ESTADO.oleada}: gran oleada`;
  mostrarFlotante('⚠️ ¡Gran oleada!', '#ff3355');
}

// ──────────────────────────────────────────────
// APARECER UN ZOMBI INDIVIDUAL EN EL TABLERO
// ──────────────────────────────────────────────
function aparecerZombi(defTipo, fila) {
  const escalaVida = 1 + (ESTADO.oleada - 1) * 0.18;
  const escalaDanio = 1 + (ESTADO.oleada - 1) * 0.10;

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
