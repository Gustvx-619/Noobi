/* ═══════════════════════════════════════════════════════════
   NOOBI STUDIO — Tarifario
   Resalta en el índice la sección que se está leyendo.
   Solo corre en tarifario.html; script.js se encarga del resto.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const nav = document.getElementById('rateNav');
  if (!nav || !('IntersectionObserver' in window)) return;

  const links = Array.from(nav.querySelectorAll('a'));
  if (!links.length) return;

  // Mapea cada sección con su enlace del índice
  const map = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const section = document.querySelector(id);
    if (section) map.set(section, link);
  });
  if (!map.size) return;

  function activate(link) {
    if (link.classList.contains('is-active')) return;
    links.forEach((l) => l.classList.remove('is-active'));
    link.classList.add('is-active');

    /* El índice hace scroll horizontal en móvil: si el enlace activo queda
       fuera de vista, no sirve de nada resaltarlo. */
    const list = link.parentElement;
    if (list.scrollWidth > list.clientWidth) {
      const target = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  }

  /* La banda de detección se sitúa justo debajo del header + el índice,
     para que la sección marcada sea la que realmente se está leyendo. */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activate(map.get(entry.target));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  map.forEach((_link, section) => io.observe(section));

})();
