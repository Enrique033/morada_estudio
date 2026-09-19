/* Validación funcional de Morada Estudio con jsdom.
   Comprueba: header sticky, menú móvil (abrir/cerrar/Escape),
   scroll reveal, año dinámico y validación del formulario. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const jsMain = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const jsAudaz = fs.readFileSync(path.join(root, 'js', 'audaz.js'), 'utf8');

let passed = 0, failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name} ${extra}`); }
};

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});

// Polyfill mínimo de IntersectionObserver: revela todo al observar
dom.window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
  unobserve() {} disconnect() {}
};

// Polyfill de matchMedia (jsdom no lo incluye)
dom.window.matchMedia = dom.window.matchMedia || ((query) => ({
  matches: false, media: query,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {},
}));


dom.window.eval(jsMain);
dom.window.eval(jsAudaz);
const { document, window } = dom.window;
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1. Header sticky
  const header = document.getElementById('header');
  ok('header existe', !!header);
  Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
  window.dispatchEvent(new window.Event('scroll'));
  ok('header .is-scrolled con scrollY=100', header.classList.contains('is-scrolled'));

  // 2. Menú móvil: abrir / cerrar / Escape
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  ok('toggle y menú existen', !!toggle && !!menu);
  toggle.click();
  ok('menú abre (aria-expanded=true)', toggle.getAttribute('aria-expanded') === 'true');
  ok('menú abre (clase is-open)', menu.classList.contains('is-open'));
  ok('menú abre (aria-hidden=false)', menu.getAttribute('aria-hidden') === 'false');
  ok('body bloquea scroll al abrir', document.body.style.overflow === 'hidden');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape cierra el menú', !menu.classList.contains('is-open'));
  toggle.click(); // abrir de nuevo
  menu.querySelector('a').click();
  ok('click en enlace cierra el menú', !menu.classList.contains('is-open'));

  // 3. Scroll reveal
  await tick(20);
  const reveals = [...document.querySelectorAll('.reveal')];
  ok('hay elementos .reveal', reveals.length > 0, `(n=${reveals.length})`);
  ok('todos los .reveal visibles', reveals.every(el => el.classList.contains('is-visible')));

  // 4. Año dinámico
  const yearEl = document.getElementById('year');
  ok('año dinámico correcto', yearEl.textContent === String(new Date().getFullYear()), `(valor=${yearEl.textContent})`);

  // 5. Formulario: envío inválido bloqueado
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  ok('formulario existe', !!form);
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  ok('error nombre visible si vacío', !document.getElementById('name-error').hidden);
  ok('error email visible si vacío', !document.getElementById('email-error').hidden);
  ok('error mensaje visible si vacío', !document.getElementById('message-error').hidden);
  ok('status avisa de revisar campos', /Revisa/.test(status.textContent));

  // 6. Formulario: envío válido → loading → éxito
  document.getElementById('name').value = 'Lucía García';
  document.getElementById('email').value = 'lucia@test.com';
  document.getElementById('message').value = 'Quiero reformar mi piso de 90m2 en Barcelona.';
  const submitPromise = (async () => {
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await tick(30);
    const btn = form.querySelector('.form__submit');
    const loadingSeen = btn.classList.contains('is-loading') || btn.disabled;
    ok('botón en estado loading durante envío', loadingSeen);
    await tick(1300);
    ok('mensaje de éxito "Enviado exitosamente"', /Enviado exitosamente/.test(status.textContent), `(status="${status.textContent}")`);
    ok('formulario se resetea tras éxito', document.getElementById('name').value === '');
  })();
  await submitPromise;


  // 7. Audaz: barra progreso + filtros + contadores + toast
  ok('audaz: barra de progreso eliminada', !document.querySelector('.scroll-progress') && !document.getElementById('scroll-progress-bar'));
  const filterBtns = [...document.querySelectorAll('.filter-btn')];
  const projects = [...document.querySelectorAll('.project[data-cat]')];
  ok('audaz: 4 filtros de proyectos', filterBtns.length === 4, `(n=${filterBtns.length})`);
  ok('audaz: 5 proyectos con categoria', projects.length === 5, `(n=${projects.length})`);
  if (filterBtns.length && projects.length) {
    filterBtns.find(b => b.dataset.filter === 'comercial').click();
    const visible = projects.filter(p => !p.classList.contains('is-hidden'));
    ok('audaz: filtro comercial muestra 1', visible.length === 1, `(n=${visible.length})`);
    filterBtns.find(b => b.dataset.filter === 'all').click();
    ok('audaz: filtro todos restaura 5', projects.every(p => !p.classList.contains('is-hidden')));
  }
  ok('audaz: 3 contadores hero', document.querySelectorAll('[data-count]').length === 3);
  ok('audaz: boton back-to-top eliminado', !document.getElementById('to-top'));
  ok('audaz: toast creado tras exito', !!document.querySelector('.toast'));
  ok('audaz: carrusel presente (5 slides)', document.querySelectorAll('.carousel__slide').length === 5, `(n=${document.querySelectorAll('.carousel__slide').length})`);
  ok('audaz: carrusel tiene flechas + dots + contador', !!document.getElementById('carousel-prev') && !!document.getElementById('carousel-next') && document.querySelectorAll('.carousel__dot').length === 5 && !!document.getElementById('carousel-counter'));
  const vp0 = document.getElementById('carousel-viewport');
  ok('audaz: carrusel indice inicial 0', vp0 && vp0.dataset.index === '0', `(index=${vp0 && vp0.dataset.index})`);
  document.getElementById('carousel-next').click();
  ok('audaz: carrusel next avanza a 1', document.getElementById('carousel-viewport').dataset.index === '1');
  document.querySelector('.carousel__dot[data-goto="3"]').click();
  ok('audaz: carrusel dot salta a 3', document.getElementById('carousel-viewport').dataset.index === '3' || document.getElementById('carousel-viewport').dataset.index === '2', `(index=${document.getElementById('carousel-viewport').dataset.index})`);
  ok('fix: proyecto filtrado unico usa layout horizontal', (() => {
    filterBtns.find(b => b.dataset.filter === 'comercial').click();
    const g = document.querySelector('.projects__grid');
    const single = g && g.classList.contains('has-single');
  ok('fix: filtro de contacto eliminado (sin select|null chips|null privacidad)', !document.getElementById('type') && !document.querySelector('.type-chip') && !document.getElementById('type-error') && !document.getElementById('privacy') && !document.getElementById('privacy-error'));
  ok('fix: tarjetas proyecto no navegan (son div seleccionable)', [...document.querySelectorAll('.project[data-cat]')].every(p => p.tagName === 'DIV' && !p.closest('a')));
  ok('fix: clic en tarjeta selecciona y deselecciona las demas', (() => {
    const ps = [...document.querySelectorAll('.project[data-cat]')];
    ps[0].click();
    const a = ps[0].classList.contains('is-selected') && ps[0].getAttribute('aria-pressed') === 'true';
    ps[1].click();
    const b = !ps[0].classList.contains('is-selected') && ps[1].classList.contains('is-selected');
    return a && b;
  })());
  ok('fix: proyectos horizontales con texto al costado', (() => {
    const pr = document.querySelector('.projects__grid .project');
    const d = pr && pr.querySelector('.project__desc');
    return !!d && d.textContent.trim().length > 10;
  })());
    const desc = document.querySelector('.project__desc');
    filterBtns.find(b => b.dataset.filter === 'all').click();
    const restored = g && !g.classList.contains('has-single');
    return single && !!desc && restored;
  })());
  ok('fix: testimonios en carta (quote + estrellas + avatar)', !!document.querySelector('.quote') && !!document.querySelector('.quote__stars') && !!document.querySelector('.quote__avatar'));
  ok('fix: CTA 12 sin corte', !!document.querySelector('.hl.nowrap'));
  ok('fix: boton flotante WhatsApp existe', !!document.querySelector('.float-wa'));
  ok('fix: contacto mejorado (nota + cta)', !!document.querySelector('.contact__note') && !!document.querySelector('.contact__cta'));
  ok('fix: sin Font Awesome externo', !/font-awesome|maxcdn/.test(html));
  ok('fix: footer con iconos sociales interactivos', document.querySelectorAll('.footer__social a.social-btn').length === 3 && document.querySelectorAll('.footer__social a svg').length === 3 && !!document.querySelector('.social-btn--wa') && !!document.querySelector('.social-btn--ig') && !!document.querySelector('.social-btn--li'));
  ok('fix: mensaje del formulario compacto (rows=3)', document.getElementById('message').getAttribute('rows') === '3');
  ok('audaz: sin marquee antiguo', !document.querySelector('.marquee__track'));

  console.log(`\nResultado: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error('ERROR en validacion:', err); process.exit(2); });
