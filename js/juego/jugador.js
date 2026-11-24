/* ======================================================================
   5 · JUGADOR                                          (js/juego/jugador.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Teclado, estado «tocado por la luz», panel HUD y dibujo del jugador.
   FLUJO      main.js → castRays() → aplicarEfectosLuz() (mecanicas.js) → actualizarEstadoLuz() (aquí)
   ====================================================================== */

// ---------- Teclado: solo guarda qué teclas están pulsadas en `keys`; el movimiento real está en colisiones.js ----------
const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', e => {
  if (!MOVE.has(e.code)) return;
  if (e.target instanceof HTMLInputElement && e.target.type === 'range') e.target.blur();
  keys[e.code] = true; e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// Pone a cero el contador de «veces tocado» y «tiempo en luz», y reinicia botones y luces (resetMecanicas).
function resetEstadisticas() { stat.lit = false; stat.count = 0; stat.time = 0; resetMecanicas(); }

// Decide si el jugador está «tocado»: algún rayo le da (hit) Y no está en zona segura.
// La luz azul nunca hace daño; además, mientras te toca, la roja y la amarilla no cuentan (efectos.seguro).
// Solo en partida: suma 1 a `count` al empezar a ser tocado y acumula `time` mientras dura.
function actualizarEstadoLuz(rays, dt) {
  const hits = rays.filter(r => r.hit);
  const lit = !efectos.seguro && hits.some(r => r.L.tipo !== 'azul');
  if (modo === 'jugar') { if (lit && !stat.lit) stat.count++; if (lit) stat.time += dt; }
  stat.lit = lit;
  updateHUD(hits);
  return lit;
}

// Actualiza el panel de arriba a la derecha (estado, luces que lo tocan, veces tocado, tiempo, efecto).
function updateHUD(hits) {
  $('hud').classList.toggle('lit', stat.lit);
  $('hState').textContent = stat.lit ? '¡Tocado por la luz!' : efectos.seguro ? 'En zona segura' : 'En sombra';
  $('hN').textContent = hits.length;
  $('hC').textContent = stat.count;
  $('hT').textContent = stat.time.toFixed(1);
  $('hE').textContent = efectos.retro > 0 ? 'Empujado (' + efectos.retro.toFixed(1) + ' s)'
                      : efectos.seguro ? 'Zona segura' : 'Ninguno';
}

// Dibuja al jugador: verde en sombra, rojo si lo toca una luz, azul en zona segura (con un resplandor del mismo color).
function dibujarJugador(lit) {
  if (lit) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 18; }
  else if (efectos.seguro) { ctx.shadowColor = '#3d8bff'; ctx.shadowBlur = 18; }
  ctx.fillStyle = lit ? '#ff5a5a' : efectos.seguro ? '#5f9bd6' : '#2fbf9a';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2; ctx.strokeStyle = '#0b0d12';
  ctx.strokeRect(player.x, player.y, player.w, player.h);
}
