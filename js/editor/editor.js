/* ======================================================================
   7 · EDITOR DE NIVELES
   Modo "editar": crear, mover, redimensionar y borrar cajas.
   Guardar/cargar en el navegador (localStorage) o exportar/importar JSON.
   ====================================================================== */

const GRID = 24;
let modo = 'jugar';          // 'jugar' | 'editar'
let herramienta = 'select';  // select | box | light | player | delete
let creando = null;          // forma que se está dibujando con el mouse
let cursorQ = null;          // posición del mouse ajustada a la cuadrícula
let vinculando = null;       // botón que está esperando que hagas clic en su luz

/* ---------- Vínculos botón ↔ luz (uno a uno) ---------- */
const LUZ_DE_BOTON = { roja: 'roja', azul: 'amarilla' };   // qué tipo de luz apaga cada color de botón
const luzLibre = (L, b) => !botones.some(o => o !== b && o.link === L.id);   // ningún OTRO botón la usa
const lucesLibres = b => lights.filter(L => L.tipo === LUZ_DE_BOTON[b.color] && luzLibre(L, b));

function empezarVinculo(b) {
  const tipo = LUZ_DE_BOTON[b.color];
  if (!lucesLibres(b).length) {
    vinculando = null;
    aviso('No hay luces ' + tipo + 's libres: coloca una y vincula el botón en la pestaña Botón');
    return;
  }
  vinculando = b;
  aviso('Haz clic en la luz ' + tipo + ' que apagará este botón (Esc cancela)');
}
function intentarVincular(b, L) {
  const tipo = LUZ_DE_BOTON[b.color];
  if (L.tipo !== tipo) return aviso('Un botón ' + b.color + ' solo apaga luces ' + tipo + 's');
  if (!luzLibre(L, b)) return aviso('Esa luz ya tiene otro botón');
  b.link = L.id; vinculando = null; syncUI();
  aviso('Botón vinculado a la luz nº' + L.id);
}

const pos = e => ({ x: e.clientX, y: e.clientY });
const snap = p => $('snap').checked
  ? { x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID } : p;

let avisoTimer;
function aviso(txt) {
  const el = $('toast'); el.textContent = txt; el.classList.add('show');
  clearTimeout(avisoTimer); avisoTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ---------- Modos y herramientas ---------- */
function setModo(m) {
  modo = m; creando = null; drag = null; vinculando = null;
  if (m === 'editar') editado = true;     // un nivel editado ya no hace avanzar de nivel (juego/niveles.js)
  for (const k in keys) keys[k] = false;
  if (m === 'editar') { restaurarCajas(); player.x = spawn.x; player.y = spawn.y; }   // se edita el estado inicial
  else { guardarCajas(); resetEstadisticas(); }
  $('tools').hidden = m !== 'editar';
  $('btnModo').textContent = m === 'editar' ? '▶ Jugar (E)' : '✎ Editar (E)';
  setHerramienta(herramienta);
}
// Las cajas móviles vuelven a su sitio al entrar al editor o al pulsar R jugando
function guardarCajas() { for (const s of shapes) if (s.movable) s.home = s.pts.map(p => ({ ...p })); }
function restaurarCajas() { for (const s of shapes) if (s.movable && s.home) s.pts = s.home.map(p => ({ ...p })); }
function reiniciarJuego() {
  restaurarCajas(); player.x = spawn.x; player.y = spawn.y; resetEstadisticas(); aviso('Nivel reiniciado');
}

function setHerramienta(t) {
  herramienta = t;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  cv.style.cursor = modo === 'editar' && t !== 'select' ? 'crosshair' : 'default';
}

/* ---------- Selección ---------- */
function hitTest(p) {
  for (let i = lights.length - 1; i >= 0; i--)
    if (Math.hypot(lights[i].x - p.x, lights[i].y - p.y) < 24) return { kind: 'light', ref: lights[i] };
  if (p.x >= player.x && p.x <= player.x + player.w && p.y >= player.y && p.y <= player.y + player.h)
    return { kind: 'player', ref: player };
  for (let i = shapes.length - 1; i >= 0; i--)
    if (inPoly(p, shapes[i].pts)) return { kind: 'shape', ref: shapes[i] };
  for (let i = botones.length - 1; i >= 0; i--) {
    const b = botones[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { kind: 'boton', ref: b };
  }
  if (puerta && p.x >= puerta.x && p.x <= puerta.x + puerta.w && p.y >= puerta.y && p.y <= puerta.y + puerta.h)
    return { kind: 'puerta', ref: puerta };
  return null;
}
function anchorOf(h) {
  if (h.kind === 'shape') { const b = aabbOf(h.ref); return { x: b.x0, y: b.y0 }; }
  return { x: h.ref.x, y: h.ref.y };
}
function borrar(h) {
  if (h.kind === 'player') return aviso('El jugador no se puede borrar');
  if (h.kind === 'boton') { const i = botones.indexOf(h.ref); if (i >= 0) botones.splice(i, 1); }
  else if (h.kind === 'puerta') puerta = null;
  else {
    const arr = h.kind === 'light' ? lights : shapes;
    const i = arr.indexOf(h.ref); if (i >= 0) arr.splice(i, 1);
    if (h.kind === 'light') for (const b of botones) if (b.link === h.ref.id) b.link = null;   // el botón queda sin luz
  }
  if (vinculando === h.ref) vinculando = null;
  if (sel && sel.ref === h.ref) select(null, null); else syncUI();
}

/* ---------- Redimensionar: 8 tiradores alrededor de la caja seleccionada ---------- */
const TIRADORES = { nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] };
const CURSORES = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
                   n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };
