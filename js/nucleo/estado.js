/* ======================================================================
   1 · ESTADO COMPARTIDO
   Canvas, tamaño de pantalla y los datos globales que usan todos los módulos.
   ====================================================================== */

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const lc = document.createElement('canvas'), lx = lc.getContext('2d');
const $ = id => document.getElementById(id);
let W, H, dpr;

const lights = [];
const shapes = [];
let sel = null;          // { kind:'light'|'shape', ref }
let drag = null;
let mouse = { x: 0, y: 0 };
const player = { x: 0, y: 0, w: 28, h: 28, speed: 230 };
const keys = {};
const stat = { lit: false, count: 0, time: 0 };
let lastT = 0;

// NUEVO · botones del nivel: { x, y, w, h, color:'azul'|'roja', link:id de la luz, pressed }
const botones = [];
// NUEVO · efectos que las luces aplican al jugador (se llenan en juego/mecanicas.js)
const efectos = { lento: false, retro: 0, dx: 0, dy: 0, gracia: 0 };

function resize() {
  dpr = window.devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  for (const c of [cv, lc]) { c.width = W * dpr; c.height = H * dpr; }
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
}
addEventListener('resize', resize); resize();

// Punto de aparición del jugador (se guarda con el nivel)
const spawn = { x: 40, y: 0 };
