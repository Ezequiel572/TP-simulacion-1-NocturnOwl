/* ======================================================================
   7 · RENDER CON PIXIJS                                (js/render/pixijs.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Dibuja con PixiJS (WebGL), en una capa DEBAJO del canvas 2D (#c), de abajo arriba:
                suelo (baldosa) → capa de luz (multiplicada) → resplandor azul (sumado) → botones → paredes y cajas.
              El canvas 2D (transparente) queda ENCIMA con lo demás: rayos, puerta, jugador, marcadores de luz y editor.
   LUZ        La capa de luz se calcula en luz/luz.js (canvas `lc`); aquí solo se suaviza (desenfoque) y se sube a la GPU.
   IMÁGENES   Con servidor local se cargan de assets/. Con doble clic (file://) se usan las de render/imagenes.js.
              Si alguna falta, se usa un color liso y se avisa.
   ====================================================================== */

// px = todo lo de Pixi (aplicación, capas, texturas). `sprites` guarda un sprite por cada forma (se crean y borran solos).
const px = { app: null, piso: null, luz: null, texLuz: null, brillo: null, texBrillo: null, botones: null, cajas: null, contornos: null,
             sprites: new Map(), tex: { fondo: null, pared: null, cajas: [] } };
// Paredes y cajas se dibujan ENCIMA de la capa de luz, así que no las oscurece. Este valor las atenúa a mano:
// 1 = brillo máximo (como antes) · 0.5 = tenues pero visibles · 0.2 = casi negras. Cámbialo a tu gusto.
const BRILLO_FORMAS = 0.5;
const TINTE_FORMAS = (v => (v << 16) | (v << 8) | v)(Math.round(255 * BRILLO_FORMAS));
const lb = document.createElement('canvas'), lbx = lb.getContext('2d');   // capa de luz ya suavizada (se sube a Pixi)

// Crea la aplicación Pixi, carga las imágenes y arma las capas. main.js espera a que termine antes de arrancar el bucle.
async function iniciarPixi() {
  const { Application, Assets, Container, Graphics, Sprite, Texture, TilingSprite } = PIXI;
  const app = new Application();
  await app.init({ width: W, height: H, resolution: dpr, autoDensity: true, backgroundAlpha: 0,
                   antialias: true, autoStart: false, preference: 'webgl' });
  app.ticker.stop();                                   // el bucle lo manda main.js: se dibuja con app.render()
  const c = app.canvas;
  c.style.cssText += ';position:fixed;left:0;top:0;pointer-events:none;display:block';
  document.body.insertBefore(c, cv);                   // debajo del canvas #c

  // Imágenes: si alguna no carga, se usa un color liso en su lugar
  // Con doble clic (file://) se usan las imágenes incrustadas de imagenes.js; con servidor local, las de assets/
  const cargar = async ruta => {
    try {
      if (location.protocol === 'file:' && typeof IMAGENES_INCRUSTADAS !== 'undefined' && IMAGENES_INCRUSTADAS[ruta]) {
        const img = new Image(); img.src = IMAGENES_INCRUSTADAS[ruta]; await img.decode();
        return Texture.from(img, true);
      }
      return (await Assets.load(ASSETS + ruta)) || null;
    } catch { return null; }
  };
  const [fondo, pared, ...cajas] = await Promise.all([
    cargar('fondo/fondo.png'), cargar('paredes/pared.png'),
    ...Array.from({ length: NUM_CAJAS }, (_, i) => cargar(`cajas/caja_${i + 1}.png`))
  ]);
  px.tex = { fondo, pared, cajas };
  if (!fondo || !pared || cajas.some(t => !t)) {
    console.warn('PixiJS: no se pudieron cargar algunas imágenes de assets/. Abre el juego desde un servidor local.');
    aviso('Faltan imágenes de assets/ (abre el juego desde un servidor local)');
  }

  // Suelo: la imagen se repite como baldosa, sin deformarse
  if (fondo) fondo.source.style.addressMode = 'repeat';
  const piso = new TilingSprite({ texture: fondo || Texture.WHITE, width: W, height: H });
  if (fondo) piso.tileScale.set(TILE_FONDO / fondo.width); else piso.tint = 0xd9d4c7;

  // Capa de luz: se multiplica sobre el suelo
  lb.width = lc.width; lb.height = lc.height;
  const luz = new Sprite(Texture.from(lb, true));
  luz.blendMode = 'multiply';
  luz.width = W; luz.height = H;

  // Resplandor de la luz azul: se SUMA sobre el suelo ya iluminado
  const brillo = new Sprite(Texture.from(lg, true));
  brillo.blendMode = 'add';
  brillo.width = W; brillo.height = H; brillo.visible = false;

  px.app = app; px.piso = piso; px.luz = luz; px.texLuz = luz.texture; px.brillo = brillo; px.texBrillo = brillo.texture;
  px.botones = new Graphics(); px.cajas = new Container(); px.contornos = new Graphics();
  app.stage.addChild(piso, luz, brillo, px.botones, px.cajas, px.contornos);

  addEventListener('resize', () => {                   // estado.js ya actualizó W, H y dpr
    app.renderer.resolution = dpr;
    app.renderer.resize(W, H);
    piso.width = W; piso.height = H;
  });
}

