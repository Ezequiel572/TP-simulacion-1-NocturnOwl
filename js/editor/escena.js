/* ======================================================================
   6 · ESCENA Y PANEL
   Fábricas de objetos (luces y formas), nivel de práctica y controles del panel lateral.
   ====================================================================== */

// Todas las formas son cajas. Si `movable` es true, el jugador puede empujarla
// (y como sigue proyectando sombra, sirve para tapar las luces).
function boxFromBounds(x0, y0, x1, y1, movable = false) {
  return { type: 'box', movable, pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => ({ x, y })) };
}
const makeShape = (cx, cy, hw, hh = hw) => boxFromBounds(cx - hw, cy - hh, cx + hw, cy + hh);

// Solo existen tres luces: 'azul' | 'roja' | 'amarilla'. El color lo decide el tipo (no se puede cambiar).
// `id` sirve para que los botones encuentren la luz.
const COLORES_TIPO = { azul: '#3d8bff', roja: '#ff2b2b', amarilla: '#ffd028' };
const DESC_TIPO = {
  azul: 'Luz azul: te ralentiza. No se puede apagar.',
  roja: 'Luz roja: te empuja una casilla. La apaga el botón rojo enlazado (con una caja encima).',
  amarilla: 'Luz amarilla: te empuja una casilla. La apaga el botón azul enlazado (lo pisas tú).'
};
function makeLight(x, y, color = COLORES_TIPO.amarilla, radius = 170, intensity = 1, tipo = 'amarilla', id = null) {
  return { x, y, color, radius, intensity, tipo, id, activa: true };
}
const siguienteIdLuz = () => Math.max(0, ...lights.map(l => l.id ?? 0)) + 1;
const luzTipo = (x, y, tipo, id, radius = 170) => makeLight(x, y, COLORES_TIPO[tipo], radius, 1, tipo, id);

// Botón cuadrado centrado en (cx, cy). `link` = id de la luz que controla.
const makeBoton = (cx, cy, color, link, lado = 48) =>
  ({ x: cx - lado / 2, y: cy - lado / 2, w: lado, h: lado, color, link, pressed: false });

/* NIVEL DE PRÁCTICA: tres paredes con una puerta abajo; cada puerta tiene una luz distinta.
     [inicio] ─A─ [sala 1] ─B─ [sala 2] ─C─ [final]
   A = luz azul · B = luz roja (caja + botón rojo en la sala 1) · C = luz amarilla (botón azul en la sala 2) */
function nivelEjemplo() {
  lights.length = 0; shapes.length = 0; botones.length = 0;
  const xA = W * 0.25, xB = W * 0.5, xC = W * 0.75;
  const piso = H - 100;          // altura del centro de las puertas, luces y botones
  const alto = H - 190;          // las paredes bajan hasta aquí; debajo queda la puerta

  for (const x of [xA, xB, xC]) shapes.push(boxFromBounds(x - 12, 0, x + 12, alto));

  lights.push(luzTipo(xA, piso, 'azul', 1));
  lights.push(luzTipo(xB, piso, 'roja', 2));
  lights.push(luzTipo(xC, piso, 'amarilla', 3));

  shapes.push(Object.assign(makeShape(xB - Math.min(230, W * 0.2), piso, 24), { movable: true }));  // caja
  shapes.push(boxFromBounds(xB - 76, piso - 24, xB - 60, piso + 24));   // tope: frena la caja justo sobre el botón rojo
  botones.push(makeBoton(xB - 100, piso, 'roja', 2));       // lo mantiene la caja → apaga la luz 2
  botones.push(makeBoton(xC - 200, piso, 'azul', 3));       // lo pisa el jugador → apaga la luz 3

  puerta = makePuerta(W - 72, piso);                          // salida del nivel (juego/niveles.js)
  spawn.x = 40; spawn.y = piso - player.h / 2; player.x = spawn.x; player.y = spawn.y;
  resetEstadisticas();
  select('light', lights[0]);
}

function select(kind, ref) {
  sel = ref ? { kind, ref } : null;
  syncUI();
  // Al editar, el panel salta solo a la pestaña de lo que seleccionas (sin tener que buscarla)
  if (modo === 'editar' && ref) { if (kind === 'light') mostrarTab('luz'); else if (kind === 'shape') mostrarTab('caja'); else if (kind === 'boton') mostrarTab('boton'); }
}

