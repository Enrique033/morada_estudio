/* ============================================================
   MORADA ESTUDIO · main.js
   Header sticky · Menú móvil · Scroll reveal · Año · Formulario
   Sin dependencias. Vanilla JS.
   ============================================================ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. HEADER STICKY
     Añade .is-scrolled al pasar 24px de scroll.
     El CSS se encarga del fondo + blur + hairline.
     ============================================================ */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     2. MENÚ MÓVIL
     - Abre/cierra con el botón hamburguesa
     - Cierra al hacer click en un enlace
     - Cierra con Escape
     - Focus trap mientras está abierto
     - Bloquea el scroll del body
     ============================================================ */
  const toggle = document.querySelector('.menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  const body   = document.body;

  const openMenu = () => {
    if (!toggle || !menu) return;

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('is-open');
    body.style.overflow = 'hidden';

    const firstLink = menu.querySelector('a');
    if (firstLink) firstLink.focus();
  };

  const closeMenu = (returnFocus = true) => {
    if (!toggle || !menu) return;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    menu.setAttribute('aria-hidden', 'true');
    menu.classList.remove('is-open');
    body.style.overflow = '';

    if (returnFocus) toggle.focus();
  };

  if (toggle && menu) {
    // Abrir / cerrar con el botón
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    // Cerrar al hacer click en un enlace interno
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu(false));
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
      }
    });

    // Focus trap básico
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusables = menu.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ============================================================
     3. SCROLL REVEAL
     IntersectionObserver añade .is-visible a cada .reveal.
     Si no hay soporte o el usuario prefiere movimiento reducido,
     se muestran todos de inmediato.
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.05,
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  /* ============================================================
     4. AÑO DINÁMICO EN EL FOOTER
     ============================================================ */
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ============================================================
     5. FORMULARIO DE CONTACTO
     - Validación accesible por campo
     - Estados: idle · loading · success · error
     - Envío simulado (sustituible por Formspree / Resend)
     ============================================================ */
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (form) {
    const submitBtn  = form.querySelector('.form__submit');
    const submitText = form.querySelector('.form__submit-text');

    // Reglas de validación por campo
    const validators = {
      name:    (v) => v.trim().length >= 2,
      email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: (v) => v.trim().length >= 10,
    };

    const showError = (field, show) => {
      const errorEl = document.getElementById(`${field}-error`);
      const input   = document.getElementById(field);

      if (errorEl) errorEl.hidden = !show;
      if (input) input.setAttribute('aria-invalid', show ? 'true' : 'false');
    };

    const validateField = (field) => {
      const input = document.getElementById(field);
      if (!input) return true;

      const rule = validators[field];
      if (!rule) return true;

      const valid = rule(input.value, input);
      showError(field, !valid);
      return valid;
    };

    // Validación en blur / change
    Object.keys(validators).forEach(field => {
      const input = document.getElementById(field);
      if (!input) return;

      input.addEventListener('blur',   () => validateField(field));
      input.addEventListener('change', () => validateField(field));

      // Si ya había error mostrado, revalidar mientras escribe
      input.addEventListener('input', () => {
        const err = document.getElementById(`${field}-error`);
        if (err && !err.hidden) validateField(field);
      });
    });

    const setStatus = (msg, isError = false) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle('is-error', isError);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar todos los campos
      const fields   = Object.keys(validators);
      const allValid = fields.map(validateField).every(Boolean);

      if (!allValid) {
        // Foco al primer campo inválido
        const firstInvalid = fields.find(field => {
          const input = document.getElementById(field);
          return input && !validators[field](input.value, input);
        });
        if (firstInvalid) document.getElementById(firstInvalid).focus();

        setStatus('Revisa los campos marcados.', true);
        return;
      }

      // Estado: cargando
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Enviando…';
      setStatus('');

      try {
        /* ============================================================
           PUNTO DE INTEGRACIÓN CON BACKEND REAL

           Cuando quieras conectar el formulario de verdad, sustituye
           el bloque de abajo por esto:

           const response = await fetch('https://formspree.io/f/TU_ID', {
             method: 'POST',
             headers: { 'Accept': 'application/json' },
             body: new FormData(form),
           });
           if (!response.ok) throw new Error('Error en el envío');

           ============================================================ */

        // Simulación de envío (1.1s)
        await new Promise(res => setTimeout(res, 1100));

        // Estado: éxito
        form.reset();
        fields.forEach(field => showError(field, false));
        setStatus('Enviado exitosamente.');
      } catch (err) {
        // Estado: error
        setStatus('No hemos podido enviar tu mensaje. Inténtalo de nuevo en unos minutos.', true);
      } finally {
        // Restaurar botón
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Pedir mi presupuesto';
      }
    });
  }
})();