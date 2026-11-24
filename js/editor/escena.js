/* ======================================================================
   6 · ESCENA Y PANEL                                   (js/editor/escena.js)
   ----------------------------------------------------------------------
   QUÉ HACE   1) «Fábricas» que crean luces, cajas y botones con sus valores por defecto.
              2) El panel izquierdo: pestañas Ayuda · Luz · Caja · Botón · Ajustes.
   CÓMO       Al seleccionar algo (select), syncUI() rellena el panel con los datos de ese objeto.
              Al mover un control del panel, su manejador (oninput / onchange) escribe el valor en el objeto.
              Es decir: objeto ⇄ panel, siempre sincronizados.
   OJO        Aquí no está el ratón ni el teclado del editor: eso es editor.js.
   ====================================================================== */

// Todas las formas son cajas. Si `movable` es true, el jugador puede empujarla
// (y como sigue proyectando sombra, sirve para tapar las luces).
// ---------- Fábricas de objetos ----------
function boxFromBounds(x0, y0, x1, y1, movable = false) {
  return { type: 'box', movable, pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => ({ x, y })) };
}

// Solo existen tres luces: 'azul' | 'roja' | 'amarilla'. El color lo decide el tipo (no se puede cambiar).
// `id` es el NÚMERO de la luz: sirve para que los botones la encuentren (botón nº N ↔ luz nº N).
// Tipos de luz y sus textos de ayuda.
const COLORES_TIPO = { azul: '#3d8bff', roja: '#ff2b2b', amarilla: '#ffd028' };
const DESC_TIPO = {
  azul: 'Luz azul: zona segura. Dentro de ella la luz roja y la amarilla no te hacen nada. Aparece al pisar su botón activador.',
  roja: 'Luz roja: te empuja una casilla. La apaga el botón sostenido enlazado (con una caja encima).',
  amarilla: 'Luz amarilla: te empuja una casilla. La apaga el botón de apagar enlazado (lo pisas tú).'
};
// Crea una luz. activa = encendida (la lógica de botones la cambia) · tapada = una caja la cubre · ruta = recorrido A→B (solo amarillas).
function makeLight(x, y, color = COLORES_TIPO.amarilla, radius = 170, intensity = 1, tipo = 'amarilla', id = null) {
  return { x, y, color, radius, intensity, tipo, id, activa: true };
}
// siguienteIdLuz = primer número libre · luzTipo = atajo para crear una luz por tipo ('azul' | 'roja' | 'amarilla').
const siguienteIdLuz = () => Math.max(0, ...lights.map(l => l.id ?? 0)) + 1;
const luzTipo = (x, y, tipo, id, radius = 170) => makeLight(x, y, COLORES_TIPO[tipo], radius, 1, tipo, id);

// Botón cuadrado centrado en (cx, cy). `link` = id de la luz que controla.
const makeBoton = (cx, cy, color, link, lado = 48) =>
  ({ x: cx - lado / 2, y: cy - lado / 2, w: lado, h: lado, color, link, pressed: false });

// Selecciona un objeto (o nada con null), actualiza el panel y, en el editor, salta a la pestaña que le corresponde.
function select(kind, ref) {
  sel = ref ? { kind, ref } : null;
  syncUI();
  // Al editar, el panel salta solo a la pestaña de lo que seleccionas (sin tener que buscarla)
  if (modo === 'editar' && ref) { if (kind === 'light') mostrarTab('luz'); else if (kind === 'shape') mostrarTab('caja'); else if (kind === 'boton') mostrarTab('boton'); }
}

/* ---------- Pestañas del panel ---------- */
// Muestra una pestaña del panel y oculta las demás.
function mostrarTab(nombre) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === nombre));
  document.querySelectorAll('.pane').forEach(p => p.hidden = p.dataset.pane !== nombre);
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { mostrarTab(b.dataset.tab); b.blur(); });
// ---------- Textos de las cabeceras del panel ----------
const TITULO_LUZ = { azul: 'Luz azul', roja: 'Luz roja', amarilla: 'Luz amarilla' };
const DESC_BOTON = {
  azul: 'Lo pisas una sola vez (sin mantener) y hace aparecer una luz azul.',
  roja: 'Se pulsa con una caja encima (hay que mantenerla). Mientras esté pulsado, apaga una luz roja.',
  amarilla: 'Lo pisas una sola vez y apaga para siempre una luz amarilla.'
};
const DESC_CAJA = {
  pared: 'Bloque fijo: proyecta sombra y el jugador no puede empujarlo.',
  caja: 'El jugador puede empujarla. Pisa botones sostenidos y tapa luces.'
};
// Cabecera de cada pestaña: icono grande (con el color de la luz o el botón), nombre y una frase
function cabecera(id, icono, color) {
  ponerIcono($(id + 'Icono'), icono);
  $(id + 'Icono').style.setProperty('--c', color);
}