const MIN_LADO = 12;
const posTirador = (b, k) => ({ x: b.x0 + (b.x1 - b.x0) * TIRADORES[k][0], y: b.y0 + (b.y1 - b.y0) * TIRADORES[k][1] });

function handleAt(p) {
  if (modo !== 'editar' || !sel || sel.kind !== 'shape') return null;
  const b = aabbOf(sel.ref);
  for (const k in TIRADORES) {
    const h = posTirador(b, k);
    if (Math.abs(p.x - h.x) <= 8 && Math.abs(p.y - h.y) <= 8) return k;
  }
  return null;
}
function redimensionar(d, t) {          // d.b = caja original, d.resize = tirador agarrado
  let { x0, y0, x1, y1 } = d.b;
  if (d.resize.includes('w')) x0 = Math.min(t.x, x1 - MIN_LADO);
  if (d.resize.includes('e')) x1 = Math.max(t.x, x0 + MIN_LADO);
  if (d.resize.includes('n')) y0 = Math.min(t.y, y1 - MIN_LADO);
  if (d.resize.includes('s')) y1 = Math.max(t.y, y0 + MIN_LADO);
  d.ref.pts = boxFromBounds(x0, y0, x1, y1).pts;
  syncSizeInputs();
}

/* ---------- Ratón ---------- */
cv.addEventListener('pointerdown', e => {
  if (modo !== 'editar') return;
  if (vinculando) {                              // esperando que elijas la luz de un botón
    const h = hitTest(pos(e));
    if (h && h.kind === 'light') intentarVincular(vinculando, h.ref);
    else aviso('Haz clic en una luz ' + LUZ_DE_BOTON[vinculando.color] + ' (Esc cancela)');
    return;
  }
  cv.setPointerCapture(e.pointerId);
  const p = pos(e), q = snap(p);
  switch (herramienta) {
    case 'select': {
      const k = handleAt(p);
      if (k) { drag = { resize: k, ref: sel.ref, b: aabbOf(sel.ref) }; break; }
      const h = hitTest(p);
      if (!h) { select(null, null); break; }
      select(h.kind, h.ref);
      const a = anchorOf(h);
      drag = { item: h, ox: p.x - a.x, oy: p.y - a.y };
      break;
    }
    case 'box': case 'crate':
      creando = { x0: q.x, y0: q.y, x1: q.x, y1: q.y, movable: herramienta === 'crate' }; break;
    case 'luz_azul': case 'luz_roja': case 'luz_amarilla': {
      const l = luzTipo(q.x, q.y, herramienta.slice(4), siguienteIdLuz());   // azul / roja / amarilla
      lights.push(l); select('light', l); break;
    }
    case 'boton_azul': case 'boton_roja': {
      const b = makeBoton(q.x, q.y, herramienta.slice(6), null);   // 'boton_azul' → 'azul'
      botones.push(b); select('boton', b); empezarVinculo(b); break;
    }
    case 'puerta':
      puerta = makePuerta(q.x, q.y); select('puerta', puerta); break;
    case 'player':
      player.x = q.x - player.w / 2; player.y = q.y - player.h / 2;
      spawn.x = player.x; spawn.y = player.y; select('player', player); break;
    case 'delete': { const h = hitTest(p); if (h) borrar(h); break; }
  }
});

