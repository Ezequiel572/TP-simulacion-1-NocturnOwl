/* ======================================================================
   ESTILOS                                              (js/ui/estilos.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Inserta el CSS de la interfaz en la página al cargar (no hay archivos .css sueltos).
              Va en el <head> de index.html, antes de que exista el <body>, para que no haya un «salto» de estilos.
   SECCIONES  1) style.css       base, panel, HUD, barra inferior       2) editor.css   paleta del editor
              3) Añadidos        botones de colores, victoria, perf      4) Panel de opciones con iconos
              (los estilos de los menús están en menus_estilos.js)
   CÓMO       Para cambiar algo, edita el texto CSS de la sección que corresponda. El orden importa: las últimas ganan.
   ====================================================================== */
(function () {
  const secciones = [
    { nombre: 'style.css (base, panel, HUD, barra inferior)', css: String.raw`/* ===== Base ===== */
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { margin: 0; height: 100%; overflow: hidden; background: #0b0d12; color: #e6e8ee;
  font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
canvas#c { position: fixed; inset: 0; display: block; touch-action: none; }

/* ===== Panel izquierdo (con pestañas) ===== */
#panel { position: fixed; top: 12px; left: 12px; width: 270px; max-height: calc(100vh - 90px); overflow-y: auto;
  padding: 12px; background: rgba(18,21,28,.92); border: 1px solid #2a3040; border-radius: 12px;
  backdrop-filter: blur(6px); box-shadow: 0 6px 24px rgba(0,0,0,.35); }
#panel h1 { margin: 0 0 10px; font-size: 15px; font-weight: 600; }
.tabs { display: flex; gap: 4px; margin-bottom: 10px; padding: 3px; background: #0e1118; border-radius: 9px; }
.tab { flex: 1; padding: 6px 4px; font-size: 12px; background: transparent; border: 0; border-radius: 7px; color: #9aa3b5; cursor: pointer; }
.tab:hover { color: #fff; }
.tab.on { background: #ffb347; color: #1a1306; font-weight: 600; }
.hint { margin: 0 0 8px; color: #aab2c3; font-size: 12px; }
.hint b { color: #e6e8ee; }
label { display: block; margin: 8px 0 3px; color: #c3c9d6; }
label b { float: right; color: #ffb347; font-weight: 600; }
label.check { display: flex; align-items: center; gap: 7px; cursor: pointer; margin: 7px 0; }
input[type=range] { width: 100%; accent-color: #ffb347; }
input[type=color] { width: 100%; height: 30px; padding: 0; border: 1px solid #2a3040; border-radius: 6px; background: none; }
input[type=number] { width: 100%; padding: 6px 8px; color: #e6e8ee; background: #0e1118; border: 1px solid #2a3040; border-radius: 6px; }
input:disabled { opacity: .4; }
.row { margin-top: 12px; }

/* ===== Botones ===== */
button { font: inherit; color: #e6e8ee; background: #232938; border: 1px solid #333b50; border-radius: 8px; padding: 6px 11px; cursor: pointer; }
button:hover { background: #2d3548; }
button.on { background: #ffb347; border-color: #ffb347; color: #1a1306; font-weight: 600; }
.row button { width: 100%; }

/* ===== HUD (arriba a la derecha) ===== */
#hud { position: fixed; top: 12px; right: 12px; min-width: 200px; padding: 10px 12px; background: rgba(18,21,28,.92);
  border: 1px solid #2a3040; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.35); }
#hud span { color: #9aa3b5; }
#hud b { float: right; margin-left: 10px; }
#hud .state { margin-bottom: 6px; font-weight: 700; color: #2fbf9a; }
#hud.lit { border-color: #e5262a; }
#hud.lit .state { color: #ff5a5a; }

/* ===== Barra inferior: siempre visible, aquí está el editor ===== */
#toolbar { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px;
  max-width: calc(100vw - 24px); padding: 8px 10px; background: rgba(18,21,28,.94); border: 1px solid #2a3040; border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0,0,0,.4); }
#tools { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
#tools .check { margin: 0 4px; white-space: nowrap; }
.sep { width: 1px; height: 22px; background: #333b50; margin: 0 4px; }
#btnModo { background: #ffb347; border-color: #ffb347; color: #1a1306; font-weight: 700; padding: 8px 16px; white-space: nowrap; }
#btnModo:hover { background: #ffc46e; }

/* ===== Botón de info (abajo a la izquierda) ===== */
#btnInfo { position: fixed; left: 12px; bottom: 14px; font-size: 12px; opacity: .8; }
#btnInfo:hover { opacity: 1; }

/* ===== Aviso temporal ===== */
#toast { position: fixed; left: 50%; bottom: 84px; transform: translate(-50%, 10px); padding: 8px 14px; background: #ffb347; color: #1a1306;
  font-weight: 600; border-radius: 9px; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
#toast.show { opacity: 1; transform: translate(-50%, 0); }

/* ===== Pantallas pequeñas ===== */
@media (max-width: 900px) {
  #panel { width: 230px; }
  #hud { min-width: 170px; }
}

/* ===== Herramientas de luz: una raya del color de cada luz ===== */
button[data-tool="luz_azul"]     { border-bottom: 3px solid #3d8bff; }
button[data-tool="luz_roja"]     { border-bottom: 3px solid #ff2b2b; }
button[data-tool="luz_amarilla"] { border-bottom: 3px solid #ffd028; }` },
    { nombre: 'editor.css (paleta del editor con iconos)', css: String.raw`/* ===== Barra del editor con iconos (estilo "paleta") ===== */
#tools { align-items: flex-end; gap: 10px; }
#tools .grupo { display: flex; flex-direction: column; align-items: center; gap: 4px; }
#tools .grupo + .grupo { padding-left: 10px; border-left: 1px solid #333b50; }
#tools .cap { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #7f89a0; }
#tools .fila { display: flex; align-items: center; gap: 6px; }

#tools .tool { position: relative; width: 68px; height: 68px; padding: 6px 2px 4px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px; background: #1b2030; border: 2px solid #333b50; border-radius: 12px;
  color: #c3c9d6; font-size: 10.5px; font-weight: 600; line-height: 1.1; white-space: nowrap;
  transition: transform .08s, background .12s, border-color .12s; }
#tools .tool svg { width: 32px; height: 32px; flex: none; }
#tools .tool > * { pointer-events: none; }                 /* el clic siempre cae en el botón (para que el teclado siga funcionando) */
#tools .tool:hover { background: #262d42; border-color: #5b6788; transform: translateY(-2px); color: #fff; }
#tools .tool.on { background: #2a2113; border-color: #ffb347; color: #ffb347; box-shadow: 0 0 0 3px rgba(255,179,71,.3); font-weight: 700; }
#tools .tool kbd { position: absolute; top: 3px; left: 4px; padding: 0 4px; font: 700 9px/13px system-ui, sans-serif;
  color: #9aa3b5; background: rgba(0,0,0,.4); border-radius: 4px; }
#tools .tool.on kbd { color: #ffb347; }
#tools .tool.accion { width: 60px; }

#tools .check { margin: 0 2px; font-size: 11px; }

/* El aviso temporal sube para no taparse con la paleta */
#toolbar:has(#tools:not([hidden])) ~ #toast { bottom: 160px; }

@media (max-width: 1100px) { #tools .tool { width: 60px; height: 62px; } #tools .tool svg { width: 28px; height: 28px; } }` },
    { nombre: 'Añadidos que estaban dentro de index.html (botones de colores, victoria)', css: String.raw`/* Añadidos de esta versión (los dejo aquí para no tocar css/style.css) */
.tab { padding: 6px 2px; font-size: 11.5px; }
button[data-tool="boton_azul"]     { border-bottom: 3px solid #2f7bff; }
button[data-tool="boton_roja"]     { border-bottom: 3px solid #e5262a; }
button[data-tool="boton_amarilla"] { border-bottom: 3px solid #ffd028; }
button[data-tool="puerta"]     { border-bottom: 3px solid #7dffb0; }
#perf { position: fixed; left: 12px; bottom: 52px; z-index: 70; margin: 0; padding: 8px 10px; pointer-events: none; font: 12px/1.45 ui-monospace, Consolas, monospace; color: #cfe8ff; background: rgba(8,10,15,.85); border: 1px solid #2a3040; border-radius: 8px; white-space: pre; }
#botonLink { width: 100%; padding: 6px 8px; color: #e6e8ee; background: #0e1118; border: 1px solid #2a3040; border-radius: 6px; font: inherit; }
#victoria { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(8,10,15,.85); }
#victoria .caja { min-width: 300px; padding: 28px 34px; text-align: center; background: #151922; border: 1px solid #2a3040; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,.5); }
#victoria h2 { margin: 0 0 12px; font-size: 28px; color: #7dffb0; }
#victoria p { margin: 6px 0; color: #c3c9d6; font-size: 14px; }
#victoria b { color: #ffb347; }
#victoria button { margin-top: 16px; padding: 10px 22px; font-size: 14px; font-weight: 700; background: #ffb347; border-color: #ffb347; color: #1a1306; }` },
    { nombre: 'Panel de opciones con iconos', css: String.raw`/* ===== Iconos en general ===== */
i[data-icono], .ficha, .chip svg { font-style: normal; }
i[data-icono] { display: inline-block; width: 18px; height: 18px; flex: none; }
i[data-icono] svg { display: block; width: 100%; height: 100%; }

/* ===== Panel de opciones (a la izquierda) ===== */
#panel { width: 300px; padding: 12px; }
#panel h1 { margin-bottom: 10px; }
#panel kbd { padding: 1px 6px; font: 700 11px system-ui, sans-serif; color: #1a1306; background: #ffb347; border-radius: 5px; }

/* Pestañas con icono */
#panel .tabs { gap: 4px; padding: 4px; }
#panel .tab { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 2px 5px; font-size: 10.5px; font-weight: 600; border-radius: 9px; }
#panel .tab i[data-icono] { width: 24px; height: 24px; }
#panel .tab > * { pointer-events: none; }
#panel .tab:not(.on) { color: #aab2c3; }

/* Cabecera de lo seleccionado */
.cabecera { display: flex; gap: 10px; align-items: center; padding: 10px; margin-bottom: 12px; background: #151a27; border: 1px solid #2a3040; border-radius: 12px; }
.ficha { width: 54px; height: 54px; flex: none; display: flex; align-items: center; justify-content: center; padding: 8px; background: #0e1118; border: 2px solid var(--c, #333b50); border-radius: 12px; box-shadow: 0 0 14px -4px var(--c, transparent); }
.ficha svg { width: 100%; height: 100%; }
.cabecera h2 { margin: 0 0 2px; font-size: 14px; color: #fff; }
.cabecera p { margin: 0; font-size: 11.5px; line-height: 1.35; color: #aab2c3; }

/* Nada seleccionado */
.vacio { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 12px; text-align: center; font-size: 12px; line-height: 1.45; color: #aab2c3; border: 2px dashed #333b50; border-radius: 12px; }
.vacio p { margin: 0; }
.vacio i[data-icono] { width: 34px; height: 34px; }
.vacio b { color: #fff; }

/* Controles */
.ctl { margin: 0 0 12px; }
.ctl-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; font-size: 12.5px; font-weight: 600; color: #e6e8ee; }
.ctl-top i[data-icono] { color: #ffb347; }
#panel .ctl-top b { float: none; margin-left: auto; padding: 1px 8px; font-size: 11.5px; font-weight: 700; color: #ffb347; background: #0e1118; border-radius: 6px; }
#panel small { display: block; margin-top: 5px; font-size: 11px; line-height: 1.35; color: #8a93a8; }
#panel small.nota { margin: 8px 0 0; }

/* Barras deslizantes */
#panel input[type=range] { -webkit-appearance: none; appearance: none; height: 8px; margin: 6px 0; background: #0e1118; border: 1px solid #2a3040; border-radius: 6px; outline: none; }
#panel input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #ffb347; border: 3px solid #1a1306; border-radius: 50%; cursor: pointer; }
#panel input[type=range]::-moz-range-thumb { width: 14px; height: 14px; background: #ffb347; border: 3px solid #1a1306; border-radius: 50%; cursor: pointer; }
#panel input[type=range]:focus-visible { box-shadow: 0 0 0 2px rgba(255,179,71,.5); }

/* Campo numérico con − y + */
.stepper { display: flex; gap: 6px; }
.stepper button { width: 40px; height: 40px; flex: none; padding: 0; font-size: 22px; font-weight: 700; line-height: 1; color: #ffb347; background: #1b2030; border: 2px solid #333b50; border-radius: 10px; }
.stepper button:hover { background: #262d42; border-color: #ffb347; }
.stepper input { flex: 1; min-width: 0; height: 40px; padding: 0; text-align: center; font-size: 16px; font-weight: 700; background: #0e1118; border: 2px solid #333b50; border-radius: 10px; -moz-appearance: textfield; }
.stepper input:focus { outline: none; border-color: #ffb347; }
.stepper input::-webkit-outer-spin-button, .stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* Interruptores (en vez de casillas) */
#panel label.switch { position: relative; display: flex; align-items: center; gap: 10px; margin: 8px 0; padding: 8px 10px; color: #e6e8ee; background: #151a27; border: 1px solid #2a3040; border-radius: 10px; cursor: pointer; }
.switch:hover { border-color: #3d4660; }
.switch input { position: absolute; opacity: 0; pointer-events: none; }
.switch .pista { position: relative; order: 2; margin-left: auto; width: 38px; height: 22px; flex: none; background: #2a3040; border-radius: 12px; transition: background .15s; }
.switch .pista::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #9aa3b5; border-radius: 50%; transition: transform .15s, background .15s; }
.switch input:checked + .pista { background: #7a5413; }
.switch input:checked + .pista::after { transform: translateX(16px); background: #ffb347; }
.switch input:focus-visible + .pista { outline: 2px solid #ffb347; }
.switch .txt { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; }
.switch .txt i[data-icono] { color: #ffb347; }

/* Tarjeta de la ruta de la luz */
.tarjeta { margin-top: 4px; padding: 10px; background: #12161f; border: 1px solid #2a3040; border-radius: 12px; }
.tarjeta > .switch { margin-top: 0; }
.tarjeta .ctl { margin-top: 10px; }

/* Botones grandes con icono */
.btn-icono { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 6px; padding: 10px; font-size: 12.5px; font-weight: 700; color: #e6e8ee; background: #1b2030; border: 2px solid #333b50; border-radius: 10px; }
.btn-icono:hover { background: #262d42; border-color: #ffb347; }
.btn-icono i[data-icono] { color: #ffb347; }

/* Fichas para elegir la luz de un botón */
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: flex; align-items: center; gap: 6px; padding: 5px 12px 5px 6px; font-size: 12px; font-weight: 700; color: #c3c9d6; background: #1b2030; border: 2px solid #333b50; border-radius: 999px; }
.chip svg { width: 22px; height: 22px; }
.chip:hover { border-color: #5b6788; }
.chip.on { color: #ffb347; background: #2a2113; border-color: #ffb347; }
.vacio-mini { margin: 0; font-size: 11.5px; line-height: 1.4; color: #8a93a8; }

/* Pestaña Ayuda */
.bloque { margin-bottom: 14px; }
.bloque h3 { margin: 0 0 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #7f89a0; }
.item { display: flex; align-items: flex-start; gap: 9px; margin: 7px 0; font-size: 12px; line-height: 1.4; color: #c3c9d6; }
.item p { margin: 0; }
.item b { color: #fff; }
.item > i[data-icono] { width: 26px; height: 26px; margin-top: 1px; }

@media (max-width: 900px) { #panel { width: 250px; } }` },
  ];
  const estilo = document.createElement('style');
  estilo.id = 'estilos-juego';
  estilo.textContent = secciones.map(s => '/* ' + s.nombre + ' */\n' + s.css).join('\n\n');
  document.head.appendChild(estilo);
})();
