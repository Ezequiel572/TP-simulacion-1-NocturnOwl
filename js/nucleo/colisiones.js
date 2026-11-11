/* ======================================================================
   2 · COLISIONES (AABB)
   Cajas alineadas a los ejes: aabbOf, overlap, movePlayer (resuelve X e Y por separado),
   moverCaja (cajas empujables)
   e inPoly (punto dentro de polígono, usado por el editor para seleccionar).
   ====================================================================== */

// Punto dentro de un polígono
function inPoly(p, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

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

// Mueve una caja móvil en un solo eje. La frenan las paredes, las demás formas y los bordes.
function moverCaja(c, dx, dy) {
  const b = aabbOf(c), w = b.x1 - b.x0, h = b.y1 - b.y0;
  let x = Math.max(0, Math.min(W - w, b.x0 + dx));
  let y = Math.max(0, Math.min(H - h, b.y0 + dy));
  for (const s of shapes) {
    if (s === c) continue;
    const o = aabbOf(s);
    if (x < o.x1 && x + w > o.x0 && y < o.y1 && y + h > o.y0) {
      if (dx > 0) x = o.x0 - w; else if (dx < 0) x = o.x1;
      if (dy > 0) y = o.y0 - h; else if (dy < 0) y = o.y1;
    }
  }
  for (const p of c.pts) { p.x += x - b.x0; p.y += y - b.y0; }
}

// Mueve al jugador en un eje: las formas fijas lo frenan, las cajas móviles se empujan
function moverJugador(mx, my) {
  if (!mx && !my) return;
  player.x += mx; player.y += my;
  for (const s of shapes) {
    let b = aabbOf(s);
    if (!overlap(player, b)) continue;
    if (s.movable) {
      const pen = mx > 0 ? player.x + player.w - b.x0 : mx < 0 ? b.x1 - player.x
                : my > 0 ? player.y + player.h - b.y0 : b.y1 - player.y;   // cuánto se hundió en la caja
      moverCaja(s, mx > 0 ? pen : mx < 0 ? -pen : 0, my > 0 ? pen : my < 0 ? -pen : 0);
      b = aabbOf(s);
      if (!overlap(player, b)) continue;          // la caja cedió
    }
    if (mx > 0) player.x = b.x0 - player.w; else if (mx < 0) player.x = b.x1;   // la caja no cede: el jugador se frena
    if (my > 0) player.y = b.y0 - player.h; else if (my < 0) player.y = b.y1;
  }
}

function movePlayer(dt) {
  let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }

  // NUEVO · velocidad según los efectos de las luces (ver juego/mecanicas.js)
  let vel = player.speed * (efectos.lento ? FACTOR_LENTO : 1);      // luz azul: más lento
  if (efectos.retro > 0) {                                           // luz roja/amarilla: pierde el control
    dx = efectos.dx; dy = efectos.dy;                                // se mueve solo, alejándose de la luz
    vel = VEL_RETRO * (efectos.retro / TIEMPO_RETRO);                // y va frenando poco a poco
  }

  moverJugador(dx * vel * dt, 0);      // eje X y eje Y por separado
  moverJugador(0, dy * vel * dt);
  clampPlayer();

  // Si un objeto cae sobre el jugador, lo expulsa por el lado más corto
  for (const s of shapes) {
    const b = aabbOf(s);
    if (!overlap(player, b)) continue;
    const l = player.x + player.w - b.x0, r = b.x1 - player.x;
    const t = player.y + player.h - b.y0, u = b.y1 - player.y;
    const m = Math.min(l, r, t, u);
    if (m === l) player.x -= l; else if (m === r) player.x += r;
    else if (m === t) player.y -= t; else player.y += u;
  }
  clampPlayer();
}
