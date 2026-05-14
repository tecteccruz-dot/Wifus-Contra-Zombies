/* =====================================================
   WIFUS contra ZOMBIES — motor.js
   Game loop principal y todas las funciones de actualización
   ===================================================== */

'use strict';

// ──────────────────────────────────────────────
// BUCLE PRINCIPAL DEL JUEGO
// ──────────────────────────────────────────────
let idAnimacion = null;
function cicloJuego(ts) {
  if (!ESTADO.pausado) {
    const dt = Math.min((ts - ESTADO.ultimoTiempo) / 1000, 0.1);
    ESTADO.ultimoTiempo = ts;
    actualizar(dt);
  } else {
    ESTADO.ultimoTiempo = ts;
  }
  dibujar();
  idAnimacion = requestAnimationFrame(cicloJuego);
}

// ──────────────────────────────────────────────
// ORQUESTADOR DE ACTUALIZACIONES
// ──────────────────────────────────────────────
function actualizar(dt) {
  actualizarEnfriamientosTienda(dt);
  actualizarMisilesDefensa(dt);
  actualizarColaSpawn(dt);
  actualizarZombis(dt);
  actualizarChicas(dt);
  actualizarProyectiles(dt);
  actualizarParticulas(dt);
  verificarOleadaCompleta();
}

function actualizarMisilesDefensa(dt) {
  ESTADO.misilesActivos.forEach(m => {
    m.x += ESTADO.anchoCelda * 18 * dt;
    m.vida -= dt;
  });
  ESTADO.misilesActivos = ESTADO.misilesActivos.filter(m => m.vida > 0 && m.x <= celdaX(COL_SPAWN) + ESTADO.anchoCelda);
}

function actualizarEnfriamientosTienda(dt) {
  let cambioVisual = false;
  Object.keys(ESTADO.enfriamientosTienda).forEach(id => {
    const anterior = formatearEsperaTienda(ESTADO.enfriamientosTienda[id]);
    ESTADO.enfriamientosTienda[id] = Math.max(0, ESTADO.enfriamientosTienda[id] - dt);
    const actual = formatearEsperaTienda(ESTADO.enfriamientosTienda[id]);
    if (ESTADO.enfriamientosTienda[id] <= 0) delete ESTADO.enfriamientosTienda[id];
    if (anterior !== actual) cambioVisual = true;
  });
  if (cambioVisual) renderizarTienda();
}

// ──────────────────────────────────────────────
// PROCESAR COLA DE SPAWN
// ──────────────────────────────────────────────
function actualizarColaSpawn(dt) {
  ESTADO.colaSpawn.forEach(entrada => {
    if (entrada.hecho) return;
    entrada.transcurrido += dt * 1000;
    if (entrada.transcurrido >= entrada.retraso) {
      aparecerZombi(entrada.defTipo, entrada.fila);
      entrada.hecho = true;
    }
  });
  ESTADO.colaSpawn = ESTADO.colaSpawn.filter(e => !e.hecho);
}

// ──────────────────────────────────────────────
// ACTUALIZAR ZOMBIS: movimiento, ataque, muerte
// ──────────────────────────────────────────────
function actualizarZombis(dt) {
  const aEliminar = [];
  const filasConMisil = new Set();

  ESTADO.zombis.forEach((z, indice) => {
    if (z.aturdido > 0) { z.aturdido -= dt; return; }

    // aura de curación (CuraZombi)
    if (z.def.auraCuracion) {
      ESTADO.zombis.forEach((otro, oi) => {
        if (oi === indice) return;
        const distCeldas = Math.abs(otro.x - z.x) / ESTADO.anchoCelda;
        if (distCeldas <= z.def.radioCuracion) {
          otro.vida = Math.min(otro.vidaMax, otro.vida + z.def.auraCuracion * dt);
        }
      });
    }

    // buscar chica en la misma fila para atacar (cuerpo a cuerpo)
    const chicaEnFila = ESTADO.chicas.find(g => {
      if (g.fila !== z.fila) return false;
      const gx = centroX(g.col);
      return z.x <= gx + ESTADO.anchoCelda * 0.6 && z.x >= gx - ESTADO.anchoCelda * 0.6;
    });

    if (chicaEnFila) {
      // atacar a la chica
      z.enfAtaque -= dt;
      if (z.enfAtaque <= 0) {
        chicaEnFila.vida -= z.danio;
        z.enfAtaque = 1.0;
        crearParticula(centroX(chicaEnFila.col), centroY(chicaEnFila.fila), '💥', '#ff3355');
        if (chicaEnFila.vida <= 0) {
          crearParticula(centroX(chicaEnFila.col), centroY(chicaEnFila.fila), '💔', '#ff3355');
          ESTADO.chicas = ESTADO.chicas.filter(g => g !== chicaEnFila);
        }
      }
    } else {
      // moverse hacia la izquierda
      z.x -= z.def.vel * ESTADO.anchoCelda * dt;

      // ¿llegó al nexo?
      if (z.x <= celdaX(COL_NEXO) + ESTADO.anchoCelda) {
        if (ESTADO.misilesDefensa[z.fila]) { filasConMisil.add(z.fila); return; }
        z.enfAtaque -= dt;
        if (z.enfAtaque <= 0) {
          ESTADO.vidaNexo -= z.danio;
          z.enfAtaque = 1.0;
          actualizarHUD();
          if (ESTADO.vidaNexo <= 0) { juegoPerdido(); return; }
        }
      }
    }

    if (z.vida <= 0) aEliminar.push(indice);
  });

  if (filasConMisil.size > 0) {
    filasConMisil.forEach(fila => dispararMisilDefensa(fila));
    return;
  }

  aEliminar.reverse().forEach(i => {
    const z = ESTADO.zombis[i];
    ESTADO.bajasOleada++;
    ESTADO.zombis.splice(i, 1);
    if (
      ESTADO.oleadaActiva &&
      !ESTADO.surgeActivado &&
      ESTADO.defOleadaActual &&
      ESTADO.bajasOleada >= ESTADO.defOleadaActual.surgeAlBajas
    ) {
      activarSurge();
    }
  });
}

