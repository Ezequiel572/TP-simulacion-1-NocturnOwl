(() => {
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const lc = document.createElement('canvas'), lx = lc.getContext('2d');
const $ = id => document.getElementById(id);
let W, H, dpr;

const lights = [];
const shapes = [];
let sel = null;          // { kind:'light'|'shape', ref }
let drag = null;
let mouse = { x: 0, y: 0 };
const player = { x: 0, y: 0, w: 28, h: 28, speed: 230 };
const keys = {};
const stat = { lit: false, count: 0, time: 0 };
let lastT = 0;

function resize() {
  dpr = window.devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  for (const c of [cv, lc]) { c.width = W * dpr; c.height = H * dpr; }
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
}
addEventListener('resize', resize); resize();

/* ---------- Escena ---------- */
function makeShape(type, cx, cy, s = 60) {
  let pts = [];
  if (type === 'box') pts = [[-s,-s],[s,-s],[s,s],[-s,s]];
  else if (type === 'tri') pts = [[0,-s*1.1],[s*1.1,s*0.8],[-s*1.1,s*0.8]];
  else for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push([Math.cos(a)*s, Math.sin(a)*s]); }
  return { pts: pts.map(p => ({ x: cx + p[0], y: cy + p[1] })) };
}
function makeLight(x, y, color = '#ffb347', radius = 420, intensity = 1) {
  return { x, y, color, radius, intensity };
}
function resetScene() {
  lights.length = 0; shapes.length = 0;
  const cx = W / 2, cy = H / 2;
  lights.push(makeLight(cx - 40, cy + 20, '#ffb347', 460, 1));
  lights.push(makeLight(cx + 330, cy - 120, '#5aa9ff', 380, 0.9));
  shapes.push(makeShape('box', cx + 140, cy + 20, 50));
  shapes.push(makeShape('tri', cx + 40, cy - 190, 55));
  shapes.push(makeShape('circle', cx - 220, cy - 110, 45));
  shapes.push(makeShape('box', cx + 330, cy + 190, 40));
  player.x = 40; player.y = H - 80;
  stat.lit = false; stat.count = 0; stat.time = 0;
  select('light', lights[0]);
}

function addLight(x = W / 2, y = H / 2) {
  const palette = ['#ffb347', '#5aa9ff', '#ff6b8b', '#7dffb0', '#c58bff', '#fff2cc'];
  const l = makeLight(x, y, palette[lights.length % palette.length]);
  lights.push(l); select('light', l);
}
function addShape(t) {
  const s = makeShape(t, W / 2 + (Math.random() - .5) * 200, H / 2 + (Math.random() - .5) * 200, 45 + Math.random() * 25);
  shapes.push(s); select('shape', s);
}

function select(kind, ref) {
  sel = ref ? { kind, ref } : null;
  syncUI();
}
function syncUI() {
  const on = sel && sel.kind === 'light';
  for (const id of ['color', 'radius', 'intensity']) $(id).disabled = !on;
  if (on) {
    $('color').value = sel.ref.color;
    $('radius').value = sel.ref.radius;
    $('intensity').value = sel.ref.intensity;
  }
  labels();
}
function labels() {
  $('vR').textContent = $('radius').value + ' px';
  $('vI').textContent = (+$('intensity').value).toFixed(2);
  $('vA').textContent = Math.round($('ambient').value * 100) + '%';
  $('vB').textContent = $('blur').value + ' px';
}

$('color').oninput = e => { if (sel?.kind === 'light') sel.ref.color = e.target.value; };
$('radius').oninput = e => { if (sel?.kind === 'light') sel.ref.radius = +e.target.value; labels(); };
$('intensity').oninput = e => { if (sel?.kind === 'light') sel.ref.intensity = +e.target.value; labels(); };
$('ambient').oninput = labels; $('blur').oninput = labels;
$('addLight').onclick = () => addLight();
$('addBox').onclick = () => addShape('box');
$('addTri').onclick = () => addShape('tri');
$('addCircle').onclick = () => addShape('circle');
$('reset').onclick = resetScene;

/* ---------- Interacción ---------- */
function inPoly(p, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function pos(e) { return { x: e.clientX, y: e.clientY }; }

cv.addEventListener('pointerdown', e => {
  const p = pos(e); cv.setPointerCapture(e.pointerId);
  for (let i = lights.length - 1; i >= 0; i--) {
    if (Math.hypot(lights[i].x - p.x, lights[i].y - p.y) < 16) {
      select('light', lights[i]); drag = { kind: 'light', ref: lights[i], ox: p.x - lights[i].x, oy: p.y - lights[i].y }; return;
    }
  }
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (inPoly(p, shapes[i].pts)) {
      select('shape', shapes[i]); drag = { kind: 'shape', ref: shapes[i], lx: p.x, ly: p.y }; return;
    }
  }
  select(null, null);
});
cv.addEventListener('pointermove', e => {
  const p = pos(e); mouse = p;
  if (!drag) {
    const over = lights.some(l => Math.hypot(l.x - p.x, l.y - p.y) < 16) || shapes.some(s => inPoly(p, s.pts));
    cv.style.cursor = over ? 'grab' : 'default';
    return;
  }
  cv.style.cursor = 'grabbing';
  if (drag.kind === 'light') { drag.ref.x = p.x - drag.ox; drag.ref.y = p.y - drag.oy; }
  else {
    const dx = p.x - drag.lx, dy = p.y - drag.ly; drag.lx = p.x; drag.ly = p.y;
    for (const q of drag.ref.pts) { q.x += dx; q.y += dy; }
  }
});
const end = () => { drag = null; };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
cv.addEventListener('dblclick', e => {
  const p = pos(e);
  if (!shapes.some(s => inPoly(p, s.pts))) addLight(p.x, p.y);
});
addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel && e.target === document.body) {
    const arr = sel.kind === 'light' ? lights : shapes;
    const i = arr.indexOf(sel.ref); if (i >= 0) arr.splice(i, 1);
    select(null, null);
  }
});