// Rellena TODO el panel según lo seleccionado. Cada pestaña muestra «vacío» si no hay nada de su tipo seleccionado.
// Se llama desde select() y cada vez que cambia algo que el panel muestra (número de luz, tipo de caja, vínculo…).
function syncUI() {
  // ---- Pestaña Luz ----
  const on = !!(sel && sel.kind === 'light');
  for (const id of ['radius', 'intensity', 'luzNum']) $(id).disabled = !on;
  $('luzVacio').hidden = on; $('luzCtl').hidden = !on;
  $('luzNum').value = on ? sel.ref.id : '';
  if (on) {
    cabecera('luz', 'luz_' + sel.ref.tipo, COLORES_TIPO[sel.ref.tipo]);
    $('luzTitulo').textContent = TITULO_LUZ[sel.ref.tipo];
    $('luzTipo').textContent = DESC_TIPO[sel.ref.tipo];
    $('radius').value = sel.ref.radius;
    $('intensity').value = sel.ref.intensity;
  }
  // Ruta de la luz amarilla (A → B)
  const amarilla = !!(on && sel.ref.tipo === 'amarilla'), ruta = amarilla ? sel.ref.ruta : null;
  $('rutaBox').hidden = !amarilla;
  $('rutaOn').checked = !!ruta;
  $('rutaOpc').hidden = !ruta;
  for (const id of ['rutaVel', 'rutaVaiven', 'rutaElegir']) $(id).disabled = !ruta;
  if (ruta) { $('rutaVel').value = ruta.vel; $('rutaVaiven').checked = ruta.vaiven; }

  // ---- Pestaña Caja ----
  const isShape = !!(sel && sel.kind === 'shape');
  $('cajaVacio').hidden = isShape; $('cajaCtl').hidden = !isShape;
  $('shW').disabled = $('shH').disabled = $('shMov').disabled = !isShape;
  $('shMov').checked = isShape && !!sel.ref.movable;
  if (isShape) {
    const mov = !!sel.ref.movable;
    cabecera('caja', mov ? 'crate' : 'box', mov ? '#a8672f' : '#7a3324');
    $('cajaTitulo').textContent = mov ? 'Caja móvil' : 'Pared';
    $('cajaDesc').textContent = mov ? DESC_CAJA.caja : DESC_CAJA.pared;
  }
  syncSizeInputs();

  // ---- Pestaña Botón ----
  const isBoton = !!(sel && sel.kind === 'boton');
  $('botonVacio').hidden = isBoton; $('botonCtl').hidden = !isBoton;
  $('botonLink').disabled = $('botonVincular').disabled = !isBoton;
  if (isBoton) {
    cabecera('boton', 'boton_' + sel.ref.color, COLOR_BOTON[sel.ref.color]);
    $('botonTitulo').textContent = NOMBRE_BOTON[sel.ref.color];
    $('botonTipo').textContent = DESC_BOTON[sel.ref.color];
    rellenarOpcionesBoton(sel.ref);
  } else { $('botonLink').innerHTML = ''; $('botonChips').innerHTML = ''; }
  labels();
}

// Luces que puede controlar el botón (solo las de su tipo y sin otro botón): se muestran como fichas con su icono
function rellenarOpcionesBoton(b) {
  const s = $('botonLink'); s.innerHTML = '';
  s.add(new Option('— Sin luz —', ''));
  const libres = lucesLibres(b);
  for (const L of libres) s.add(new Option('Nº ' + L.id + ' · luz ' + L.tipo, L.id));
  s.value = b.link == null ? '' : String(b.link);

  const caja = $('botonChips'); caja.innerHTML = '';
  const ficha = (id, tipo, texto) => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'chip' + ((b.link ?? null) === id ? ' on' : '');
    c.innerHTML = (tipo ? iconoSVG('luz_' + tipo) : '') + '<span>' + texto + '</span>';
    c.onclick = () => { b.link = id; c.blur(); rellenarOpcionesBoton(b); };
    caja.appendChild(c);
  };
  ficha(null, null, 'Sin luz');
  for (const L of libres) ficha(L.id, L.tipo, 'Nº ' + L.id);
  if (!libres.length) {
    const p = document.createElement('p'); p.className = 'vacio-mini';
    p.textContent = 'No hay luces ' + PLURAL_LUZ[LUZ_DE_BOTON[b.color]] + ' libres. Crea una con la barra de abajo.';
    caja.appendChild(p);
  }
}