function dispararMisilDefensa(fila) {
  if (!ESTADO.misilesDefensa[fila]) return false;
  ESTADO.misilesDefensa[fila] = false;
  ESTADO.misilesActivos.push({
    fila,
    x: celdaX(COL_NEXO) + ESTADO.anchoCelda * 0.75,
    vida: 0.45,
    vidaMax: 0.45,
  });
  const bajas = ESTADO.zombis.filter(z => z.fila === fila).length;
  ESTADO.zombis = ESTADO.zombis.filter(z => {
    if (z.fila !== fila) return true;
    crearParticula(z.x, centroY(fila), '🔥', '#ff8f00');
    return false;
  });
  ESTADO.bajasOleada += bajas;
  crearParticula(celdaX(COL_NEXO) + ESTADO.anchoCelda * 0.5, centroY(fila), '🚀', '#ff8f00');
  if (
    ESTADO.oleadaActiva &&
    !ESTADO.surgeActivado &&
    ESTADO.defOleadaActual &&
    ESTADO.bajasOleada >= ESTADO.defOleadaActual.surgeAlBajas
  ) {
    activarSurge();
  }
  return true;
}

// ──────────────────────────────────────────────
// ACTUALIZAR CHICAS: generación de oro, curación y disparo
// ──────────────────────────────────────────────
function actualizarChicas(dt) {
  ESTADO.chicas.forEach(g => {
    const def = g.def;
    if (g.disparoAnim > 0) g.disparoAnim -= dt;
    if (def.oroIngreso && !ESTADO.oleadaActiva) return;
    g.enfriamiento -= dt;

    const gx  = centroX(g.col);
    const gy  = centroY(g.fila);

    const objetivoActual = buscarObjetivoEnFila(g, gx);
    actualizarAnimacionChica(g, objetivoActual);

    if (g.enfriamiento > 0) return;

    // Stremer: genera oro solo durante oleadas activas
    if (def.oroIngreso) {
      ESTADO.oro += def.oroIngreso;
      crearParticula(gx, gy, `+${def.oroIngreso}💰`, PALETA.oro, true);
      g.enfriamiento = def.intervaloOro;
      renderizarTienda();
      actualizarHUD();
      return;
    }

    // Healer: curar a la aliada con menos vida en rango
    if (def.id === 'healer') {
      let mejor = null, mejorVida = Infinity;
      ESTADO.chicas.forEach(otra => {
        if (otra === g) return;
        const dist = Math.abs(otra.col - g.col);
        const filaOk = otra.fila === g.fila || Math.abs(otra.fila - g.fila) <= 1;
        if (dist <= def.alcance && filaOk && otra.vida < otra.vidaMax) {
          if (otra.vida < mejorVida) { mejorVida = otra.vida; mejor = otra; }
        }
      });
      if (mejor) {
        mejor.vida = Math.min(mejor.vidaMax, mejor.vida + def.curacion);
        crearParticula(centroX(mejor.col), centroY(mejor.fila), `+${def.curacion}❤️`, PALETA.verde);
        g.enfriamiento = 1 / def.cadencia;
      }
      return;
    }

    if (objetivoActual) {
      if (def.rafagaDisparos) {
        g.disparosRafaga = Math.max(0, (g.disparosRafaga ?? def.rafagaDisparos) - 1);
        g.enfriamiento = g.disparosRafaga > 0 ? def.intervaloRafaga : def.cooldownRafaga;
        if (g.disparosRafaga <= 0) g.disparosRafaga = def.rafagaDisparos;
      } else {
        g.enfriamiento = 1 / def.cadencia;
      }
      g.disparoAnim = def.spriteEstados?.disparo?.duracion || 0.25;
      g.animacion = 'disparo';
      dispararProyectil(g, objetivoActual, gx, gy);
    }
  });
}

