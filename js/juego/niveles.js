/* ======================================================================
   5c · NIVELES Y PUERTA DE SALIDA                      (js/juego/niveles.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Guarda la lista de niveles, carga el que toca y gestiona la puerta de salida y la victoria.
   FLUJO      El jugador toca la puerta → completarNivel() → cargarNivel(siguiente) … → mostrarVictoria().
   NIVELES    Es una lista en orden. Cada elemento es:
                { nombre, datos }      → nivel exportado desde el editor (JSON)
                { nombre, construir }  → nivel hecho con código (una función que arma luces, formas y botones)
              Para añadir uno, agrega una línea: el selector del Menú de Inicio lo lista solo.
   EDITADO    Si abres el editor, ese nivel queda marcado como «editado» y ya no hace avanzar de nivel.
   Los niveles están pensados para ventanas de ~1000 px de ancho o más (los exportados, 1920×960).
   ====================================================================== */

// ---------- Estado de la partida ----------
let puerta = null;            // { x, y, w, h } (solo una por nivel) o null si el nivel no tiene
let nivelActual = 0;          // posición en NIVELES
let editado = false;          // true si abriste el editor: ese nivel ya no hace avanzar de nivel
let fin = false;              // true mientras se ve la pantalla de victoria
let enPuerta = false;         // evita disparar la puerta muchas veces seguidas
const totales = { count: 0, time: 0 };   // suma de los niveles ya completados (para la victoria)

// Crea una puerta centrada en (cx, cy) · rectPuerta la convierte a caja {x0,y0,x1,y1} para overlap().
const makePuerta = (cx, cy, w = 48, h = 96) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const rectPuerta = p => ({ x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.h });