// Capa de luz: suaviza `lc` en `lb` (desenfoque = sombras suaves) y la sube a la GPU.
// Si cambió el tamaño de la ventana, recrea las texturas. El resplandor azul solo se sube si hay luz azul activa.
function actualizarCapaLuz(blur) {
  if (lb.width !== lc.width || lb.height !== lc.height) {
    lb.width = lc.width; lb.height = lc.height;
    const vieja = px.texLuz;
    px.texLuz = PIXI.Texture.from(lb, true);
    px.luz.texture = px.texLuz;
    vieja.destroy(true);
    const vBrillo = px.texBrillo;
    px.texBrillo = PIXI.Texture.from(lg, true);
    px.brillo.texture = px.texBrillo;
    vBrillo.destroy(true);
  }
  lbx.setTransform(1, 0, 0, 1, 0, 0);
  lbx.clearRect(0, 0, lb.width, lb.height);
  lbx.filter = blur ? `blur(${blur * dpr}px)` : 'none';
  lbx.drawImage(lc, 0, 0);
  lbx.filter = 'none';
  px.texLuz.source.update();
  px.luz.width = W; px.luz.height = H;
  px.brillo.visible = hayBrilloAzul;                  // resplandor de la luz azul (luz/luz.js)
  if (hayBrilloAzul) { px.texBrillo.source.update(); px.brillo.width = W; px.brillo.height = H; }
}

// Una línea punteada (Pixi no trae trazos discontinuos): 3 px de raya y 5 de hueco
function lineaPunteada(g, x0, y0, x1, y1, color) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  if (d < 1) return;
  const ux = dx / d, uy = dy / d;
  for (let p = 0; p < d; p += 8) {
    const q = Math.min(p + 3, d);
    g.moveTo(x0 + ux * p, y0 + uy * p).lineTo(x0 + ux * q, y0 + uy * q);
  }
  g.stroke({ width: 1.5, color });
}

// Botones (van debajo de las cajas): base oscura + cuadro de color, más pequeño y oscuro si está pulsado. Con «Mostrar enlaces» dibuja la línea hasta su luz.
function pixiBotones() {
  const g = px.botones; g.clear();
  const enlaces = $('showLinks').checked;
  for (const b of botones) {
    const col = COLOR_BOTON[b.color] || '#888888', dim = COLOR_BOTON_OSC[b.color] || '#444444';
    if (enlaces) {
      const L = lights.find(l => l.id === b.link);
      if (L) lineaPunteada(g, b.x + b.w / 2, b.y + b.h / 2, L.x, L.y, col);
    }
    g.rect(b.x, b.y, b.w, b.h).fill('#1a1d26');                              // base
    const m = b.pressed ? 14 : 6;                                            // hundido = más pequeño y oscuro
    g.rect(b.x + m, b.y + m, b.w - 2 * m, b.h - 2 * m).fill(b.pressed ? dim : col);
    g.rect(b.x, b.y, b.w, b.h).stroke({ width: 2, color: col });
  }
}

// Paredes y cajas: un sprite por forma (se crean y se borran solos al editar). Las cajas móviles sortean una imagen (skin) la primera vez.
// BRILLO_FORMAS las oscurece un poco porque se dibujan encima de la luz y no les afecta.
function pixiFormas() {
  const g = px.contornos; g.clear();
  const usadas = new Set();
  for (const s of shapes) {
    const b = aabbOf(s), w = b.x1 - b.x0, h = b.y1 - b.y0, on = sel && sel.ref === s;
    if (s.movable && s.skin == null) s.skin = Math.floor(Math.random() * NUM_CAJAS);   // skin aleatoria, se sortea una vez
    let spr = px.sprites.get(s);
    if (!spr) { spr = new PIXI.Sprite(PIXI.Texture.WHITE); px.cajas.addChild(spr); px.sprites.set(s, spr); }
    const t = s.movable ? px.tex.cajas[s.skin] : px.tex.pared;
    const tex = t || PIXI.Texture.WHITE;
    if (spr.texture !== tex) spr.texture = tex;
    spr.tint = t ? TINTE_FORMAS : (s.movable ? 0x3a2a1a : 0x12151c);             // color liso si falta la imagen
    spr.position.set(b.x0, b.y0); spr.width = w; spr.height = h;             // la imagen se ajusta al tamaño de la forma
    usadas.add(s);
    if (on || !s.movable) g.rect(b.x0, b.y0, w, h).stroke({ width: on ? 2.5 : 1, color: on ? '#ffb347' : '#000000', alpha: on ? 1 : 0.45 });
  }
  for (const [s, spr] of px.sprites) if (!usadas.has(s)) { spr.destroy(); px.sprites.delete(s); }
}

// Se llama una vez por frame, después de renderLightLayer()
function pixiDibujar(blur) {
  actualizarCapaLuz(blur);
  pixiBotones();
  pixiFormas();
  px.app.render();
}