/* ---------- Jugador (colisiones AABB) ---------- */
const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', e => {
  if (!MOVE.has(e.code)) return;
  if (e.target instanceof HTMLInputElement && e.target.type === 'range') e.target.blur();
  keys[e.code] = true; e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// Caja delimitadora alineada a los ejes de cada objeto
function aabbOf(s) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of s.pts) {
    if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y;
  }
  return { x0, y0, x1, y1 };
}
const overlap = (p, b) => p.x < b.x1 && p.x + p.w > b.x0 && p.y < b.y1 && p.y + p.h > b.y0;
const clampPlayer = () => {
  player.x = Math.max(0, Math.min(W - player.w, player.x));
  player.y = Math.max(0, Math.min(H - player.h, player.y));
};

function movePlayer(dt) {
  const boxes = shapes.map(aabbOf);
  let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }

  // Se mueve y resuelve cada eje por separado
  player.x += dx * player.speed * dt;
  for (const b of boxes) if (overlap(player, b)) {
    if (dx > 0) player.x = b.x0 - player.w; else if (dx < 0) player.x = b.x1;
  }
  player.y += dy * player.speed * dt;
  for (const b of boxes) if (overlap(player, b)) {
    if (dy > 0) player.y = b.y0 - player.h; else if (dy < 0) player.y = b.y1;
  }
  clampPlayer();

  // Si un objeto arrastrado cae sobre el jugador, lo expulsa por el lado más corto
  for (const b of boxes) if (overlap(player, b)) {
    const l = player.x + player.w - b.x0, r = b.x1 - player.x;
    const t = player.y + player.h - b.y0, u = b.y1 - player.y;
    const m = Math.min(l, r, t, u);
    if (m === l) player.x -= l; else if (m === r) player.x += r;
    else if (m === t) player.y -= t; else player.y += u;
  }
  clampPlayer();
}

