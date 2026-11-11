/* ======================================================================
   4 · SIMULACIÓN DE LUZ
   Polígono de visibilidad (sombras), capa de luz con degradados y mezcla con el suelo.
   ====================================================================== */

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

// Polígono de visibilidad: lo que la luz alcanza a iluminar
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

// Fondo: la imagen de assets/fondo se repite como baldosa (sin deformarse).
// Si la imagen no carga, se usa el suelo liso con cuadrícula de antes.
let patFondo = null;
function drawFloor() {
  if (lista(imgFondo)) {
    if (!patFondo) patFondo = ctx.createPattern(imgFondo, 'repeat');
    const k = TILE_FONDO / imgFondo.naturalWidth;
    patFondo.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
    ctx.fillStyle = patFondo; ctx.fillRect(0, 0, W, H);
    return;
  }
  ctx.fillStyle = '#d9d4c7'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(60,55,45,.18)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 48) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
  for (let y = 0; y <= H; y += 48) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  ctx.stroke();
}

// Dibuja todas las luces en la capa `lc` (suma de colores)
function renderLightLayer(segs, t, amb, flick) {
    lx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lx.globalCompositeOperation = 'source-over';
    const g = Math.round(amb * 255);
    lx.fillStyle = `rgb(${g},${g},${Math.min(255, g + 8)})`;
    lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = 'lighter';

    lights.forEach((L, i) => {
      if (L.activa === false) return;          // NUEVO · una luz apagada no ilumina
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
}

// Multiplica el suelo por la capa de luz
function compositeScene(blur) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    drawFloor();
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = blur ? `blur(${blur}px)` : 'none';
    ctx.drawImage(lc, 0, 0, W, H);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
}
