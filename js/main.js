/* ======================================================================
   8 · BUCLE PRINCIPAL
   Cada frame: colisiones → botones → raycast → efectos → luz → dibujo.
   Aquí solo se orquesta; la lógica está en los demás archivos.
   ====================================================================== */

/* ---------- Sprites ---------- */
const ASSETS = 'assets/';        // carpeta de imágenes
const NUM_CAJAS = 5;             // cajas/caja_1.png ... caja_5.png

const cargarImg = nombre => { const i = new Image(); i.src = ASSETS + nombre; return i; };
const imgPared = cargarImg('paredes/pared.png');
const imgFondo = cargarImg('fondo/fondo.png');
const TILE_FONDO = 256;         // tamaño (px) con que se repite el fondo; sube/baja el número para ladrillos más grandes/pequeños
const imgCajas = Array.from({ length: NUM_CAJAS }, (_, i) => cargarImg(`cajas/caja_${i + 1}.png`));
const lista = img => !!img && img.complete && img.naturalWidth > 0;
// Sprites de las luces: azul, roja y amarilla; la roja y la amarilla comparten la imagen de apagada
const imgLuces = { azul: cargarImg('luces/luz_azul.png'), roja: cargarImg('luces/luz_roja.png'),
                   amarilla: cargarImg('luces/luz_amarilla.png'), apagada: cargarImg('luces/apagada.png') };
const SIZE_LUZ = 72;             // tamaño (px) con que se dibuja el sprite de cada luz

function drawShapes() {
  for (const s of shapes) {
    const b = aabbOf(s), w = b.x1 - b.x0, h = b.y1 - b.y0;
    const on = sel && sel.ref === s;

    if (s.movable) {
      // Skin aleatoria: se sortea una vez (al colocarla, al marcarla como móvil o al cargar un nivel viejo)
      if (s.skin == null) s.skin = Math.floor(Math.random() * NUM_CAJAS);
      const img = imgCajas[s.skin];
      if (lista(img)) ctx.drawImage(img, b.x0, b.y0, w, h);
      else { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(b.x0, b.y0, w, h); }
    } else {
      if (lista(imgPared)) ctx.drawImage(imgPared, b.x0, b.y0, w, h);   // la imagen se ajusta al tamaño de la pared
      else { ctx.fillStyle = '#12151c'; ctx.fillRect(b.x0, b.y0, w, h); }   // respaldo si falta la imagen
    }

    if (on || !s.movable) {
      ctx.lineWidth = on ? 2.5 : 1;
      ctx.strokeStyle = on ? '#ffb347' : 'rgba(0,0,0,.45)';
      ctx.strokeRect(b.x0, b.y0, w, h);
    }
  }
}

// Cajas AABB de depuración (checkbox del panel)
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

function drawLightMarkers() {
    for (const L of lights) {
      const on = sel && sel.ref === L;
      const img = L.activa === false ? imgLuces.apagada : imgLuces[L.tipo];   // apagada: la comparten roja y amarilla
      if (lista(img)) ctx.drawImage(img, L.x - SIZE_LUZ / 2, L.y - SIZE_LUZ / 2, SIZE_LUZ, SIZE_LUZ);
      else {                                                                  // respaldo si falta la imagen
        ctx.beginPath(); ctx.arc(L.x, L.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = L.activa === false ? '#555' : '#fff'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = L.color; ctx.stroke();
      }
      if (on) {
        ctx.beginPath(); ctx.arc(L.x, L.y, SIZE_LUZ / 2 - 2, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,179,71,.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      }
    }
}

function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  const base = +$('ambient').value;
  const amb = modo === 'editar' ? Math.max(base, 0.5) : base;   // en el editor se ve mejor con más luz

  const segs = segments();                                       // luz/raycast.js
  if (modo === 'jugar' && !fin) movePlayer(dt);                  // nucleo/colisiones.js
  comprobarPuerta();                                             // juego/niveles.js (¿llegó a la salida?)
  actualizarBotones();                                           // juego/mecanicas.js (enciende/apaga luces)
  const rays = castRays(segs);                                   // luz/raycast.js
  aplicarEfectosLuz(rays, dt);                                   // juego/mecanicas.js (ralentizar / empujar)
  const lit = actualizarEstadoLuz(rays, dt);                     // juego/jugador.js

  renderLightLayer(segs, t, amb, $('flicker').checked);          // luz/luz.js
  compositeScene(+$('blur').value);                              // luz/luz.js

  if ($('showRays').checked) drawRays(rays);
  dibujarBotones();                                              // juego/mecanicas.js
  drawShapes();
  drawAABB();
  dibujarPuerta();                                               // juego/niveles.js
  dibujarJugador(lit);
  drawLightMarkers();
  if (modo === 'editar') dibujarEditor();                        // editor/editor.js
  hudNivel();                                                    // juego/niveles.js
  requestAnimationFrame(frame);
}

cargarNivel(0);                                                  // juego/niveles.js
setModo('jugar');
labels();
requestAnimationFrame(frame);
