/* ======================================================================
   8 · BUCLE PRINCIPAL                                  (js/main.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Orquesta el juego: llama a los demás archivos en orden, 60 veces por segundo (requestAnimationFrame).
              Aquí casi no hay lógica propia; está en los otros archivos.

   CADA FRAME (función frame):
     1. segments()                 muros                                        luz/raycast.js
     2. movePlayer()               mueve al jugador                             nucleo/colisiones.js
     3. comprobarPuerta()          ¿llegó a la salida?                          juego/niveles.js
     4. moverLuces()               luces con ruta A→B                           juego/mecanicas.js
     5. actualizarBotones()        botones → luces encendidas/apagadas          juego/mecanicas.js
     6. castRays()                 ¿qué luces tocan al jugador?                 luz/raycast.js
     7. aplicarEfectosLuz()        zona segura / empujón                        juego/mecanicas.js
        actualizarEstadoLuz()      «tocado», contadores y HUD                   juego/jugador.js
     8. renderLightLayer()         pinta la capa de luz                         luz/luz.js
     9. pixiDibujar()              suelo + luz + botones + paredes y cajas      render/pixijs.js
    10. canvas 2D (encima)         rayos, puerta, jugador, luces, editor        aquí + niveles/jugador/editor
   En pausa se saltan los pasos 2-5 y 7 (se sigue dibujando pero nada se mueve). Con el menú abierto no se hace nada.
   ====================================================================== */

/* ---------- Sprites ---------- */
// ---------- Imágenes ----------
// Las luces no usan imágenes (son círculos de color). El suelo, las paredes y las cajas las carga render/pixijs.js.
const ASSETS = 'assets/';        // carpeta de imágenes
const NUM_CAJAS = 5;             // cajas/caja_1.png ... caja_5.png

const TILE_FONDO = 256;         // tamaño (px) con que se repite el fondo; sube/baja el número para ladrillos más grandes/pequeños
// Las luces ya no usan imágenes: se dibujan como un círculo del color de su tipo (ver drawLightMarkers)
// SIZE_LUZ = tamaño del marcador de cada luz. El editor lo usa también para colocar etiquetas y anillos.
const SIZE_LUZ = 36;             // tamaño (px) del marcador de cada luz (el editor lo usa para colocar sus etiquetas)

// Paredes y cajas, suelo, luz y botones los dibuja PixiJS (render/pixijs.js)

