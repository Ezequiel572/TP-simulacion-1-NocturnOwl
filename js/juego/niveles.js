/* ======================================================================
   5c · NIVELES Y PUERTA DE SALIDA
   - La puerta es el final de cada nivel: al tocarla se carga el siguiente.
   - Al pasar el último nivel aparece la pantalla de victoria.
   - NIVELES es la lista de niveles, en orden. Para añadir uno, agrega una línea más.
   Los niveles de abajo están pensados para ventanas de ~1000 px de ancho o más.
   ====================================================================== */

let puerta = null;            // { x, y, w, h } (solo una por nivel) o null si el nivel no tiene
let nivelActual = 0;          // posición en NIVELES
let editado = false;          // true si abriste el editor: ese nivel ya no hace avanzar de nivel
let fin = false;              // true mientras se ve la pantalla de victoria
let enPuerta = false;         // evita disparar la puerta muchas veces seguidas
const totales = { count: 0, time: 0 };   // suma de los niveles ya completados (para la victoria)

const makePuerta = (cx, cy, w = 48, h = 96) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const rectPuerta = p => ({ x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.h });

/* ---------- Piezas para armar niveles sencillos ---------- */
// Vacía el nivel y devuelve la altura del "piso" (donde van puertas, luces y botones)
function nivelVacio() {
  lights.length = 0; shapes.length = 0; botones.length = 0;
  return H - 100;
}
// Pared de arriba abajo con un hueco por debajo (la "puerta" por la que pasa el jugador)
const paredConHueco = x => shapes.push(boxFromBounds(x - 12, 0, x + 12, H - 190));
// Pone al jugador a la izquierda y la puerta de salida a la derecha
function terminarNivel(piso) {
  puerta = makePuerta(W - 72, piso);
  spawn.x = 40; spawn.y = piso - player.h / 2; player.x = spawn.x; player.y = spawn.y;
  resetEstadisticas();
  select(null, null);
}

/* NIVEL 1 · Luz azul: cruza el hueco aunque te ralentice. */
function nivel1() {
  const piso = nivelVacio(), x = W * 0.5;
  paredConHueco(x);
  lights.push(luzTipo(x, piso, 'azul', 1));
  terminarNivel(piso);
}

/* NIVEL 2 · Luz roja: empuja la caja (cuadro marrón) hasta el botón rojo y la luz se apaga. */
function nivel2() {
  const piso = nivelVacio(), x = W * 0.5;
  paredConHueco(x);
  lights.push(luzTipo(x, piso, 'roja', 1));
  shapes.push(Object.assign(makeShape(x - Math.min(220, W * 0.2), piso, 24), { movable: true }));   // caja
  shapes.push(boxFromBounds(x - 76, piso - 24, x - 60, piso + 24));   // tope: frena la caja sobre el botón
  botones.push(makeBoton(x - 100, piso, 'roja', 1));                  // lo mantiene la caja → apaga la luz 1
  terminarNivel(piso);
}

/* NIVEL 3 · Luz amarilla: pisa el botón azul (lo pisas tú) y la luz se apaga para siempre. */
function nivel3() {
  const piso = nivelVacio(), x = W * 0.5;
  paredConHueco(x);
  lights.push(luzTipo(x, piso, 'amarilla', 1));
  botones.push(makeBoton(x - 200, piso, 'azul', 1));                  // lo pisas tú → apaga la luz 1
  terminarNivel(piso);
}

// Lista de niveles en orden. `construir` = nivel hecho con código · `datos` = JSON exportado desde el editor
const NIVELES = [
  { nombre: 'Luz azul',     construir: () => nivel1() },
  { nombre: 'Luz roja',     construir: () => nivel2() },
  { nombre: 'Luz amarilla', construir: () => nivel3() },
  // { nombre: 'Práctica completa', construir: () => nivelEjemplo() },     // el nivel largo con las 3 luces juntas
  // { nombre: 'Mi nivel', datos: { ...pega aquí el JSON de "Exportar"... } },
];

function cargarNivel(i) {
  nivelActual = i; fin = false; enPuerta = false;
  $('victoria').hidden = true;
  const n = NIVELES[i];
  if (n.construir) n.construir(); else cargarDatos(n.datos);
  guardarCajas();               // para que R devuelva las cajas a su sitio en este nivel
  editado = false;
}

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
function comprobarPuerta() {
  if (modo !== 'jugar' || fin || !puerta) { enPuerta = false; return; }
  const dentro = overlap(player, rectPuerta(puerta));
  if (dentro && !enPuerta) { enPuerta = true; completarNivel(); }
  else if (!dentro) enPuerta = false;
}

function hudNivel() {
  $('hNivel').textContent = (nivelActual + 1) + ' / ' + NIVELES.length + (editado ? ' (editado)' : '');
}

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
