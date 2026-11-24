/* ======================================================================
   ESTILOS DE MENÚS                                     (js/ui/menus_estilos.js)
   ----------------------------------------------------------------------
   QUÉ HACE   Inserta el CSS del Menú de Inicio, el selector de niveles y el Menú de Pausa.
              Va en el <head> de index.html, justo después de estilos.js.
   ====================================================================== */
(function () {
  const estilo = document.createElement('style');
  estilo.id = 'estilos-menus';
  estilo.textContent = String.raw`/* ===== Menú de Inicio, selector de niveles y Menú de Pausa ===== */

/* ---- Menú de Inicio (pantalla completa) ---- */
#menu { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 38%, rgba(255,179,71,.16), transparent 55%),
              radial-gradient(ellipse at 15% 90%, rgba(61,139,255,.14), transparent 50%),
              radial-gradient(ellipse at 88% 85%, rgba(229,38,42,.12), transparent 50%), #0b0d12; }
.menu-pantalla { display: flex; flex-direction: column; align-items: center; padding: 20px; }

/* Título: ocupa 80 px de alto. Los botones empiezan a 56 px debajo y miden 48 px, así que el CENTRO del primer botón
   queda a 40 + 56 + 24 = 120 px (= 5 cuadros de 24 px) bajo el centro del título. Cambia margin-top para acercarlos/alejarlos. */
.menu-titulo { height: 80px; margin: 0; line-height: 80px; text-align: center; white-space: nowrap;
  font-size: clamp(30px, 7vw, 66px); font-weight: 800; letter-spacing: .01em; color: #ffb347; text-shadow: 0 0 30px rgba(255,179,71,.35); }
.menu-sub { font-size: clamp(26px, 5vw, 44px); }
.menu-botones { display: flex; flex-direction: column; gap: 14px; margin-top: 56px; }
.menu-botones button { width: min(280px, 80vw); height: 48px; padding: 0; font-size: 18px; font-weight: 700; border-radius: 12px; }
.menu-botones button:hover, .menu-botones button:focus-visible { background: #ffb347; border-color: #ffb347; color: #1a1306; outline: none; }

/* ---- Selector de niveles ---- */
.menu-niveles { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin-top: 40px; max-width: 700px; }
.nivel-card { width: 180px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 14px; background: #151922; border: 1px solid #2a3040; }
.nivel-card .num { font-size: 38px; font-weight: 800; line-height: 1; color: #ffb347; }
.nivel-card .nom { font-size: 14px; color: #c3c9d6; text-align: center; }
.nivel-card:hover, .nivel-card:focus-visible { background: #1d2331; border-color: #ffb347; outline: none; }
.menu-niveles + .menu-botones { margin-top: 32px; }

/* ---- Menú de Pausa (solo se abre y se cierra con Enter) ---- */
#pausa { position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(8,10,15,.72); backdrop-filter: blur(3px); }
#pausa h2 { margin: 0 0 10px; font-size: 56px; letter-spacing: .14em; color: #ffb347; }
#pausa p { margin: 0; font-size: 16px; color: #c3c9d6; }
#pausa .menu-botones { margin-top: 28px; }
#pausa kbd { padding: 2px 9px; font: inherit; font-weight: 700; color: #1a1306; background: #ffb347; border-radius: 6px; }

/* Botón «Volver al menú» de la pantalla de victoria */
#victoria #vMenu { margin-left: 8px; background: #232938; border-color: #333b50; color: #e6e8ee; }`;
  document.head.appendChild(estilo);
})();