cv.addEventListener('pointermove', e => {
  const p = pos(e); cursorQ = snap(p);
  if (modo !== 'editar') return;
  if (creando) { creando.x1 = cursorQ.x; creando.y1 = cursorQ.y; return; }
  if (!drag) {
    if (herramienta === 'select') { const k = handleAt(p); cv.style.cursor = k ? CURSORES[k] : hitTest(p) ? 'grab' : 'default'; }
    return;
  }
  if (drag.resize) { redimensionar(drag, snap(p)); return; }
  cv.style.cursor = 'grabbing';
  const t = snap({ x: p.x - drag.ox, y: p.y - drag.oy });
  const { kind, ref } = drag.item;
  if (kind === 'shape') {
    const b = aabbOf(ref), dx = t.x - b.x0, dy = t.y - b.y0;
    for (const q of ref.pts) { q.x += dx; q.y += dy; }
  } else {
    ref.x = t.x; ref.y = t.y;
    if (kind === 'player') { spawn.x = t.x; spawn.y = t.y; }
  }
});

function soltar() {
  if (creando) {
    const { x0, y0, x1, y1, movable } = creando;
    let a = Math.min(x0, x1), b = Math.min(y0, y1), c = Math.max(x0, x1), d = Math.max(y0, y1);
    if (c - a < 8 || d - b < 8) { a = x0 - 48; b = y0 - 48; c = x0 + 48; d = y0 + 48; }  // clic simple = tamaño por defecto
    const s = boxFromBounds(a, b, c, d, movable);
    shapes.push(s); select('shape', s); creando = null;
  }
  drag = null;
  if (modo === 'editar') setHerramienta(herramienta);
}
cv.addEventListener('pointerup', soltar);
cv.addEventListener('pointercancel', soltar);

/* ---------- Teclado ---------- */
addEventListener('keydown', e => {
  if (e.target !== document.body || fin) return;
  if (e.code === 'Escape' && vinculando) { vinculando = null; aviso('Vínculo cancelado'); return; }
  if (e.code === 'KeyE') { setModo(modo === 'editar' ? 'jugar' : 'editar'); return; }
  if (e.code === 'KeyR' && modo === 'jugar') { reiniciarJuego(); return; }
  if (modo !== 'editar') return;
  const t = { KeyV: 'select', KeyB: 'box', KeyM: 'crate', Digit1: 'luz_azul', Digit2: 'luz_roja', Digit3: 'luz_amarilla', Digit4: 'boton_azul', Digit5: 'boton_roja', KeyO: 'puerta', KeyP: 'player', KeyX: 'delete' }[e.code];
  if (t) setHerramienta(t);
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel) borrar(sel);
});

/* ---------- Guardar y cargar niveles ---------- */
// NUEVO · ahora también se guardan el tipo/id de las luces y los botones
function nivelADatos() {
  return {
    version: 2,
    ambient: +$('ambient').value,
    player: { x: spawn.x, y: spawn.y },
    lights: lights.map(({ x, y, color, radius, intensity, tipo, id }) => ({ x, y, color, radius, intensity, tipo, id })),
    botones: botones.map(({ x, y, w, h, color, link }) => ({ x, y, w, h, color, link })),
    puerta: puerta ? { x: puerta.x, y: puerta.y, w: puerta.w, h: puerta.h } : null,
    shapes: shapes.map(s => ({ type: 'box', movable: !!s.movable, skin: s.skin ?? null, pts: s.pts.map(p => [p.x, p.y]) }))
  };
}
function cargarDatos(d) {
  lights.length = 0; shapes.length = 0; botones.length = 0; vinculando = null; editado = true;
  puerta = d.puerta ? { x: d.puerta.x, y: d.puerta.y, w: d.puerta.w, h: d.puerta.h } : null;
  (d.lights || []).forEach(l => {
    const tipo = COLORES_TIPO[l.tipo] ? l.tipo : 'amarilla';     // niveles viejos con luces de color libre pasan a amarilla
    lights.push(makeLight(l.x, l.y, COLORES_TIPO[tipo], l.radius, l.intensity, tipo, l.id ?? null));
  });
  for (const L of lights) if (L.id == null) L.id = siguienteIdLuz();   // ids únicos para luces sin id
  (d.botones || []).forEach(b => botones.push({ x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, link: b.link, pressed: false }));
  (d.shapes || []).forEach(s => {        // niveles viejos con triángulos o círculos pasan a cajas
    const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
    const box = boxFromBounds(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), !!s.movable);
    box.skin = s.skin ?? null;          // si es null, se sortea al dibujarla
    shapes.push(box);
  });
  spawn.x = d.player?.x ?? 40; spawn.y = d.player?.y ?? H - 80;
  player.x = spawn.x; player.y = spawn.y; clampPlayer();
  if (d.ambient != null) $('ambient').value = d.ambient;
  resetEstadisticas(); select(null, null);
}

