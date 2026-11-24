/* ======================================================================
   1 · ESTADO COMPARTIDO                                (js/nucleo/estado.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Crea los canvas, mide la ventana y declara las variables globales
              que comparten todos los demás archivos. No contiene lógica de juego.
   QUIÉN LO USA   Todos. Se carga PRIMERO (ver el orden de <script> en index.html).
   CONCEPTO   Todos los archivos son scripts clásicos (no módulos): lo que se declara
              aquí con const/let queda disponible para los archivos que se cargan después.
   ====================================================================== */

// ---------- Canvas ----------
//   cv = canvas visible (2D, transparente, ENCIMA de Pixi): jugador, puerta, editor, marcadores de luz.
//   lc = capa de luz (fuera de pantalla): luz.js la pinta y pixijs.js la sube a la GPU.
//   lg = resplandor de la luz azul (fuera de pantalla, se suma sobre el suelo).
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const lc = document.createElement('canvas'), lx = lc.getContext('2d');
const lg = document.createElement('canvas'), gx = lg.getContext('2d');   // resplandor de la luz azul (se suma encima del suelo)
// Atajo para buscar un elemento del HTML por su id:  $('hud')
const $ = id => document.getElementById(id);
// W y H = tamaño de la ventana en píxeles CSS · dpr = densidad de píxeles de la pantalla (los canvas se escalan por dpr para verse nítidos)
let W, H, dpr;

// ---------- Datos del nivel ----------
// lights : luces  { x, y, color, radius, intensity, tipo, id, activa, tapada, ruta, home }
// shapes : paredes y cajas  { type:'box', movable, pts:[4 puntos], skin }
const lights = [];
const shapes = [];
// sel  = lo seleccionado en el editor: { kind: 'light'|'shape'|'boton'|'puerta'|'player', ref } o null
// drag = arrastre en curso en el editor · mouse = última posición del ratón
let sel = null;          // { kind:'light'|'shape', ref }
let drag = null;
let mouse = { x: 0, y: 0 };
// ---------- Jugador y estadísticas ----------
// player: caja de 28x28 px, speed en px/s · keys: teclas pulsadas {KeyW:true,...} · stat: lit (¿lo toca una luz?), count (veces tocado), time (segundos en luz)
const player = { x: 0, y: 0, w: 28, h: 28, speed: 230 };
const keys = {};
const stat = { lit: false, count: 0, time: 0 };
let lastT = 0;

// Botones del nivel: { x, y, w, h, color:'azul'|'roja'|'amarilla', link:número de la luz, pressed }
//   azul = botón activador (luz azul) · roja = botón sostenido (luz roja) · amarilla = botón de apagar (luz amarilla)
const botones = [];
// Efectos que las luces aplican al jugador (se llenan en juego/mecanicas.js)
//   seguro = está dentro de una luz azul activa: las luces roja y amarilla no le hacen nada
const efectos = { seguro: false, retro: 0, dx: 0, dy: 0, gracia: 0 };

// ---------- Menús (js/ui/menus.js): mientras alguno está abierto el juego se congela ----------
let enMenu = false;      // true = se ve el Menú de Inicio (o su selector de niveles)
let pausado = false;     // true = partida en pausa (Enter)

// Ajusta los 3 canvas al tamaño de la ventana. Se ejecuta al cargar y cada vez que cambia el tamaño.
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  for (const c of [cv, lc, lg]) { c.width = W * dpr; c.height = H * dpr; }
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
}
addEventListener('resize', resize); resize();

// Punto de aparición del jugador (se guarda con el nivel)
const spawn = { x: 40, y: 0 };
