/* =====================================================
   WIFUS contra ZOMBIES — zombis.js
   Definiciones de enemigos
   ===================================================== */

'use strict';

const TIPOS_ZOMBI = [
  { id:'basic',  emoji:'🧟', nombre:'Zombi',     vida:10,  vel:0.12, danio:10, oro:0, color:'#7cb342', tam:0.7 },
  { id:'fast',   emoji:'🏃', nombre:'Corredor',  vida:8,   vel:0.5,  danio:8,  oro:0, color:'#ef9a9a', tam:0.6 },
  { id:'tank',   emoji:'🧟‍♂️',nombre:'Tanque',   vida:200, vel:0.25, danio:20, oro:0, color:'#37474f', tam:0.85 },
  {
    id:'healer',
    emoji:'🩸',
    nombre:'CuraZombi',
    vida:80,
    vel:0.45,
    danio:12,
    oro:0,
    color:'#e91e63',
    tam:0.7,
    auraCuracion: 5,
    radioCuracion: 1.5,
  },
  { id:'boss', emoji:'👹', nombre:'JEFE', vida:600, vel:0.18, danio:40, oro:0, color:'#b71c1c', tam:1.0 },
];
