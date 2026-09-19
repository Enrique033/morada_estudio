/* MORADA ESTUDIO · audaz.js — interactividad "Calido Audaz"
   Nav activa, contadores, tilt 3D,
   filtros de proyectos y toast. Vanilla JS. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* 2. Nav activa segun seccion visible — SOLO pinta el botón activo,
     sin barra de progreso superior (eliminada a petición). */
  const navLinks = [...document.querySelectorAll('.nav__list a[href^="#"]')];
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && navLinks.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a =>
          a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* 3. Contadores animados [data-count] */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.innerHTML = `${target}<span class="suffix">${suffix}</span>`; return; }
    const dur = 1400, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = `${Math.round(target * eased)}<span class="suffix">${suffix}</span>`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* 4. Tilt 3D en [data-tilt] (solo puntero fino) */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* 5. Filtros de proyectos */
  const filterBtns = [...document.querySelectorAll('.filter-btn')];
  const projects = [...document.querySelectorAll('.project[data-cat]')];
  if (filterBtns.length && projects.length) {
    const grid = document.querySelector('.projects__grid');
    const activeMsg = document.getElementById('projects-active');
    const countMsg = document.getElementById('projects-count');
    const catLabel = f => f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1);
    const paintCount = n => { if (countMsg) countMsg.textContent = n + (n === 1 ? ' proyecto' : ' proyectos'); };
    const paintActive = f => {
      if (!activeMsg) return;
      if (f === 'all') { activeMsg.hidden = true; activeMsg.textContent = ''; return; }
      activeMsg.hidden = false;
      activeMsg.innerHTML = '';
      activeMsg.append('Mostrando: ' + catLabel(f) + '  ');
      const clear = document.createElement('button');
      clear.type = 'button'; clear.className = 'projects__clear'; clear.textContent = 'Ver todos';
      clear.addEventListener('click', () => applyFilter('all'));
      activeMsg.append(clear);
    };
    const applyFilter = f => {
      filterBtns.forEach(b => {
        const on = b.dataset.filter === f;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const visibles = projects.filter(pr => f === 'all' || pr.dataset.cat === f);
      visibles.forEach((pr, i) => pr.classList.toggle('is-alt', i % 2 === 1));
      projects.forEach(pr => {
        const show = f === 'all' || pr.dataset.cat === f;
        pr.classList.toggle('is-hidden', !show);
      });
      if (grid) grid.classList.toggle('has-single', visibles.length === 1);
      if (grid) grid.classList.toggle('has-few', visibles.length > 1 && visibles.length <= 3);
      paintActive(f); paintCount(visibles.length);
    };
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });
    /* Tarjetas de muestra: NO navegan, solo se seleccionan visualmente */
    const selectProject = (pr, on) => {
      pr.classList.toggle('is-selected', on);
      pr.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    projects.forEach(pr => {
      pr.addEventListener('click', () => {
        const nowOn = !pr.classList.contains('is-selected');
        projects.forEach(p => selectProject(p, false));
        selectProject(pr, nowOn);
      });
      pr.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pr.click();
        }
      });
    });
    paintCount(projects.length);
  }

  /* 7. Carrusel de destacados: flechas + dots + swipe + teclado */
  const track = document.getElementById('carousel-track');
  const viewport = document.getElementById('carousel-viewport');
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const counter = document.getElementById('carousel-counter');
  const dots = [...document.querySelectorAll('.carousel__dot')];
  if (track && viewport) {
    const slides = [...track.children];
    const per = () =>
      window.innerWidth >= 768 ? 3 : 1;
    let index = 0;
    const maxStart = () => Math.max(slides.length - per(), 0);
    const step = () => {
      const first = slides[0];
      if (!first) return 320;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 18;
      return first.getBoundingClientRect().width + gap;
    };
    const render = () => {
      index = Math.max(0, Math.min(index, maxStart()));
      track.style.transform = `translateX(${-index * step()}px)`;
      viewport.dataset.index = String(index);
      slides.forEach((s, i) => {
        const visible = i >= index && i < index + per();
        s.classList.toggle('is-active', i === index);
        s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });
      if (counter) counter.textContent = `${Math.min(index + 1, slides.length)} / ${slides.length}`;
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    };
    const go = d => { index += d; render(); restart(); };
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    dots.forEach(d => d.addEventListener('click', () => {
      index = parseInt(d.dataset.goto || '0', 10);
      render(); restart();
    }));
    viewport.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    /* Swipe tactil */
    let x0 = null, dx = 0, dragging = false;
    viewport.addEventListener('pointerdown', e => {
      dragging = true; x0 = e.clientX; dx = 0;
      track.style.transition = 'none';
      if (viewport.setPointerCapture && e.pointerId !== undefined) {
        try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });
    viewport.addEventListener('pointermove', e => {
      if (!dragging || x0 === null) return;
      dx = e.clientX - x0;
      track.style.transform = `translateX(${-index * step() + dx}px)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      if (dx < -50) index++;
      else if (dx > 50) index--;
      dx = 0; x0 = null;
      render(); restart();
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    /* Autoplay pausado en hover / foco / reduced-motion */
    let timer = null;
    const restart = () => {
      clearInterval(timer);
      if (reduced) return;
      timer = setInterval(() => {
        index = index >= maxStart() ? 0 : index + 1;
        render();
      }, 5000);
    };
    ['mouseenter', 'focusin'].forEach(ev => viewport.addEventListener(ev, () => clearInterval(timer)));
    ['mouseleave', 'focusout'].forEach(ev => viewport.addEventListener(ev, restart));
    window.addEventListener('resize', render);
    render(); restart();
  }

  /* 8. Toast al enviar el formulario con exito */
  const status = document.getElementById('form-status');
  if (status) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
    document.body.appendChild(toast);
    const label = toast.querySelector('span');
    let timer;
    new MutationObserver(() => {
      if (/Enviado exitosamente/.test(status.textContent)) {
        label.textContent = '¡Enviado exitosamente!';
        toast.classList.add('is-visible');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('is-visible'), 4500);
      }
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }
})();
