/* ======================================================================
   5b · MECÁNICAS NUEVAS: BOTONES Y TIPOS DE LUZ
   Botones:  azul = presión única (lo pisa el jugador) · roja = hay que mantenerlo con una caja.
   Luces:    azul = ralentiza · roja = te empuja una casilla hacia atrás (la apaga el botón rojo de esa luz)
             amarilla = igual que la roja (la apaga el botón azul de esa luz)
   Cada botón apunta a UNA luz con `link` (= el `id` de la luz).
   ====================================================================== */

// ---- Valores que puedes cambiar para ajustar la sensación ----
const FACTOR_LENTO  = 0.4;   // luz azul: el jugador va al 40 % de su velocidad
const DIST_RETRO    = 24;    // cuánto te empuja la luz roja/amarilla (px). 24 = una casilla de la cuadrícula
const TIEMPO_RETRO  = 0.15;  // segundos que dura el empujón (muy breve: casi no pierdes el control)
const VEL_RETRO     = 2 * DIST_RETRO / TIEMPO_RETRO;   // velocidad inicial; baja a 0 y recorre justo DIST_RETRO
const TIEMPO_GRACIA = 0.08;  // respiro tras el empujón (poco, para que la luz siga haciendo de barrera)

let ultimoAviso = 0;
const rectBoton = b => ({ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h });

// Deja todo como al empezar: botones sueltos, luces encendidas, sin efectos
function resetMecanicas() {
  efectos.lento = false; efectos.retro = 0; efectos.gracia = 0;
  for (const b of botones) b.pressed = false;
  for (const L of lights) L.activa = true;
}

// 1) Estado de los botones y, según eso, qué luces están encendidas
function actualizarBotones() {
  if (modo !== 'jugar') { resetMecanicas(); return; }

  for (const b of botones) {
    const r = rectBoton(b);
    if (b.color === 'azul') {
      // presión única: si el jugador lo toca, se queda hundido para siempre
      if (!b.pressed && overlap(player, r)) b.pressed = true;
    } else {
      // rojo: solo está pulsado mientras el CENTRO de una caja móvil esté sobre él
      b.pressed = shapes.some(s => {
        if (!s.movable) return false;
        const c = aabbOf(s), cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
        return cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1;
      });
    }
  }

  for (const L of lights) {
    if (L.tipo === 'roja')
      L.activa = !botones.some(b => b.color === 'roja' && b.link === L.id && b.pressed);
    else if (L.tipo === 'amarilla')
      L.activa = !botones.some(b => b.color === 'azul' && b.link === L.id && b.pressed);
  }
}

// 2) Qué le hace cada luz al jugador (usa los rayos de luz/raycast.js)
function aplicarEfectosLuz(rays, dt) {
  efectos.lento = false;
  if (modo !== 'jugar') return;

  if (efectos.retro > 0) {                       // ya lo están empujando: solo cuenta el tiempo
    efectos.retro = Math.max(0, efectos.retro - dt);
    if (efectos.retro === 0) efectos.gracia = TIEMPO_GRACIA;
    return;
  }
  if (efectos.gracia > 0) efectos.gracia -= dt;

  for (const R of rays) {
    if (!R.hit) continue;
    const tipo = R.L.tipo;
    if (tipo === 'azul') efectos.lento = true;
    else if ((tipo === 'roja' || tipo === 'amarilla') && efectos.gracia <= 0) {
      let dx = player.x + player.w / 2 - R.L.x, dy = player.y + player.h / 2 - R.L.y;
      let d = Math.hypot(dx, dy);
      if (d < 1e-6) { dx = -1; dy = 0; d = 1; }
      efectos.dx = dx / d; efectos.dy = dy / d;   // dirección: alejándose de la luz
      efectos.retro = TIEMPO_RETRO;
      if (performance.now() - ultimoAviso > 2500) {           // el aviso sale como mucho cada 2,5 s
        ultimoAviso = performance.now();
        aviso(tipo === 'roja' ? 'Luz roja: te empuja. Busca el botón rojo y una caja'
                              : 'Luz amarilla: te empuja. Busca el botón azul');
      }
      break;
    }
  }
}

// 3) Dibujo de los botones (se dibujan debajo de las cajas)
function dibujarBotones() {
  const enlaces = $('showLinks').checked;
  for (const b of botones) {
    const col = b.color === 'azul' ? '#2f7bff' : '#e5262a';
    const dim = b.color === 'azul' ? '#16367a' : '#6e1214';
    if (enlaces) {                                  // línea punteada botón → luz
      const L = lights.find(l => l.id === b.link);
      if (L) {
        ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, b.y + b.h / 2); ctx.lineTo(L.x, L.y);
        ctx.setLineDash([3, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.fillStyle = '#1a1d26'; ctx.fillRect(b.x, b.y, b.w, b.h);          // base
    const m = b.pressed ? 14 : 6;                                          // hundido = más pequeño y oscuro
    ctx.fillStyle = b.pressed ? dim : col;
    ctx.fillRect(b.x + m, b.y + m, b.w - 2 * m, b.h - 2 * m);
    ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
}
