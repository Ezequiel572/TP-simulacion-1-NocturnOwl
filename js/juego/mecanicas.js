/* ======================================================================
   5b · MECÁNICAS: BOTONES Y TIPOS DE LUZ               (js/juego/mecanicas.js)
   ----------------------------------------------------------------------
   Las REGLAS del juego. Cada botón apunta a UNA luz con `link` = el número `id` de esa luz.

   BOTONES (el color del botón = el color de la luz que controla)
     · Activador (azul)      → pulsación única: al pisarlo APARECE la luz azul.
     · Sostenido (rojo)      → hay que mantenerlo con una caja encima: mientras tanto la luz roja se APAGA.
     · De apagar (amarillo)  → pulsación única: al pisarlo la luz amarilla se APAGA para siempre.

   LUCES
     · azul     = ZONA SEGURA: dentro de ella la roja y la amarilla no te hacen nada.
                  Siempre empieza apagada; solo la enciende su botón activador.
     · roja     = te empuja una casilla hacia atrás (la apaga su botón sostenido)
     · amarilla = igual que la roja (la apaga su botón de apagar). Puede moverse de A a B (ruta).
     · Cualquier luz queda TAPADA mientras una caja móvil cubre su centro.

   ORDEN EN CADA FRAME (main.js):  moverLuces → actualizarBotones → [castRays] → aplicarEfectosLuz
   ====================================================================== */

// ---- Valores que puedes cambiar para ajustar la sensación ----
// ---------- Valores que puedes cambiar para ajustar la sensación ----------
const DIST_RETRO    = 24;    // cuánto te empuja la luz roja/amarilla (px). 24 = una casilla de la cuadrícula
const TIEMPO_RETRO  = 0.15;  // segundos que dura el empujón (muy breve: casi no pierdes el control)
const VEL_RETRO     = 2 * DIST_RETRO / TIEMPO_RETRO;   // velocidad inicial; baja a 0 y recorre justo DIST_RETRO
const TIEMPO_GRACIA = 0.08;  // respiro tras el empujón (poco, para que la luz siga haciendo de barrera)

// Nombres y colores de los botones (el color es el de la luz que controlan)
// ---------- Nombres y colores de los botones (el color es el de la luz que controlan) ----------
const NOMBRE_BOTON     = { azul: 'Botón activador', roja: 'Botón sostenido', amarilla: 'Botón de apagar' };
const NOMBRE_CORTO     = { azul: 'Activador', roja: 'Sostenido', amarilla: 'Apagar' };
const COLOR_BOTON      = { azul: '#2f7bff', roja: '#e5262a', amarilla: '#ffd028' };
const COLOR_BOTON_OSC  = { azul: '#16367a', roja: '#6e1214', amarilla: '#7a6414' };
const PLURAL_LUZ       = { azul: 'azules', roja: 'rojas', amarilla: 'amarillas' };

// ultimoAviso = momento del último aviso de luz (para no repetirlo más de 1 vez cada 2,5 s) · rectBoton = botón → caja {x0,y0,x1,y1}
let ultimoAviso = 0;
const rectBoton = b => ({ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h });

// Deja todo como al empezar: botones sueltos, luces encendidas (menos la azul, que empieza apagada), sin efectos.
// En el editor se llama cada frame para que lo que ves sea siempre el estado inicial.
function resetMecanicas() {
  efectos.seguro = false; efectos.retro = 0; efectos.gracia = 0;
  for (const b of botones) b.pressed = false;
  for (const L of lights) { L.activa = L.tipo !== 'azul'; L.tapada = false; }   // la azul SIEMPRE empieza apagada: solo la enciende su botón activador
}

// 0) Luz amarilla con ruta: va de A (donde la pusiste) a B a velocidad constante (px/s).
//    `L.home` = punto A, `L.ruta` = { x, y (punto B), vel, vaiven }, `L.avance` = px recorridos desde A, `L.sentido` = 1 ida / -1 vuelta.
//    vaiven = true: al llegar rebota y vuelve a A, y así siempre · false: se queda en B.
function moverLuces(dt) {
  if (modo !== 'jugar' || fin) return;
  for (const L of lights) {
    const r = L.ruta;
    if (!r || L.tipo !== 'amarilla' || !L.home) continue;
    const dx = r.x - L.home.x, dy = r.y - L.home.y, largo = Math.hypot(dx, dy);
    if (largo < 1) continue;
    let a = (L.avance || 0) + (L.sentido || 1) * r.vel * dt;
    if (a >= largo) { a = r.vaiven ? 2 * largo - a : largo; if (r.vaiven) L.sentido = -1; }
    else if (a <= 0) { a = -a; L.sentido = 1; }
    L.avance = Math.max(0, Math.min(largo, a));
    L.x = L.home.x + dx / largo * L.avance;
    L.y = L.home.y + dy / largo * L.avance;
  }
}

