/* ═══════════════════════════════════════════════════════════
   NOOBI STUDIO — Scripts
   1. Intro · 2. Header · 3. Menú móvil · 4. Reveals
   5. Nav activa · 6. Filtros · 7. Lightbox · 8. Formulario
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Contadores para el bloqueo de scroll: la intro y el lightbox pueden
     solaparse, así que no basta con añadir/quitar la clase a ciegas. */
  let scrollLocks = 1; // la intro arranca con el body ya bloqueado
  function lockScroll()   { scrollLocks++; document.body.classList.add('is-locked'); }
  function unlockScroll() { if (--scrollLocks <= 0) { scrollLocks = 0; document.body.classList.remove('is-locked'); } }


  /* ── 1. INTRO ─────────────────────────────────────────── */
  (function intro() {
    const el   = $('#intro');
    const skip = $('#introSkip');
    if (!el) { unlockScroll(); return; }

    let finished = false;

    function end(instant) {
      if (finished) return;
      finished = true;

      if (instant) el.classList.add('intro--skip');
      el.classList.add('intro--done');
      unlockScroll();

      setTimeout(() => el.remove(), instant ? 350 : 100);
      document.dispatchEvent(new CustomEvent('intro:done'));
    }

    // Fin normal: cuando termina la animación de salida del overlay
    el.addEventListener('animationend', (e) => {
      if (e.target === el && e.animationName === 'introExit') end(false);
    });

    // Red de seguridad por si la animación nunca dispara el evento
    const safety = setTimeout(() => end(true), 5000);
    document.addEventListener('intro:done', () => clearTimeout(safety), { once: true });

    // Saltar: botón, clic en el fondo o tecla Escape
    if (skip) skip.addEventListener('click', () => end(true));
    el.addEventListener('click', (e) => { if (e.target === el) end(true); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') { end(true); document.removeEventListener('keydown', onKey); }
    });
  })();


  /* ── 1b. VIDEO DEL HERO ───────────────────────────────── */
  /* Mientras no exista Assets/Videos/hero.mp4 el <video> queda vacío y
     algunos navegadores pintan un rectángulo negro sobre el degradado.
     Si la fuente falla, lo quitamos y se ve el fondo de respaldo. */
  (function heroVideo() {
    const video = $('.hero__video');
    if (!video) return;

    const drop = () => video.remove();
    video.addEventListener('error', drop, true); // captura el error del <source>

    // Comprobación tardía: si nunca llegó a tener datos, no hay video
    setTimeout(() => {
      if (video.isConnected && video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) drop();
    }, 1500);
  })();


  /* ── 2. HEADER: fondo sólido al hacer scroll ──────────── */
  (function header() {
    const el = $('#header');
    if (!el) return;

    const update = () => el.classList.toggle('is-stuck', window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
  })();


  /* ── 3. MENÚ MÓVIL ────────────────────────────────────── */
  (function mobileNav() {
    const burger = $('#burger');
    const nav    = $('#nav');
    if (!burger || !nav) return;

    let open = false;

    function setOpen(next) {
      if (next === open) return;
      open = next;

      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');

      open ? lockScroll() : unlockScroll();
    }

    burger.addEventListener('click', () => setOpen(!open));

    // Cerrar al elegir una sección
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    // Si se vuelve a escritorio con el menú abierto, restaurar el scroll
    window.matchMedia('(min-width: 781px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  })();


  /* ── 4. REVEALS AL HACER SCROLL ───────────────────────── */
  /* Se inicializa cuando termina la intro: si no, el hero se revelaría
     por detrás del overlay y aparecería ya "quieto" al levantarse. */
  function initReveals() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    // Sin soporte de IntersectionObserver: mostrar todo sin animación
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.setProperty('--d', (el.dataset.revealDelay || 0) + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  }

  // Si no hay intro (o ya se removió), arranca de una vez
  if ($('#intro')) {
    document.addEventListener('intro:done', initReveals, { once: true });
  } else {
    initReveals();
  }


  /* ── 5. RESALTAR LA SECCIÓN ACTIVA EN EL NAV ──────────── */
  (function activeNav() {
    const links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const section = $(id);
      if (section) map.set(section, link);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        map.get(entry.target)?.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_link, section) => io.observe(section));
  })();


  /* ── 6. FILTROS DEL PORTAFOLIO ────────────────────────── */
  (function filters() {
    const buttons = $$('.filter');
    const cards   = $$('#portfolioGrid .card');
    const empty   = $('#gridEmpty');
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.filter;

        buttons.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });

        let visible = 0;
        cards.forEach((card) => {
          const show = cat === 'all' || card.dataset.cat === cat;
          card.hidden = !show;
          if (show) visible++;
        });

        if (empty) empty.hidden = visible > 0;
      });
    });
  })();


  /* ── 6b. MINIATURA SACADA DEL PROPIO VIDEO ────────────── */
  /* Si la tarjeta tiene data-mp4 pero no una portada en --img, usamos un
     fotograma del video como miniatura. Evita tener que exportar un JPG
     por cada proyecto. Si defines --img, esa imagen manda. */
  (function cardThumbs() {
    $$('#portfolioGrid .card__btn').forEach((btn) => {
      const mp4 = btn.dataset.mp4;
      if (!mp4) return;

      const media = $('.card__media', btn);
      if (!media) return;

      function useVideoFrame() {
        btn.style.setProperty('--img', 'none'); // por si quedó una ruta rota
        const thumb = document.createElement('video');
        thumb.className = 'card__thumb-video';
        thumb.src = mp4 + '#t=0.5'; // medio segundo: evita el fotograma negro del inicio
        thumb.muted = true;
        thumb.playsInline = true;
        thumb.preload = 'metadata';
        thumb.tabIndex = -1;
        thumb.setAttribute('aria-hidden', 'true');
        thumb.addEventListener('error', () => thumb.remove());
        media.prepend(thumb);
      }

      // ¿Hay una portada declarada y bien formada?
      const declared = btn.style.getPropertyValue('--img').trim();
      const url = declared.match(/url\(\s*['"]?(.*?)['"]?\s*\)/i)?.[1];

      if (!url) { useVideoFrame(); return; }

      /* Sí la hay, pero puede apuntar a un archivo inexistente. La probamos
         antes de confiar en ella: si falla, caemos al fotograma del video. */
      const probe = new Image();
      probe.addEventListener('error', useVideoFrame, { once: true });
      probe.src = url;
    });
  })();


  /* ── 7. LIGHTBOX DE VIDEO ─────────────────────────────── */
  (function lightbox() {
    const box   = $('#lightbox');
    const stage = $('#lbStage');
    const title = $('#lbTitle');
    if (!box || !stage) return;

    let lastFocus = null;

    /* Proporción del escenario, como número ancho/alto.
       Punto de partida: el formato declarado en la tarjeta. Para los mp4
       locales se corrige después con las medidas reales del archivo. */
    const RATIOS = { vertical: 9 / 16, cuadrado: 1, horizontal: 16 / 9 };

    function setRatio(n) {
      if (n > 0) stage.style.setProperty('--ar', String(n));
    }

    function open(trigger) {
      lastFocus = trigger;

      const yt   = trigger.dataset.yt;
      const mp4  = trigger.dataset.mp4;
      const name = trigger.dataset.title || 'Proyecto';

      const format = trigger.closest('.card')?.dataset.format || 'horizontal';
      setRatio(RATIOS[format] || RATIOS.horizontal);

      if (title) title.textContent = name;

      if (yt) {
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&rel=0&modestbranding=1`;
        frame.title = name;
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        stage.replaceChildren(frame);
      } else if (mp4) {
        const video = document.createElement('video');
        video.src = mp4;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;

        // Medidas reales del archivo: manda sobre el formato declarado
        video.addEventListener('loadedmetadata', () => {
          if (video.videoWidth && video.videoHeight) {
            setRatio(video.videoWidth / video.videoHeight);
          }
        }, { once: true });

        stage.replaceChildren(video);
      } else {
        const msg = document.createElement('p');
        msg.className = 'lightbox__empty';
        msg.textContent = 'Video próximamente. Añade data-yt="ID" o data-mp4="ruta.mp4" a esta tarjeta.';
        stage.replaceChildren(msg);
      }

      box.hidden = false;
      lockScroll();
      $('.lightbox__close', box)?.focus();
    }

    function close() {
      if (box.hidden) return;
      box.hidden = true;
      stage.replaceChildren(); // detiene reproducción y libera el iframe
      unlockScroll();
      lastFocus?.focus();
    }

    $$('#portfolioGrid .card__btn').forEach((btn) => {
      btn.addEventListener('click', () => open(btn));
    });

    $$('[data-close]', box).forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  })();


  /* ── 8. FORMULARIO → WHATSAPP ─────────────────────────── */
  (function contactForm() {
    const form = $('#contactForm');
    const note = $('#formNote');
    if (!form) return;

    // TODO: pon aquí tu número real, con indicativo y sin signos (Colombia = 57)
    const WHATSAPP = '573138288345';

    function say(text, kind) {
      if (!note) return;
      note.textContent = text;
      note.className = 'form__note' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data    = new FormData(form);
      const nombre  = (data.get('nombre')  || '').toString().trim();
      const email   = (data.get('email')   || '').toString().trim();
      const tipo    = (data.get('tipo')    || '').toString().trim();
      const mensaje = (data.get('mensaje') || '').toString().trim();

      // Validación mínima con marcado visual del campo que falla
      const checks = [
        ['f-nombre',  nombre.length  >= 2],
        ['f-email',   /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)],
        ['f-mensaje', mensaje.length >= 10],
      ];

      let firstBad = null;
      checks.forEach(([id, ok]) => {
        const field = document.getElementById(id)?.closest('.field');
        field?.classList.toggle('has-error', !ok);
        if (!ok && !firstBad) firstBad = document.getElementById(id);
      });

      if (firstBad) {
        say('Revisa los campos marcados: falta información.', 'error');
        firstBad.focus();
        return;
      }

      const texto =
        `Hola Noobi Studio\n\n` +
        `Nombre: ${nombre}\n` +
        `Correo: ${email}\n` +
        `Tipo de proyecto: ${tipo}\n\n` +
        `${mensaje}`;

      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');

      say('Abrimos WhatsApp con tu mensaje listo para enviar.', 'ok');
      form.reset();
    });

    // Quitar el estado de error apenas el usuario corrige
    $$('input, textarea', form).forEach((input) => {
      input.addEventListener('input', () => input.closest('.field')?.classList.remove('has-error'));
    });
  })();


  /* ── Año del footer ───────────────────────────────────── */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