// Cajas AABB de depuración (casilla «Mostrar cajas AABB» de Ajustes): contorno de las formas y del jugador.
function drawAABB() {
  if ($('showAABB').checked) {
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c026d3';
    for (const s of shapes) { const b = aabbOf(s); ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
    ctx.strokeStyle = '#16a34a';
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    ctx.setLineDash([]);
  }
}

// Dibuja el marcador de cada luz (círculo de su color; gris si está apagada o tapada). La luz azul apagada
// se oculta en partida (aún «no existe») pero se ve en el editor para poder editarla. Si está seleccionada, lleva un aro naranja.
function drawLightMarkers() {
  for (const L of lights) {
    if (L.tipo === 'azul' && L.activa === false && modo !== 'editar') continue;   // en partida, la azul no se ve hasta pisar su botón; en el editor sí (apagada) para poder editarla
    const on = sel && sel.ref === L;
    const apagada = L.activa === false || L.tapada;            // apagada o tapada por una caja: se ve gris
    const r = SIZE_LUZ / 2 - 6;
    ctx.beginPath(); ctx.arc(L.x, L.y, r, 0, Math.PI * 2);
    ctx.fillStyle = apagada ? '#555a66' : L.color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = apagada ? (L.tipo === 'azul' ? L.color : '#2b2f3a') : '#fff'; ctx.stroke();   // azul apagada: gris con borde azul
    if (on) {
      ctx.beginPath(); ctx.arc(L.x, L.y, SIZE_LUZ / 2 - 2, 0, Math.PI * 2);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,179,71,.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    }
  }
}

/* ---------- Muestreo de rendimiento (F3) ----------
   Mide cuánto tarda cada etapa del frame y lo promedia cada 0,5 s.
   Son tiempos de CPU (lo que tarda JS en pedir el dibujo); el trabajo de la GPU, como el desenfoque, no se ve aquí por separado. */
const perf = { on: false, prev: 0, desde: 0, frames: 0, peor: 0, suma: 0, etapas: { logica: 0, luz: 0, compuesto: 0, dibujo: 0 } };
function perfMuestrear(t, ms, segs, rays) {
  if (!perf.on) return;
  if (perf.prev) { const d = t - perf.prev; perf.suma += d; perf.peor = Math.max(perf.peor, d); perf.frames++; }
  perf.prev = t;
  for (const k in ms) perf.etapas[k] += ms[k];
  if (!perf.desde) perf.desde = t;
  if (t - perf.desde < 500 || !perf.frames) return;
  const n = perf.frames, e = perf.etapas, f = v => (v / n).toFixed(2).padStart(6);
  $('perf').textContent =
    'FPS            ' + (1000 * n / perf.suma).toFixed(0).padStart(6) + '\n' +
    'Frame (media)  ' + f(perf.suma) + ' ms\n' +
    'Frame (peor)   ' + perf.peor.toFixed(2).padStart(6) + ' ms\n' +
    '— CPU por etapa —\n' +
    'Lógica+rayos   ' + f(e.logica) + ' ms\n' +
    'Capa de luz    ' + f(e.luz) + ' ms\n' +
    'Compuesto/blur ' + f(e.compuesto) + ' ms\n' +
    'Dibujo         ' + f(e.dibujo) + ' ms\n' +
    '— Escena —\n' +
    'Luces activas  ' + String(lights.filter(L => L.activa !== false).length).padStart(6) + '\n' +
    'Segmentos      ' + String(segs.length).padStart(6) + '\n' +
    'Rayos          ' + String(rays.length).padStart(6) + '\n' +
    'Lienzo         ' + (W * dpr | 0) + '×' + (H * dpr | 0);
  perf.desde = t; perf.frames = 0; perf.suma = 0; perf.peor = 0;
  for (const k in e) e[k] = 0;
}
addEventListener('keydown', e => {
  if (e.code !== 'F3') return;
  e.preventDefault();
  perf.on = !perf.on; perf.prev = perf.desde = perf.frames = 0; perf.suma = perf.peor = 0;
  for (const k in perf.etapas) perf.etapas[k] = 0;
  $('perf').hidden = !perf.on;
  if (perf.on) $('perf').textContent = 'Midiendo…';
});

// Un frame completo (ver la lista de pasos arriba). `t` = tiempo en ms que da requestAnimationFrame; dt = segundos desde el frame anterior (máx. 0,05).
function frame(t) {
  if (enMenu) { lastT = t; perf.prev = 0; requestAnimationFrame(frame); return; }   // Menú de Inicio abierto: no se dibuja el juego de fondo
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  const base = +$('ambient').value;
  const amb = modo === 'editar' ? Math.max(base, 0.5) : base;   // en el editor se ve mejor con más luz
  const congelado = pausado;                                     // en pausa se sigue dibujando, pero nada se mueve ni cuenta tiempo

  const p0 = performance.now();
  const segs = segments();                                       // luz/raycast.js
  if (!congelado) {
    if (modo === 'jugar' && !fin) movePlayer(dt);                // nucleo/colisiones.js
    comprobarPuerta();                                           // juego/niveles.js (¿llegó a la salida?)
    moverLuces(dt);                                              // juego/mecanicas.js (luces con ruta A → B)
    actualizarBotones();                                         // juego/mecanicas.js (enciende/apaga luces)
  }
  const rays = castRays(segs);                                   // luz/raycast.js
  let lit = stat.lit;
  if (!congelado) {
    aplicarEfectosLuz(rays, dt);                                 // juego/mecanicas.js (zona segura / empujar)
    lit = actualizarEstadoLuz(rays, dt);                         // juego/jugador.js
  }

  const p1 = performance.now();
  renderLightLayer(segs, t, amb, $('flicker').checked);          // luz/luz.js
  const p2 = performance.now();
  pixiDibujar(+$('blur').value);                                 // render/pixijs.js (suelo + luz + botones + cajas)
  const p3 = performance.now();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);   // el canvas 2D es una capa transparente encima de Pixi

  if ($('showRays').checked) drawRays(rays);
  drawAABB();
  dibujarPuerta();                                               // juego/niveles.js
  dibujarJugador(lit);
  drawLightMarkers();
  if (modo === 'editar') dibujarEditor();                        // editor/editor.js
  hudNivel();                                                    // juego/niveles.js
  perfMuestrear(t, { logica: p1 - p0, luz: p2 - p1, compuesto: p3 - p2, dibujo: performance.now() - p3 }, segs, rays);
  requestAnimationFrame(frame);
}

// ---------- Arranque ----------
// Carga el nivel 1 de fondo, muestra el Menú de Inicio y, cuando Pixi está listo, arranca el bucle.
cargarNivel(0);                                                  // juego/niveles.js (queda cargado de fondo)
setModo('jugar');
labels();
mostrarMenu();                                                   // ui/menus.js · se arranca en el Menú de Inicio
iniciarPixi().then(() => requestAnimationFrame(frame)).catch(e => {   // render/pixijs.js
  console.error(e);
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;background:#7a1b1b;color:#fff;padding:10px 14px;font:13px monospace;white-space:pre-wrap';
  b.textContent = 'No se pudo iniciar PixiJS: ' + (e && e.message || e) + '\nRevisa tu conexión (se carga desde un CDN) y abre el juego desde un servidor local.';
  document.body.appendChild(b);
});
