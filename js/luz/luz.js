/* ======================================================================
   4 · SIMULACIÓN DE LUZ                                (js/luz/luz.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Calcula cómo se ve la luz (solo la IMAGEN; las reglas del juego están en mecanicas.js).
   CÓMO       1) visibility() calcula, para cada luz, el polígono de lo que alcanza a iluminar
                 (lanza rayos a las esquinas de todos los muros → así salen las sombras nítidas).
              2) renderLightLayer() rellena ese polígono con un degradado radial y lo pinta en la
                 capa `lc`: una imagen casi negra (luz ambiente) con las luces sumadas encima.
              3) pixijs.js MULTIPLICA esa capa sobre el suelo: negro = oscuro, claro = iluminado.
   ====================================================================== */

// '#3d8bff' → [61, 139, 255]
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

// Polígono de visibilidad de la luz L: lo que alcanza a iluminar teniendo en cuenta los muros `segs`.
// Lanza 3 rayos (un poco antes, justo en y un poco después) por cada esquina de muro y los ordena por ángulo.
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

/* ---- La luz azul (zona segura) tiene que destacar sobre la roja y la amarilla ----
   1) Se pinta DESPUÉS y encima (no se suma): dentro de la zona azul manda el azul y no se mezcla con amarillo hasta quedar blanco.
   2) Tiene un color más claro y vivo, y un núcleo más firme (se ve como una "zona").
   3) Además lleva un resplandor aditivo (canvas `lg`, lo dibuja Pixi encima del suelo) porque al multiplicar el azul se oscurece. */
const COLOR_AZUL_LUZ = [40, 85, 210];    // azul profundo, como luz nocturna (más claro = más brillante: [80,165,255])
const FUERZA_AZUL    = 0.7;              // opacidad de la luz azul: 1 = como antes, menos = más tenue
const BRILLO_AZUL    = 0.12;             // resplandor: 0 = sin resplandor, 0.4 = brillante
let hayBrilloAzul = false;               // lo lee render/pixijs.js

// Rellena el polígono `poly` de la luz L con un degradado radial del color `color` ([r,g,b]).
// stops = [[posición 0..1, opacidad], ...]: 0 = en la luz, 1 = en el borde de su alcance.
function rellenarLuz(c, L, poly, color, stops) {
  const [r, g, b] = color;
  const grad = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.radius);
  for (const [p, a] of stops) grad.addColorStop(p, `rgba(${r},${g},${b},${a})`);
  c.fillStyle = grad;
  c.beginPath();
  c.moveTo(poly[0].x, poly[0].y);
  for (let k = 1; k < poly.length; k++) c.lineTo(poly[k].x, poly[k].y);
  c.closePath(); c.fill();
}

// Pinta TODAS las luces en la capa `lc` (y el resplandor azul en `lg`). Se llama una vez por frame.
//   segs  = muros · t = tiempo (para el parpadeo) · amb = luz ambiente 0..1 · flick = ¿parpadeo de llama?
// Las luces apagadas (activa === false) o tapadas por una caja se saltan.
function renderLightLayer(segs, t, amb, flick) {
  lx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lx.globalCompositeOperation = 'source-over';
  const g = Math.round(amb * 255);
  lx.fillStyle = `rgb(${g},${g},${Math.min(255, g + 8)})`;
  lx.fillRect(0, 0, W, H);

  // 1) roja y amarilla: se suman entre sí
  const azules = [];
  lx.globalCompositeOperation = 'lighter';
  lights.forEach((L, i) => {
    if (L.activa === false || L.tapada) return;   // una luz apagada o tapada por una caja no ilumina
    const poly = visibility(L, segs);
    if (!poly.length) return;
    let I = L.intensity;
    if (flick) I *= 0.9 + 0.1 * Math.sin(t / 90 + i * 7) * Math.sin(t / 37 + i) + 0.04 * Math.sin(t / 23 + i * 3);
    I = Math.min(1, I);
    if (L.tipo === 'azul') { azules.push({ L, poly, I }); return; }
    rellenarLuz(lx, L, poly, rgb(L.color), [[0, I], [0.35, I * 0.5], [1, 0]]);
  });

  // 2) azul encima, sin sumarse a las demás, con el núcleo más firme
  lx.globalCompositeOperation = 'source-over';
  for (const { L, poly, I } of azules) rellenarLuz(lx, L, poly, COLOR_AZUL_LUZ, [[0, I * FUERZA_AZUL], [0.6, I * FUERZA_AZUL * 0.85], [1, 0]]);

  // 3) resplandor aditivo del azul
  gx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gx.globalCompositeOperation = 'source-over';
  gx.clearRect(0, 0, W, H);
  hayBrilloAzul = azules.length > 0 && BRILLO_AZUL > 0;
  if (hayBrilloAzul) {
    gx.globalCompositeOperation = 'lighter';
    for (const { L, poly, I } of azules) rellenarLuz(gx, L, poly, COLOR_AZUL_LUZ, [[0, BRILLO_AZUL * I], [0.6, BRILLO_AZUL * I * 0.7], [1, 0]]);
  }
}
