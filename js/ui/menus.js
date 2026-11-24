/* ======================================================================
   9 · MENÚS                                            (js/ui/menus.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Menú de Inicio (Jugar · Editor de niveles), selector de niveles y Menú de Pausa.
   CONGELADO  Mientras `enMenu` o `pausado` son true, main.js no mueve ni dibuja el juego.
   PAUSA      Enter pausa y reanuda durante la partida (no en menús, victoria ni editor).
   ====================================================================== */

/* ---------- Menú de Inicio ---------- */
// Muestra una de las dos pantallas del menú: 'principal' o 'niveles'.
function mostrarPantallaMenu(nombre) {
  $('menuPrincipal').hidden = nombre !== 'principal';
  $('menuNiveles').hidden = nombre !== 'niveles';
}
// Abre el Menú de Inicio: quita pausa y victoria, suelta las teclas y muestra la pantalla principal.
function mostrarMenu() {
  enMenu = true; pausado = false; fin = false;
  $('pausa').hidden = true; $('victoria').hidden = true;
  for (const k in keys) keys[k] = false;
  mostrarPantallaMenu('principal');
  $('menu').hidden = false;
}
function ocultarMenu() { enMenu = false; $('menu').hidden = true; }

// Una tarjeta por cada nivel de NIVELES (juego/niveles.js): si agregas un nivel, aparece solo
// Una tarjeta por cada nivel de NIVELES (juego/niveles.js): si agregas un nivel, aparece solo.
function construirSelector() {
  const lista = $('listaNiveles'); lista.innerHTML = '';
  NIVELES.forEach((n, i) => {
    const b = document.createElement('button'); b.className = 'nivel-card';
    const num = document.createElement('span'); num.className = 'num'; num.textContent = i + 1;
    const nom = document.createElement('span'); nom.className = 'nom'; nom.textContent = n.nombre;
    b.append(num, nom);
    b.onclick = () => { b.blur(); iniciarNivel(i); };
    lista.appendChild(b);
  });
}
// Empieza una partida en el nivel i (estadísticas a cero, interfaz oculta; K la muestra).
function iniciarNivel(i) {
  totales.count = 0; totales.time = 0;
  ocultarMenu();
  cargarNivel(i);
  setModo('jugar');
  setInfo(false);                 // al empezar un nivel la interfaz queda oculta (K la muestra)
}

$('mJugar').onclick = e => { e.target.blur(); construirSelector(); mostrarPantallaMenu('niveles'); };
$('mVolver').onclick = e => { e.target.blur(); mostrarPantallaMenu('principal'); };
$('mEditor').onclick = e => {
  e.target.blur();
  // Si ya venías editando un nivel se conserva; si no, el editor empieza con un nivel vacío
  if (!editado) cargarDatos({ lights: [], shapes: [], ambient: 0.07 });
  ocultarMenu();
  setModo('editar');
  setInfo(true);                  // el editor necesita la interfaz a la vista
};
$('btnMenu').onclick = () => mostrarMenu();
$('vMenu').onclick = () => mostrarMenu();

/* ---------- Menú de Pausa (Enter abre/cierra; también tiene botones) ---------- */
$('pReiniciar').onclick = e => { e.target.blur(); reiniciarJuego(); alternarPausa(); };   // R del editor: cajas y jugador a su sitio
$('pMenu').onclick = e => { e.target.blur(); mostrarMenu(); };                           // mostrarMenu() ya quita la pausa
// Pausa o reanuda. Al cambiar de estado se sueltan las teclas para que no se quede ninguna «pegada».
function alternarPausa() {
  pausado = !pausado;
  $('pausa').hidden = !pausado;
  for (const k in keys) keys[k] = false;      // al pausar/reanudar no queda ninguna tecla "pegada"
}
addEventListener('keydown', e => {
  if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
  if (enMenu || fin || modo !== 'jugar') return;   // solo durante la partida (no en menús, victoria ni editor)
  e.preventDefault();
  if (!e.repeat) alternarPausa();                  // mantener Enter apretado no parpadea
});
