/* ======================================================================
   3 · RAYCAST
   Geometría de rayos: segments (muros), rayHit (rayo-segmento), rayAABB (rayo-caja),
   castRays (un rayo por luz que apunta al jugador) y drawRays (visualización).
   ====================================================================== */

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
// NUEVO · las luces apagadas (activa === false) no lanzan rayo.
function castRays(segs) {
  const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
  return lights.filter(L => L.activa !== false).map(L => {
    let dx = cx - L.x, dy = cy - L.y;
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let wall = Infinity;
    for (const s of segs) { const t = rayHit(L.x, L.y, dx, dy, s); if (t !== null && t < wall) wall = t; }
    const len = Math.min(wall, L.radius);
    const tp = rayAABB(L.x, L.y, dx, dy, player);
    return { L, dx, dy, len, hit: tp !== null && tp <= len };
  });
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