$('btnModo').onclick = () => setModo(modo === 'editar' ? 'jugar' : 'editar');
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setHerramienta(b.dataset.tool));
$('toolbar').addEventListener('click', e => e.target.blur && e.target.blur());

$('nSave').onclick = () => {
  try { localStorage.setItem('nivel-luz', JSON.stringify(nivelADatos())); aviso('Nivel guardado en el navegador'); }
  catch { aviso('No se pudo guardar (usa Exportar)'); }
};
$('nLoad').onclick = () => {
  try {
    const raw = localStorage.getItem('nivel-luz');
    if (!raw) return aviso('No hay ningún nivel guardado');
    cargarDatos(JSON.parse(raw)); aviso('Nivel cargado');
  } catch { aviso('No se pudo cargar el nivel'); }
};
$('nExport').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(nivelADatos(), null, 2)], { type: 'application/json' }));
  a.download = 'nivel.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('nImport').onclick = () => $('file').click();
$('file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { cargarDatos(JSON.parse(t)); aviso('Nivel importado'); })
    .catch(() => aviso('El archivo no es un nivel válido'));
  e.target.value = '';
};
$('nNew').onclick = () => { cargarDatos({ lights: [], shapes: [], ambient: 0.07 }); aviso('Nivel vacío'); };

/* ---------- Dibujo del editor (se llama desde main.js) ---------- */
function dibujarEditor() {
  if (creando) {
    const { x0, y0, x1, y1 } = creando;
    const s = boxFromBounds(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1));
    ctx.beginPath();
    s.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,179,71,.18)'; ctx.fill();
    ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeStyle = '#ffb347'; ctx.stroke(); ctx.setLineDash([]);
  }
  if (cursorQ && herramienta !== 'select' && herramienta !== 'delete') {
    ctx.strokeStyle = 'rgba(20,20,20,.6)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cursorQ.x - 8, cursorQ.y); ctx.lineTo(cursorQ.x + 8, cursorQ.y);
    ctx.moveTo(cursorQ.x, cursorQ.y - 8); ctx.lineTo(cursorQ.x, cursorQ.y + 8);
    ctx.stroke();
  }
  if (sel && sel.kind === 'shape') {                       // tiradores de redimensión
    const b = aabbOf(sel.ref);
    for (const k in TIRADORES) {
      const h = posTirador(b, k);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
      ctx.fillRect(h.x - 5, h.y - 5, 10, 10); ctx.strokeRect(h.x - 5, h.y - 5, 10, 10);
    }
  }
  // Números de las luces y a qué luz apunta cada botón (para no confundirse al vincular)
  ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
  for (const L of lights) {
    const txt = '#' + L.id, ty = L.y - SIZE_LUZ / 2 - 6;
    ctx.fillStyle = 'rgba(11,13,18,.85)'; ctx.fillRect(L.x - 16, ty - 12, 32, 16);
    ctx.fillStyle = L.color; ctx.fillText(txt, L.x, ty);
  }
  for (const b of botones) {
    const L = lights.find(l => l.id === b.link), ok = !!L;
    ctx.fillStyle = 'rgba(11,13,18,.85)'; ctx.fillRect(b.x - 6, b.y - 20, b.w + 12, 16);
    ctx.fillStyle = ok ? '#e6e8ee' : '#ff7a7a';
    ctx.fillText(ok ? '→ luz #' + L.id : '¡sin luz!', b.x + b.w / 2, b.y - 8);
  }
  ctx.textAlign = 'left';
  if (sel && (sel.kind === 'boton' || sel.kind === 'puerta')) {   // contorno del botón / puerta seleccionados
    const r = sel.ref;
    ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = '#ffb347';
    ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8); ctx.setLineDash([]);
  }
  if (vinculando) {                                    // luces que puedes elegir: anillo pulsante del color de la luz
    const pulso = 4 + 3 * Math.sin(performance.now() / 150);
    for (const L of lucesLibres(vinculando)) {
      ctx.beginPath(); ctx.arc(L.x, L.y, SIZE_LUZ / 2 + pulso, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = L.color; ctx.stroke();
    }
    ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = '#ffb347';
    ctx.strokeRect(vinculando.x - 4, vinculando.y - 4, vinculando.w + 8, vinculando.h + 8); ctx.setLineDash([]);
  }
  if (sel && sel.kind === 'player') {
    ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = '#ffb347';
    ctx.strokeRect(player.x - 4, player.y - 4, player.w + 8, player.h + 8); ctx.setLineDash([]);
  }
}
