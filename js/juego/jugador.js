/* ======================================================================
   5 · JUGADOR
   Teclado, estado "tocado por la luz", HUD y dibujo del jugador.
   ====================================================================== */

const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', e => {
  if (!MOVE.has(e.code)) return;
  if (e.target instanceof HTMLInputElement && e.target.type === 'range') e.target.blur();
  keys[e.code] = true; e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function resetEstadisticas() { stat.lit = false; stat.count = 0; stat.time = 0; resetMecanicas(); }

// Usa los rayos de luz/raycast.js para saber si alguna luz toca al jugador
// NUEVO · la luz azul toca pero no "daña": no cuenta como "tocado"
function actualizarEstadoLuz(rays, dt) {
  const hits = rays.filter(r => r.hit), lit = hits.some(r => r.L.tipo !== 'azul');
  if (modo === 'jugar') { if (lit && !stat.lit) stat.count++; if (lit) stat.time += dt; }
  stat.lit = lit;
  updateHUD(hits);
  return lit;
}

function updateHUD(hits) {
  $('hud').classList.toggle('lit', stat.lit);
  $('hState').textContent = stat.lit ? '¡Tocado por la luz!' : 'En sombra';
  $('hN').textContent = hits.length;
  $('hC').textContent = stat.count;
  $('hT').textContent = stat.time.toFixed(1);
  $('hE').textContent = efectos.retro > 0 ? 'Empujado (' + efectos.retro.toFixed(1) + ' s)'
                      : efectos.lento ? 'Ralentizado' : 'Ninguno';
}

function dibujarJugador(lit) {
    if (lit) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 18; }
    else if (efectos.lento) { ctx.shadowColor = '#3d8bff'; ctx.shadowBlur = 18; }
    ctx.fillStyle = lit ? '#ff5a5a' : efectos.lento ? '#5f9bd6' : '#2fbf9a';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = '#0b0d12';
    ctx.strokeRect(player.x, player.y, player.w, player.h);
}