// Intersección rayo-AABB (método de slabs): distancia de entrada o null
function rayAABB(ox, oy, dx, dy, p) {
  let tmin = 0, tmax = Infinity;
  for (const [o, d, lo, hi] of [[ox, dx, p.x, p.x + p.w], [oy, dy, p.y, p.y + p.h]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return null; continue; }
    let t1 = (lo - o) / d, t2 = (hi - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// Un solo rayo por luz, siempre apuntando al centro del jugador.
// Mide como máximo el alcance de la luz y se corta en el primer muro.
// El jugador es tocado si el rayo entra en su AABB antes de ese límite.
function castRays(segs) {
  const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
  return lights.map(L => {
    let dx = cx - L.x, dy = cy - L.y;
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let wall = Infinity;
    for (const s of segs) { const t = rayHit(L.x, L.y, dx, dy, s); if (t !== null && t < wall) wall = t; }
    const len = Math.min(wall, L.radius);
    const tp = rayAABB(L.x, L.y, dx, dy, player);
    return { L, dx, dy, len, hit: tp !== null && tp <= len };
  });
}

function updateHUD(hits) {
  $('hud').classList.toggle('lit', stat.lit);
  $('hState').textContent = stat.lit ? '¡Tocado por la luz!' : 'En sombra';
  $('hN').textContent = hits.length;
  $('hC').textContent = stat.count;
  $('hT').textContent = stat.time.toFixed(1);
}

// Raycast visible: un rayo por luz, del tamaño de su alcance
function drawRays(rays) {
  for (const R of rays) {
    const { L } = R;
    const [r, g, b] = rgb(L.color).map(v => v * 0.7 | 0);
    const ex = L.x + R.dx * R.len, ey = L.y + R.dy * R.len;
    ctx.beginPath(); ctx.arc(L.x, L.y, L.radius, 0, Math.PI * 2);
    ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${r},${g},${b},.7)`; ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(ex, ey);
    ctx.lineWidth = 2; ctx.strokeStyle = R.hit ? '#e5262a' : `rgb(${r},${g},${b})`; ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = R.hit ? '#e5262a' : `rgb(${r},${g},${b})`; ctx.fill();
  }
}

/* ---------- Geometría de luz ---------- */
function segments() {
  const segs = [
    { ax: 0, ay: 0, bx: W, by: 0 }, { ax: W, ay: 0, bx: W, by: H },
    { ax: W, ay: H, bx: 0, by: H }, { ax: 0, ay: H, bx: 0, by: 0 }
  ];
  for (const s of shapes) {
    for (let i = 0; i < s.pts.length; i++) {
      const a = s.pts[i], b = s.pts[(i + 1) % s.pts.length];
      segs.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
    }
  }
  return segs;
}
function rayHit(ox, oy, dx, dy, s) {
  const sx = s.bx - s.ax, sy = s.by - s.ay;
  const den = dx * sy - dy * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((s.ax - ox) * sy - (s.ay - oy) * sx) / den;
  const u = ((s.ax - ox) * dy - (s.ay - oy) * dx) / den;
  return (t > 0 && u >= 0 && u <= 1) ? t : null;
}
function visibility(L, segs) {
  const angles = [];
  for (const s of segs) {
    for (const [x, y] of [[s.ax, s.ay], [s.bx, s.by]]) {
      const a = Math.atan2(y - L.y, x - L.x);
      angles.push(a - 0.0002, a, a + 0.0002);
    }
  }
  const out = [];
  for (const a of angles) {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = Infinity;
    for (const s of segs) { const t = rayHit(L.x, L.y, dx, dy, s); if (t !== null && t < best) best = t; }
    if (best < Infinity) out.push({ a, x: L.x + dx * best, y: L.y + dy * best });
  }
  out.sort((p, q) => p.a - q.a);
  return out;
}
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

/* ---------- Dibujo ---------- */
function drawFloor() {
  ctx.fillStyle = '#d9d4c7'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(60,55,45,.18)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 48) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
  for (let y = 0; y <= H; y += 48) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  ctx.stroke();
}

function frame(t) {
  const segs = segments();
  const amb = +$('ambient').value;
  const blur = +$('blur').value;
  const flick = $('flicker').checked;

  // Jugador: movimiento, colisiones y detección de luz
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  movePlayer(dt);
  const rays = castRays(segs);
  const hits = rays.filter(r => r.hit);
  const lit = hits.length > 0;
  if (lit && !stat.lit) stat.count++;
  if (lit) stat.time += dt;
  stat.lit = lit;
  updateHUD(hits);

  // Capa de luz
  lx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lx.globalCompositeOperation = 'source-over';
  const g = Math.round(amb * 255);
  lx.fillStyle = `rgb(${g},${g},${Math.min(255, g + 8)})`;
  lx.fillRect(0, 0, W, H);
  lx.globalCompositeOperation = 'lighter';

  lights.forEach((L, i) => {
    const poly = visibility(L, segs);
    if (!poly.length) return;
    const [r, gr, b] = rgb(L.color);
    let I = L.intensity;
    if (flick) I *= 0.9 + 0.1 * Math.sin(t / 90 + i * 7) * Math.sin(t / 37 + i) + 0.04 * Math.sin(t / 23 + i * 3);
    const grad = lx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.radius);
    grad.addColorStop(0, `rgba(${r},${gr},${b},${Math.min(1, I)})`);
    grad.addColorStop(0.35, `rgba(${r},${gr},${b},${Math.min(1, I) * 0.5})`);
    grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    lx.fillStyle = grad;
    lx.beginPath();
    lx.moveTo(poly[0].x, poly[0].y);
    for (let k = 1; k < poly.length; k++) lx.lineTo(poly[k].x, poly[k].y);
    lx.closePath(); lx.fill();
  });

  // Suelo × luz
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  drawFloor();
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = blur ? `blur(${blur}px)` : 'none';
  ctx.drawImage(lc, 0, 0, W, H);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';

  if ($('showRays').checked) drawRays(rays);

  // Objetos
  for (const s of shapes) {
    ctx.beginPath();
    ctx.moveTo(s.pts[0].x, s.pts[0].y);
    for (let k = 1; k < s.pts.length; k++) ctx.lineTo(s.pts[k].x, s.pts[k].y);
    ctx.closePath();
    ctx.fillStyle = '#12151c'; ctx.fill();
    const on = sel && sel.ref === s;
    ctx.lineWidth = on ? 2.5 : 1.5;
    ctx.strokeStyle = on ? '#ffb347' : '#3a4152'; ctx.stroke();
  }

  // Cajas AABB (depuración)
  if ($('showAABB').checked) {
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c026d3';
    for (const s of shapes) { const b = aabbOf(s); ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
    ctx.strokeStyle = '#16a34a';
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    ctx.setLineDash([]);
  }

  // Jugador
  if (lit) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 18; }
  ctx.fillStyle = lit ? '#ff5a5a' : '#2fbf9a';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2; ctx.strokeStyle = '#0b0d12';
  ctx.strokeRect(player.x, player.y, player.w, player.h);

  // Fuentes de luz
  for (const L of lights) {
    const on = sel && sel.ref === L;
    ctx.beginPath(); ctx.arc(L.x, L.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = L.color; ctx.stroke();
    if (on) {
      ctx.beginPath(); ctx.arc(L.x, L.y, 14, 0, Math.PI * 2);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(20,20,20,.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    }
  }
  requestAnimationFrame(frame);
}

resetScene();
labels();
requestAnimationFrame(frame);
})();