/* ---------- Pestañas del panel ---------- */
function mostrarTab(nombre) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === nombre));
  document.querySelectorAll('.pane').forEach(p => p.hidden = p.dataset.pane !== nombre);
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { mostrarTab(b.dataset.tab); b.blur(); });
function syncUI() {
  const on = sel && sel.kind === 'light';
  for (const id of ['radius', 'intensity']) $(id).disabled = !on;
  const isShape = !!(sel && sel.kind === 'shape');
  $('shW').disabled = $('shH').disabled = $('shMov').disabled = !isShape;
  $('shMov').checked = isShape && !!sel.ref.movable;
  syncSizeInputs();
  if (on) {
    $('radius').value = sel.ref.radius;
    $('intensity').value = sel.ref.intensity;
  }
  // Pestaña "Botón": a qué luz está vinculado el botón seleccionado
  const isBoton = !!(sel && sel.kind === 'boton');
  $('botonLink').disabled = $('botonVincular').disabled = !isBoton;
  $('botonTipo').textContent = isBoton ? DESC_BOTON[sel.ref.color]
    : 'Coloca un botón con las herramientas 4 o 5 y selecciónalo con Mover para elegir su luz.';
  if (isBoton) rellenarOpcionesBoton(sel.ref); else $('botonLink').innerHTML = '';
  $('luzTipo').textContent = on ? DESC_TIPO[sel.ref.tipo] : 'Elige una luz con las herramientas 1, 2 o 3 y selecciónala con Mover para ajustar su alcance e intensidad.';
  labels();
}
const DESC_BOTON = {
  roja: 'Botón rojo: se pulsa con una caja encima. Apaga UNA luz roja (la que elijas).',
  azul: 'Botón azul: lo pisas tú una vez. Apaga UNA luz amarilla (la que elijas).'
};
// Rellena la lista de luces: solo las del tipo que le toca y que aún no tienen otro botón
function rellenarOpcionesBoton(b) {
  const s = $('botonLink'); s.innerHTML = '';
  s.add(new Option('— Sin luz —', ''));
  for (const L of lucesLibres(b)) s.add(new Option('Luz ' + L.tipo + ' nº' + L.id, L.id));
  s.value = b.link == null ? '' : String(b.link);
}
$('botonLink').onchange = e => {
  if (sel?.kind === 'boton') sel.ref.link = e.target.value === '' ? null : +e.target.value;
  e.target.blur();
};
$('botonVincular').onclick = e => { if (sel?.kind === 'boton') empezarVinculo(sel.ref); e.target.blur(); };

function labels() {
  $('vR').textContent = $('radius').value + ' px';
  $('vI').textContent = (+$('intensity').value).toFixed(2);
  $('vA').textContent = Math.round($('ambient').value * 100) + '%';
  $('vB').textContent = $('blur').value + ' px';
}

$('radius').oninput = e => { if (sel?.kind === 'light') sel.ref.radius = +e.target.value; labels(); };
$('intensity').oninput = e => { if (sel?.kind === 'light') sel.ref.intensity = +e.target.value; labels(); };
$('ambient').oninput = labels; $('blur').oninput = labels;
$('reset').onclick = () => { totales.count = 0; totales.time = 0; cargarNivel(0); };


// Ancho y alto de la forma seleccionada (también se editan arrastrando sus tiradores)
function syncSizeInputs() {
  if (sel && sel.kind === 'shape') {
    const b = aabbOf(sel.ref);
    $('shW').value = Math.round(b.x1 - b.x0); $('shH').value = Math.round(b.y1 - b.y0);
  } else { $('shW').value = ''; $('shH').value = ''; }
}
function aplicarTamano() {
  if (!sel || sel.kind !== 'shape') return;
  const b = aabbOf(sel.ref), w = +$('shW').value, h = +$('shH').value;
  if (!(w >= 12 && h >= 12)) return;                 // ignora valores a medio escribir
  sel.ref.pts = boxFromBounds(b.x0, b.y0, b.x0 + w, b.y0 + h).pts;
}
$('shW').oninput = $('shH').oninput = aplicarTamano;
$('shMov').onchange = e => { if (sel && sel.kind === 'shape') sel.ref.movable = e.target.checked; };

/* ---------- Mostrar / ocultar la información de las esquinas ---------- */
let infoVisible = true;
function setInfo(v) {
  infoVisible = v;
  $('panel').hidden = $('hud').hidden = !v;
  $('btnInfo').textContent = v ? 'Ocultar info (H)' : 'Mostrar info (H)';
}
$('btnInfo').onclick = () => { setInfo(!infoVisible); $('btnInfo').blur(); };
addEventListener('keydown', e => { if (e.code === 'KeyH' && e.target === document.body) setInfo(!infoVisible); });
