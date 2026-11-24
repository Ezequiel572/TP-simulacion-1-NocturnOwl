/* ======================================================================
   ICONOS
   Dibujos SVG de todas las herramientas y opciones. Se usan así:
     · en el HTML:  <i data-icono="luz_roja"></i>  (se rellena solo al cargar)
     · en JS:       ponerIcono(elemento, 'luz_roja')  ·  iconoSVG('luz_roja') devuelve el texto <svg>
   Los de color llevan sus colores; los "mono" (lista MONO) toman el color del texto que los rodea.
   ====================================================================== */
(function () {
  const ST = 'stroke="#0b0d12" stroke-width="1.5"';
  const luz = c => `<g stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/></g><circle cx="16" cy="16" r="6" fill="${c}" ${ST}/>`;
  const boton = (c, dentro) => `<rect x="4" y="4" width="24" height="24" rx="3" fill="#1a1d26" stroke="${c}" stroke-width="2"/>${dentro}`;

  window.ICONOS = {
    // ---- de color ----
    select: `<path d="M9 4v21l5.5-5 4 8 3.5-1.8-4-7.7H23z" fill="#e6e8ee" ${ST} stroke-linejoin="round"/>`,
    delete: `<path d="M8 9h16l-1.5 18h-13z" fill="#e5484d" ${ST} stroke-linejoin="round"/><path d="M6 9h20M13 9V6h6v3" stroke="#0b0d12" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 13v10M16 13v10M19 13v10" stroke="#fff" stroke-width="1.4" opacity=".8"/>`,
    box: `<rect x="3" y="6" width="26" height="20" rx="2" fill="#7a3324" ${ST}/><path d="M3 12.7h26M3 19.3h26M12 6v6.7M22 12.7v6.6M12 19.3V26" stroke="#0b0d12" stroke-width="1.5" fill="none"/>`,
    crate: `<rect x="4" y="4" width="24" height="24" rx="2" fill="#a8672f" ${ST}/><path d="M4 4l24 24M28 4L4 28" stroke="#6e3f17" stroke-width="2"/><rect x="5.5" y="5.5" width="21" height="21" rx="1" fill="none" stroke="#6e3f17" stroke-width="2.5"/>`,
    luz_azul: luz('#3d8bff'), luz_roja: luz('#ff2b2b'), luz_amarilla: luz('#ffd028'),
    boton_azul: boton('#2f7bff', '<circle cx="16" cy="16" r="6.5" fill="#2f7bff"/>'),
    boton_roja: boton('#e5262a', '<rect x="10" y="10" width="12" height="12" rx="2" fill="#e5262a"/>'),
    boton_amarilla: boton('#ffd028', '<rect x="9" y="9" width="14" height="14" rx="2" fill="#ffd028"/><path d="M16 11.5v5" stroke="#1a1306" stroke-width="2" stroke-linecap="round"/><path d="M12.8 13.6a4.6 4.6 0 1 0 6.4 0" fill="none" stroke="#1a1306" stroke-width="2" stroke-linecap="round"/>'),
    puerta: '<rect x="7" y="3" width="18" height="26" rx="2" fill="#2a1d12" stroke="#7dffb0" stroke-width="2"/><rect x="10" y="7" width="12" height="22" fill="#1f9d6b"/><circle cx="20" cy="19" r="1.8" fill="#ffd028"/>',
    player: `<rect x="6" y="6" width="20" height="20" rx="3" fill="#2fbf9a" stroke="#0b0d12" stroke-width="2"/><circle cx="12.5" cy="14" r="2" fill="#0b0d12"/><circle cx="19.5" cy="14" r="2" fill="#0b0d12"/><path d="M12 20q4 3 8 0" stroke="#0b0d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    // ---- mono (color del texto) ----
    ayuda: '<circle cx="16" cy="16" r="12"/><path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1.2.8-1.5 1.3-1.5 2.8"/><path d="M16 23v.5"/>',
    ajustes: '<path d="M5 9h22M5 16h22M5 23h22"/><circle cx="11" cy="9" r="3" fill="#1b2030"/><circle cx="21" cy="16" r="3" fill="#1b2030"/><circle cx="13" cy="23" r="3" fill="#1b2030"/>',
    numero: '<path d="M12 5l-2 22M22 5l-2 22M5 12h22M4 20h22"/>',
    alcance: '<circle cx="16" cy="16" r="11" stroke-dasharray="3 3.5"/><circle cx="16" cy="16" r="2.2" fill="currentColor" stroke="none"/>',
    brillo: '<circle cx="16" cy="16" r="5"/><path d="M16 3v3M16 26v3M3 16h3M26 16h3M7 7l2 2M23 23l2 2M25 7l-2 2M9 23l-2 2"/>',
    velocidad: '<path d="M4 12h12M4 20h8M18 8l8 8-8 8"/>',
    ancho: '<path d="M4 16h24M9 11l-5 5 5 5M23 11l5 5-5 5"/>',
    alto: '<path d="M16 4v24M11 9l5-5 5 5M11 23l5 5 5-5"/>',
    luna: '<path d="M22 5a11 11 0 1 0 5 15A9 9 0 0 1 22 5z"/>',
    gota: '<path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/>',
    llama: '<path d="M16 3c1 6 8 8 8 16a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 2 4 3 4 0-5-1-8 1-12z"/>',
    rayo: '<path d="M5 27L22 10"/><circle cx="25" cy="7" r="3.5"/><circle cx="6" cy="26" r="2" fill="currentColor" stroke="none"/>',
    aabb: '<rect x="5" y="5" width="22" height="22" stroke-dasharray="4 3"/>',
    enlace: '<circle cx="8" cy="24" r="4"/><circle cx="24" cy="8" r="4"/><path d="M11 21l10-10" stroke-dasharray="2 3"/>',
    reiniciar: '<path d="M26 16a10 10 0 1 1-3-7M26 5v6h-6"/>',
    ruta: '<circle cx="7" cy="16" r="3.5"/><path d="M12 16h8" stroke-dasharray="2 3"/><path d="M25 10l6 6-6 6-6-6z" transform="translate(-3 0)"/>',
    vaiven: '<path d="M6 12h20l-5-5M26 20H6l5 5"/>',
  };
  const MONO = new Set(['ayuda', 'ajustes', 'numero', 'alcance', 'brillo', 'velocidad', 'ancho', 'alto', 'luna', 'gota', 'llama', 'rayo', 'aabb', 'enlace', 'reiniciar', 'ruta', 'vaiven']);

  window.iconoSVG = k => {
    const d = ICONOS[k];
    if (!d) return '';
    return `<svg viewBox="0 0 32 32" aria-hidden="true"${MONO.has(k) ? ' fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"' : ''}>${d}</svg>`;
  };
  window.ponerIcono = (el, k) => { el.innerHTML = window.iconoSVG(k); };
  document.querySelectorAll('[data-icono]').forEach(el => window.ponerIcono(el, el.dataset.icono));
})();
