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
  actualizarRecompensaNivel(dt);
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

      const xMitadNexo = celdaX(COL_NEXO) + ESTADO.anchoCelda * 0.5;
      const xCruzoNexo = celdaX(COL_NEXO);

      // El misil defensivo se activa al llegar a media celda del Nexo.
      if (z.x <= xMitadNexo && ESTADO.misilesDefensa[z.fila]) {
        filasConMisil.add(z.fila);
        return;
      }

      // El Nexo recibe daño solo cuando el zombi cruza toda la celda del Nexo.
      if (z.x <= xCruzoNexo) {
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
    if (!z.noCuentaProgreso) {
      ESTADO.bajasOleada++;
      ESTADO.bajasNivel++;
    }
    ESTADO.zombis.splice(i, 1);
    actualizarHUD();
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
  const bajas = ESTADO.zombis.filter(z => z.fila === fila && !z.noCuentaProgreso).length;
  ESTADO.zombis = ESTADO.zombis.filter(z => {
    if (z.fila !== fila) return true;
    crearParticula(z.x, centroY(fila), '🔥', '#ff8f00');
    return false;
  });
  ESTADO.bajasOleada += bajas;
  ESTADO.bajasNivel += bajas;
  actualizarHUD();
  crearParticula(celdaX(COL_NEXO) + ESTADO.anchoCelda * 0.5, centroY(fila), '🚀', '#ff8f00');
  revisarTutorialMisil(fila);
  return true;
}

// ──────────────────────────────────────────────
// ACTUALIZAR CHICAS: generación de oro, curación y disparo
// ──────────────────────────────────────────────
function actualizarChicas(dt) {
  ESTADO.chicas.forEach(g => {
    const def = g.def;
    if (g.disparoAnim > 0) g.disparoAnim -= dt;
    if (def.oroIngreso && !ESTADO.faseActiva) return;
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

    // Doctora: cura solo a la aliada herida justo delante o detras.
    if (def.id === 'healer') {
      let mejor = null, mejorVida = Infinity;
      ESTADO.chicas.forEach(otra => {
        if (otra === g) return;
        const mismaFila = otra.fila === g.fila;
        const justoAlLado = Math.abs(otra.col - g.col) <= def.alcance;
        if (mismaFila && justoAlLado && otra.vida < otra.vidaMax) {
          if (otra.vida < mejorVida) { mejorVida = otra.vida; mejor = otra; }
        }
      });
      if (mejor) {
        const curacion = Math.max(1, Math.round(mejor.vidaMax * def.curacionPct));
        mejor.vida = Math.min(mejor.vidaMax, mejor.vida + curacion);
        crearParticula(centroX(mejor.col), centroY(mejor.fila), `+${curacion}❤️`, PALETA.verde);
        g.enfriamiento = 1 / def.cadencia;
        g.disparoAnim = def.spriteEstados?.disparo?.duracion || 0.45;
        g.animacion = 'disparo';
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
// RECOMPENSA DE NIVEL
// ──────────────────────────────────────────────
function actualizarRecompensaNivel(dt) {
  const recompensa = ESTADO.recompensaCaida;
  if (!recompensa || recompensa.lista) return;

  recompensa.y = Math.min(recompensa.destY, recompensa.y + ESTADO.altoCelda * 3.2 * dt);
  recompensa.brillo = (recompensa.brillo || 0) + dt;
}

function soltarRecompensaNivel() {
  const cartaId = ESTADO.recompensaPendiente;
  if (!cartaId) {
    guardarProgresoNivel(ESTADO.nivel, []);
    mostrarColeccionUnidades(null);
    return;
  }

  ESTADO.recompensaCaida = {
    cartaId,
    x: centroX(Math.floor(COLUMNAS / 2)),
    y: celdaY(0) - ESTADO.altoCelda,
    destY: centroY(Math.floor(FILAS / 2)),
    lista: false,
    brillo: 0,
  };
  elEstadoOleada.textContent = 'Carta nueva detectada';
  mostrarFlotante('✨ ¡Carta nueva! Recógela', '#ffd000');
}

function recogerRecompensaNivel(px, py) {
  const recompensa = ESTADO.recompensaCaida;
  if (!recompensa) return false;

  const radio = ESTADO.anchoCelda * 0.52;
  const dentro =
    Math.abs(px - recompensa.x) <= radio &&
    Math.abs(py - recompensa.y) <= radio;
  if (!dentro) return false;

  recompensa.lista = true;
  const progreso = guardarProgresoNivel(ESTADO.nivel, [recompensa.cartaId]);
  ESTADO.cartasDisponibles = progreso.cartasDesbloqueadas;
  reproducirCinematicaCarta(recompensa.cartaId, () => mostrarColeccionUnidades(recompensa.cartaId));
  return true;
}

function completarNivel() {
  ESTADO.faseActiva = false;
  ESTADO.oleadaActiva = false;
  ESTADO.nivelCompleto = true;
  ESTADO.defOleadaActual = null;
  ESTADO.faseActual = null;
  btnIniciarOleada.disabled = true;
  btnIniciarOleada.textContent = 'Nivel completo';
  elEstadoOleada.textContent = `${ESTADO.nivelActual.nombre} completado`;
  actualizarHUD();
  soltarRecompensaNivel();
}

// ──────────────────────────────────────────────
// VERIFICAR SI LA FASE SE COMPLETÓ
// ──────────────────────────────────────────────
function verificarOleadaCompleta() {
  if (!ESTADO.faseActiva) return;
  if (!ESTADO.faseActual) return;
  if (ESTADO.colaSpawn.length > 0) return;
  if (ESTADO.zombis.length > 0) return;

  const faseTerminada = ESTADO.faseActual;
  ESTADO.faseActiva = false;
  ESTADO.oleadaActiva = false;
  ESTADO.oleadaCompleta = true;
  ESTADO.defOleadaActual = null;
  ESTADO.faseActual = null;
  actualizarHUD();

  const quedanFases = ESTADO.faseIndice + 1 < ESTADO.nivelActual.fases.length;
  if (!quedanFases) {
    if (!mostrarDialogoFinNivel(completarNivel)) completarNivel();
    return;
  }

  actualizarBotonFase();
  mostrarFlotante(
    faseTerminada.tipo === 'ataque' ? '✅ Ataque repelido' : '✅ Oleada superada',
    '#39e87a'
  );
  elEstadoOleada.textContent = faseTerminada.tipo === 'ataque'
    ? 'Oleada entrante...'
    : 'Siguiente ataque entrante...';
  if (faseTerminada.tipo === 'ataque') mostrarAlertaPeligro('OLEADA SE APROXIMA');
  const ejecucion = ESTADO.ejecucionNivel;
  const continuar = () => {
    if (
      ESTADO.ejecucionNivel === ejecucion &&
      !ESTADO.pausado &&
      !ESTADO.faseActiva &&
      !ESTADO.nivelCompleto
    ) {
      iniciarSiguienteFase();
    }
  };

  if (mostrarDialogoEntreFases(ESTADO.faseIndice, continuar)) return;
  setTimeout(continuar, faseTerminada.tipo === 'ataque' ? 2200 : 3200);
}