function buscarObjetivoEnFila(g, gx) {
  const def = g.def;
  if (def.oroIngreso || def.id === 'healer' || def.cadencia <= 0) return null;

  let objetivo = null, mejorDist = Infinity;
  ESTADO.zombis.forEach(z => {
    if (z.fila !== g.fila) return;
    const dist = (z.x - gx) / ESTADO.anchoCelda;
    if (dist >= 0 && dist <= def.alcance && dist < mejorDist) {
      mejorDist = dist; objetivo = z;
    }
  });
  return objetivo;
}

function actualizarAnimacionChica(g, objetivo) {
  if (!g.def.spriteEstados) return;
  if (g.disparoAnim > 0) {
    g.animacion = 'disparo';
  } else if (objetivo) {
    g.animacion = 'apuntando';
  } else {
    g.animacion = 'idle';
  }
}

// ──────────────────────────────────────────────
// CREAR UN PROYECTIL
// ──────────────────────────────────────────────
function dispararProyectil(g, objetivo, desdeX, desdeY) {
  const def = g.def;
  if (def.velProyectil === 0) return;
  ESTADO.proyectiles.push({
    x       : desdeX,
    y       : desdeY,
    destX   : objetivo.x,
    destY   : centroY(objetivo.fila),
    objetivo,
    danio   : def.danio,
    aoe     : def.aoe || 0,
    velocidad: def.velProyectil * ESTADO.anchoCelda,
    color   : def.color,
    deChica : g,
  });
}

// ──────────────────────────────────────────────
// ACTUALIZAR PROYECTILES: movimiento, impacto, AOE
// ──────────────────────────────────────────────
function actualizarProyectiles(dt) {
  const aEliminar = [];
  ESTADO.proyectiles.forEach((p, pi) => {
    // seguir al objetivo si sigue vivo
    if (p.objetivo && ESTADO.zombis.includes(p.objetivo)) {
      p.destX = p.objetivo.x;
      p.destY = centroY(p.objetivo.fila);
    }

    const dx = p.destX - p.x;
    const dy = p.destY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < p.velocidad * dt + 4) {
      // impacto
      if (p.aoe > 0) {
        const radioAoe = p.aoe * ESTADO.anchoCelda;
        ESTADO.zombis.forEach(z => {
          const zx = z.x, zy = centroY(z.fila);
          const d2 = Math.sqrt((zx - p.destX) ** 2 + (zy - p.destY) ** 2);
          if (d2 <= radioAoe) {
            z.vida -= p.danio * (1 - d2 / (radioAoe * 1.5));
          }
        });
        crearParticulaCirculo(p.destX, p.destY, p.aoe * ESTADO.anchoCelda, p.color);
      } else {
        if (p.objetivo && ESTADO.zombis.includes(p.objetivo)) {
          p.objetivo.vida -= p.danio;
        }
      }
      aEliminar.push(pi);
    } else {
      p.x += (dx / dist) * p.velocidad * dt;
      p.y += (dy / dist) * p.velocidad * dt;
    }
  });
  aEliminar.reverse().forEach(i => ESTADO.proyectiles.splice(i, 1));
}

// ──────────────────────────────────────────────
// ACTUALIZAR PARTÍCULAS: tiempo de vida y movimiento
// ──────────────────────────────────────────────
function actualizarParticulas(dt) {
  ESTADO.particulas.forEach(p => {
    p.vida -= dt;
    p.y -= p.vy * dt;
    p.x += p.vx * dt;
    p.alpha = Math.max(0, p.vida / p.vidaMax);
  });
  ESTADO.particulas = ESTADO.particulas.filter(p => p.vida > 0);
}

// ──────────────────────────────────────────────
// VERIFICAR SI LA OLEADA SE COMPLETÓ
// ──────────────────────────────────────────────
function verificarOleadaCompleta() {
  if (!ESTADO.oleadaActiva) return;
  if (ESTADO.colaSpawn.length > 0) return;
  if (ESTADO.zombis.length > 0) return;
  if (!ESTADO.surgeActivado) return;

  ESTADO.oleadaActiva   = false;
  ESTADO.oleadaCompleta = true;
  ESTADO.defOleadaActual = null;

  if (ESTADO.oleada >= TOTAL_OLEADAS) {
    setTimeout(() => mostrarVictoria(), 1200);
    return;
  }

  elEstadoOleada.textContent = `Oleada ${ESTADO.oleada} completada 🎉`;
  btnIniciarOleada.disabled = false;
  mostrarFlotante(`✅ ¡Oleada ${ESTADO.oleada} superada!`, '#39e87a');
}