// Lista de niveles en orden. `construir` = nivel hecho con código · `datos` = JSON exportado desde el editor
// Los niveles actuales vienen del editor (Exportar → .json) y están pensados para una pantalla de 1920×960.
const NIVELES = [
  { nombre: 'Luz amarilla', datos:
    { version: 3, ambient: 0.07, player: {"x":912,"y":456},
      puerta: {"x":1848,"y":432,"w":48,"h":96},
      lights: [
        {"x":504,"y":144,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":1},
        {"x":1416,"y":144,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":2},
        {"x":1488,"y":864,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":4},
        {"x":456,"y":552,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":5},
        {"x":1752,"y":480,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":6},
        {"x":936,"y":720,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":7},
      ],
      botones: [
        {"x":912,"y":72,"w":48,"h":48,"color":"amarilla","link":1},
        {"x":120,"y":72,"w":48,"h":48,"color":"amarilla","link":2},
        {"x":120,"y":360,"w":48,"h":48,"color":"amarilla","link":6},
        {"x":1752,"y":840,"w":48,"h":48,"color":"amarilla","link":5},
        {"x":120,"y":840,"w":48,"h":48,"color":"amarilla","link":4},
        {"x":1728,"y":72,"w":48,"h":48,"color":"amarilla","link":7},
      ],
      shapes: [
        {"type":"box","movable":false,"skin":null,"pts":[[336,0],[384,0],[384,48],[336,48]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,144],[384,144],[384,240],[336,240]]},
        {"type":"box","movable":false,"skin":null,"pts":[[0,192],[384,192],[384,240],[0,240]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,240],[384,240],[384,336],[336,336]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,192],[1944,192],[1944,240],[1536,240]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,144],[1584,144],[1584,336],[1536,336]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,0],[1584,0],[1584,48],[1536,48]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1200,336],[1248,336],[1248,672],[1200,672]]},
        {"type":"box","movable":false,"skin":null,"pts":[[624,336],[672,336],[672,672],[624,672]]},
        {"type":"box","movable":false,"skin":null,"pts":[[624,672],[816,672],[816,720],[624,720]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1056,672],[1248,672],[1248,720],[1056,720]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,288],[816,288],[816,336],[336,336]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1056,288],[1584,288],[1584,336],[1056,336]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,912],[384,912],[384,960],[336,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,720],[384,720],[384,816],[336,816]]},
        {"type":"box","movable":false,"skin":null,"pts":[[0,672],[384,672],[384,720],[0,720]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,912],[1584,912],[1584,960],[1536,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,720],[1584,720],[1584,816],[1536,816]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1536,672],[1920,672],[1920,720],[1536,720]]},
      ] } },
  { nombre: 'Luz roja y azul', datos:
    { version: 3, ambient: 0.07, player: {"x":40,"y":868},
      puerta: {"x":1848,"y":240,"w":48,"h":96},
      lights: [
        {"x":480,"y":864,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":1},
        {"x":720,"y":696,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":2},
        {"x":744,"y":240,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":3},
        {"x":912,"y":72,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":4},
        {"x":1200,"y":624,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":5},
        {"x":1392,"y":96,"color":"#ff2b2b","radius":170,"intensity":1,"tipo":"roja","id":6},
        {"x":360,"y":240,"color":"#ff2b2b","radius":170,"intensity":1,"tipo":"roja","id":7},
      ],
      botones: [
        {"x":1800,"y":696,"w":48,"h":48,"color":"roja","link":6},
      ],
      shapes: [
        {"type":"box","movable":false,"skin":null,"pts":[[0,720],[576,720],[576,768],[0,768]]},
        {"type":"box","movable":true,"skin":2,"pts":[[192,816],[288,816],[288,912],[192,912]]},
        {"type":"box","movable":false,"skin":null,"pts":[[864,720],[1152,720],[1152,768],[864,768]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1152,720],[1200,720],[1200,960],[1152,960]]},
        {"type":"box","movable":true,"skin":0,"pts":[[960,816],[1056,816],[1056,912],[960,912]]},
        {"type":"box","movable":false,"skin":null,"pts":[[336,480],[384,480],[384,720],[336,720]]},
        {"type":"box","movable":false,"skin":null,"pts":[[384,480],[576,480],[576,528],[384,528]]},
        {"type":"box","movable":false,"skin":null,"pts":[[864,240],[912,240],[912,720],[864,720]]},
        {"type":"box","movable":true,"skin":4,"pts":[[432,576],[528,576],[528,672],[432,672]]},
        {"type":"box","movable":false,"skin":null,"pts":[[576,240],[624,240],[624,528],[576,528]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1248,192],[1296,192],[1296,528],[1248,528]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1296,480],[1920,480],[1920,528],[1296,528]]},
        {"type":"box","movable":true,"skin":3,"pts":[[96,480],[192,480],[192,576],[96,576]]},
        {"type":"box","movable":true,"skin":0,"pts":[[1032,408],[1128,408],[1128,504],[1032,504]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1344,528],[1392,528],[1392,768],[1344,768]]},
        {"type":"box","movable":true,"skin":1,"pts":[[1536,672],[1632,672],[1632,768],[1536,768]]},
      ] } },
  { nombre: 'Todas las luces', datos:
    { version: 3, ambient: 0.07, player: {"x":960,"y":504},
      puerta: {"x":840,"y":0,"w":48,"h":96},
      lights: [
        {"x":816,"y":144,"color":"#ff2b2b","radius":170,"intensity":1,"tipo":"roja","id":1},
        {"x":1200,"y":744,"color":"#ff2b2b","radius":170,"intensity":1,"tipo":"roja","id":2},
        {"x":1584,"y":744,"color":"#ff2b2b","radius":170,"intensity":1,"tipo":"roja","id":3},
        {"x":528,"y":504,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":4},
        {"x":552,"y":672,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":5},
        {"x":312,"y":144,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":7},
        {"x":504,"y":72,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":8},
        {"x":408,"y":120,"color":"#3d8bff","radius":170,"intensity":1,"tipo":"azul","id":9},
        {"x":528,"y":576,"color":"#3d8bff","radius":170,"intensity":1,"tipo":"azul","id":10},
        {"x":96,"y":624,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":11},
        {"x":1800,"y":240,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":12},
        {"x":1104,"y":192,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":13},
        {"x":1344,"y":240,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":14},
        {"x":1584,"y":192,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":15},
        {"x":1464,"y":216,"color":"#3d8bff","radius":170,"intensity":1,"tipo":"azul","id":16},
        {"x":792,"y":840,"color":"#ffd028","radius":170,"intensity":1,"tipo":"amarilla","id":17},
        {"x":840,"y":792,"color":"#3d8bff","radius":170,"intensity":1,"tipo":"azul","id":18},
      ],
      botones: [
        {"x":48,"y":72,"w":48,"h":48,"color":"azul","link":16},
        {"x":1272,"y":24,"w":48,"h":48,"color":"amarilla","link":11},
        {"x":96,"y":840,"w":48,"h":48,"color":"azul","link":10},
        {"x":408,"y":888,"w":48,"h":48,"color":"roja","link":2},
        {"x":1176,"y":888,"w":48,"h":48,"color":"amarilla","link":12},
        {"x":1848,"y":600,"w":48,"h":48,"color":"roja","link":3},
        {"x":1800,"y":840,"w":48,"h":48,"color":"azul","link":9},
        {"x":312,"y":0,"w":48,"h":48,"color":"azul","link":18},
        {"x":888,"y":312,"w":48,"h":48,"color":"roja","link":1},
      ],
      shapes: [
        {"type":"box","movable":false,"skin":null,"pts":[[144,0],[192,0],[192,192],[144,192]]},
        {"type":"box","movable":false,"skin":null,"pts":[[960,0],[1008,0],[1008,288],[960,288]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1728,0],[1776,0],[1776,192],[1728,192]]},
        {"type":"box","movable":false,"skin":null,"pts":[[96,720],[288,720],[288,768],[96,768]]},
        {"type":"box","movable":false,"skin":null,"pts":[[240,528],[288,528],[288,960],[240,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[288,528],[384,528],[384,576],[288,576]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1728,720],[1920,720],[1920,768],[1728,768]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1392,720],[1440,720],[1440,960],[1392,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[960,720],[1008,720],[1008,960],[960,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[576,720],[624,720],[624,960],[576,960]]},
        {"type":"box","movable":false,"skin":null,"pts":[[384,384],[432,384],[432,576],[384,576]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1104,432],[1152,432],[1152,624],[1104,624]]},
        {"type":"box","movable":false,"skin":null,"pts":[[816,432],[864,432],[864,624],[816,624]]},
        {"type":"box","movable":true,"skin":3,"pts":[[384,720],[480,720],[480,816],[384,816]]},
        {"type":"box","movable":true,"skin":0,"pts":[[1824,96],[1920,96],[1920,192],[1824,192]]},
        {"type":"box","movable":false,"skin":null,"pts":[[1872,0],[1920,0],[1920,48],[1872,48]]},
        {"type":"box","movable":true,"skin":0,"pts":[[864,696],[960,696],[960,792],[864,792]]},
      ] } },
];

// Carga el nivel i de NIVELES: lo construye (código o datos JSON), guarda la posición inicial de cajas y luces y limpia la marca «editado».
function cargarNivel(i) {
  nivelActual = i; fin = false; enPuerta = false;
  $('victoria').hidden = true;
  const n = NIVELES[i];
  if (n.construir) n.construir(); else cargarDatos(n.datos);
  guardarCajas();               // para que R devuelva las cajas a su sitio en este nivel
  editado = false;
}

// Se llama al tocar la puerta. Nivel editado: solo avisa. Si no, suma estadísticas y pasa al siguiente (o a la victoria si era el último).
function completarNivel() {
  if (editado) {
    aviso('¡Meta alcanzada! Es un nivel editado: R repite, E vuelve al editor');
    return;
  }
  totales.count += stat.count; totales.time += stat.time;
  if (nivelActual + 1 < NIVELES.length) {
    cargarNivel(nivelActual + 1);
    aviso('¡Completado! Nivel ' + (nivelActual + 1) + ': ' + NIVELES[nivelActual].nombre);
  } else mostrarVictoria();
}

// Muestra la pantalla de victoria con el total de niveles, veces tocado y tiempo en luz.
function mostrarVictoria() {
  fin = true;
  for (const k in keys) keys[k] = false;
  $('vNiveles').textContent = NIVELES.length;
  $('vTocado').textContent = totales.count;
  $('vTiempo').textContent = totales.time.toFixed(1);
  $('victoria').hidden = false;
}
$('vOtra').onclick = () => { totales.count = 0; totales.time = 0; cargarNivel(0); $('vOtra').blur(); };

// Cada frame (solo jugando): ¿el jugador está tocando la puerta?
// Cada frame (solo jugando): ¿el jugador está tocando la puerta? `enPuerta` evita disparar varias veces seguidas.
function comprobarPuerta() {
  if (modo !== 'jugar' || fin || !puerta) { enPuerta = false; return; }
  const dentro = overlap(player, rectPuerta(puerta));
  if (dentro && !enPuerta) { enPuerta = true; completarNivel(); }
  else if (!dentro) enPuerta = false;
}

// Texto «Nivel: 2 / 3» del panel HUD.
function hudNivel() {
  $('hNivel').textContent = (nivelActual + 1) + ' / ' + NIVELES.length + (editado ? ' (editado)' : '');
}

// Dibuja la puerta de salida en el canvas 2D (marco, hoja, pomo y rótulo SALIDA; naranja si está seleccionada en el editor).
function dibujarPuerta() {
  if (!puerta) return;
  const { x, y, w, h } = puerta, on = sel && sel.ref === puerta;
  ctx.shadowColor = '#7dffb0'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#2a1d12'; ctx.fillRect(x, y, w, h);                    // marco
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1f9d6b'; ctx.fillRect(x + 6, y + 6, w - 12, h - 6);   // hoja de la puerta
  ctx.fillStyle = '#ffd028'; ctx.beginPath(); ctx.arc(x + w - 14, y + h / 2, 4, 0, Math.PI * 2); ctx.fill();   // pomo
  ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = on ? '#ffb347' : '#7dffb0'; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#e6e8ee'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SALIDA', x + w / 2, y - 6); ctx.textAlign = 'left';
}