// Botones − / + de los campos numéricos
document.querySelectorAll('.stepper button').forEach(b => b.onclick = () => {
  const inp = $(b.dataset.for), paso = +inp.step || 1, min = inp.min !== '' ? +inp.min : -Infinity;
  inp.value = Math.max(min, (+inp.value || 0) + paso * +b.dataset.paso);
  inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change'));
  b.blur();
});

// Número de la luz: lo eliges tú; los botones enlazados a ella lo siguen
// ---------- Manejadores de los controles del panel ----------
$('luzNum').onchange = e => {
  if (sel?.kind !== 'light') return;
  const n = Math.floor(+e.target.value), L = sel.ref;
  if (!(n >= 1)) { e.target.value = L.id; aviso('El número debe ser 1 o mayor'); }
  else if (lights.some(o => o !== L && o.id === n)) { e.target.value = L.id; aviso('Ya hay otra luz con el nº ' + n); }
  else { for (const b of botones) if (b.link === L.id) b.link = n; L.id = n; }
  e.target.blur(); syncUI();
};
$('botonLink').onchange = e => {
  if (sel?.kind === 'boton') sel.ref.link = e.target.value === '' ? null : +e.target.value;
  e.target.blur();
};
$('rutaOn').onchange = e => {
  if (sel?.kind !== 'light' || sel.ref.tipo !== 'amarilla') return;
  const L = sel.ref;
  L.ruta = e.target.checked ? { x: Math.min(W - 24, L.x + 192), y: L.y, vel: 120, vaiven: true } : null;   // B empieza 192 px a la derecha
  e.target.blur(); syncUI();
};
$('rutaVel').oninput = e => { if (sel?.ref?.ruta) sel.ref.ruta.vel = +e.target.value; labels(); };
$('rutaVaiven').onchange = e => { if (sel?.ref?.ruta) sel.ref.ruta.vaiven = e.target.checked; e.target.blur(); };
$('rutaElegir').onclick = e => { if (sel?.kind === 'light' && sel.ref.ruta) empezarElegirB(sel.ref); e.target.blur(); };
$('botonVincular').onclick = e => { if (sel?.kind === 'boton') empezarVinculo(sel.ref); e.target.blur(); };

// Actualiza los textos de valor junto a las barras (alcance, intensidad, luz ambiente, suavidad, velocidad).
function labels() {
  $('vR').textContent = $('radius').value + ' px';
  $('vI').textContent = (+$('intensity').value).toFixed(2);
  $('vA').textContent = Math.round($('ambient').value * 100) + '%';
  $('vB').textContent = $('blur').value + ' px';
  $('vV').textContent = $('rutaVel').value + ' px/s';
}

$('radius').oninput = e => { if (sel?.kind === 'light') sel.ref.radius = +e.target.value; labels(); };
$('intensity').oninput = e => { if (sel?.kind === 'light') sel.ref.intensity = +e.target.value; labels(); };
$('ambient').oninput = labels; $('blur').oninput = labels;
$('reset').onclick = () => { totales.count = 0; totales.time = 0; cargarNivel(0); };


// Ancho y alto de la forma seleccionada (también se editan arrastrando sus tiradores)
// ---------- Tamaño de las cajas ----------
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
$('shMov').onchange = e => { if (sel && sel.kind === 'shape') { sel.ref.movable = e.target.checked; syncUI(); } e.target.blur(); };

/* ---------- Mostrar / ocultar la interfaz (panel, HUD y barra inferior) con la tecla K ---------- */
let infoVisible = true;
function setInfo(v) {
  infoVisible = v;
  $('panel').hidden = $('hud').hidden = $('toolbar').hidden = !v;
  $('btnInfo').textContent = v ? 'Ocultar info (K)' : 'Mostrar info (K)';
}
$('btnInfo').onclick = () => { setInfo(!infoVisible); $('btnInfo').blur(); };
addEventListener('keydown', e => { if (e.code === 'KeyK' && e.target === document.body) setInfo(!infoVisible); });