// 1) Estado de los botones y, según eso, qué luces están encendidas.
//    a) botón sostenido: pulsado mientras el centro de una caja móvil esté encima.
//    b) botón activador / de apagar: se hunde para siempre al tocarlo el jugador.
//    c) luz tapada: una caja móvil cubre su centro.
//    d) luz activa: azul = su botón está pulsado · roja/amarilla = su botón NO está pulsado.
function actualizarBotones() {
  if (modo !== 'jugar') { resetMecanicas(); return; }

  for (const b of botones) {
    const r = rectBoton(b);
    if (b.color === 'roja') {
      // sostenido: solo está pulsado mientras el CENTRO de una caja móvil esté sobre él
      b.pressed = shapes.some(s => {
        if (!s.movable) return false;
        const c = aabbOf(s), cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
        return cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1;
      });
    } else {
      // activador y de apagar: presión única, si el jugador lo toca se queda hundido para siempre
      if (!b.pressed && overlap(player, r)) b.pressed = true;
    }
  }

  // Caja sobre la luz: mientras una caja móvil cubra el punto de la luz, esa luz queda tapada
  // (no lanza raycast ni ilumina); al apartar la caja vuelve sola.
  for (const L of lights) {
    L.tapada = shapes.some(s => {
      if (!s.movable) return false;
      const c = aabbOf(s);
      return L.x >= c.x0 && L.x <= c.x1 && L.y >= c.y0 && L.y <= c.y1;
    });
  }

  for (const L of lights) {
    const antes = L.activa;
    const suyos = botones.filter(b => b.color === L.tipo && b.link === L.id);   // botones de SU tipo enlazados a esta luz
    if (L.tipo === 'azul') {
      // la azul solo aparece cuando se pisa su botón activador (sin botón enlazado, queda apagada)
      L.activa = suyos.some(b => b.pressed);
      if (L.activa && antes === false) aviso('¡Apareció una luz azul! Dentro de ella estás a salvo de las otras luces');
    } else {
      L.activa = !suyos.some(b => b.pressed);
    }
  }
}

// 2) Qué le hace cada luz al jugador (usa los rayos de luz/raycast.js).
//    Si lo toca una azul → zona segura (no pasa nada más). Si no, la primera roja/amarilla que lo toque lo empuja:
//    guarda la dirección (alejándose de la luz) y arranca el empujón; colisiones.js lo ejecuta. Tras el empujón hay un breve respiro.
function aplicarEfectosLuz(rays, dt) {
  efectos.seguro = false;
  if (modo !== 'jugar') return;

  // Zona segura: si te toca una luz azul activa, las luces roja y amarilla quedan anuladas
  efectos.seguro = rays.some(R => R.hit && R.L.tipo === 'azul');

  if (efectos.retro > 0) {                       // ya lo están empujando: solo cuenta el tiempo
    efectos.retro = Math.max(0, efectos.retro - dt);
    if (efectos.retro === 0) efectos.gracia = TIEMPO_GRACIA;
    return;
  }
  if (efectos.gracia > 0) efectos.gracia -= dt;
  if (efectos.seguro) return;                    // a salvo: la roja y la amarilla no hacen efecto

  for (const R of rays) {
    if (!R.hit) continue;
    const tipo = R.L.tipo;
    if ((tipo === 'roja' || tipo === 'amarilla') && efectos.gracia <= 0) {
      let dx = player.x + player.w / 2 - R.L.x, dy = player.y + player.h / 2 - R.L.y;
      let d = Math.hypot(dx, dy);
      if (d < 1e-6) { dx = -1; dy = 0; d = 1; }
      efectos.dx = dx / d; efectos.dy = dy / d;   // dirección: alejándose de la luz
      efectos.retro = TIEMPO_RETRO;
      if (performance.now() - ultimoAviso > 2500) {           // el aviso sale como mucho cada 2,5 s
        ultimoAviso = performance.now();
        aviso(tipo === 'roja' ? 'Luz roja: te empuja. Busca el botón sostenido y una caja, o una zona azul'
                              : 'Luz amarilla: te empuja. Busca el botón de apagar, o una zona azul');
      }
      break;
    }
  }
}
