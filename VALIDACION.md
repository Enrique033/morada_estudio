# Validacion y funcionamiento — Morada Estudio (rediseno "Calido Audaz")

Fecha: 2026-09-13 · Servidor local (Python http.server, puerto 8099) + jsdom + estatico.

## 1. Resultado global: APTO — 31 PASS, 0 FAIL

| Bloque | Resultado |
|---|---|
| Base (header, menu, reveal, ano, formulario) | 22/22 PASS |
| Nuevo "Audaz" (progreso, filtros, contadores, top, toast, marquee) | 9/9 PASS |
| Recursos via HTTP 200 | 10/10 OK |
| Integridad HTML | 1x form, 1x h1, 0 ids duplicados, 10/10 img con alt |

## 2. Que cambio en el rediseno (direccion elegida: calido audaz)

- Hero reescrito: titular directo con acento en degradado, sub directo,
  3 badges de confianza y 3 contadores animados (120+, 8, 98%).
- Marquee inclinado color espresso con servicios (pausable en hover).
- Botones pill: primario terracota vivo con sombra y hover que eleva.
- Nav con subrayado degradado + seccion activa al hacer scroll.
- Servicios con barra lateral degradada y zoom en imagen al hover.
- Proceso en tarjetas blancas que se elevan.
- Proyectos: filtros Todos/Residencial/Interiorismo/Comercial,
  tilt 3D, zoom, etiqueta "Ver caso" y CTA "Quiero un proyecto asi".
- CTA band en degradado oscuro con resplandor ambar y boton ambar.
- Contacto: formulario en tarjeta, pasos 1-2-3, boton "Pedir mi presupuesto",
  sello de confianza y toast de confirmacion.
- Footer espresso con CTA de presupuesto + boton volver-arriba.
- Barra de progreso de scroll en degradado de marca.
- Todo respeta prefers-reduced-motion y es solo CSS/JS vanilla nuevo:
  css/audaz.css + css/audaz2.css + js/audaz.js (sin tocar base).

## 3. Pruebas funcionales (jsdom) — 31 PASS, 0 FAIL

Ejecutar con: npm run validate (o node validate.js)

- Base (22): header sticky, menu movil, reveals, ano, form invalido/valido.
- Audaz (9): barra progreso, 4 filtros, 5 proyectos con categoria,
  filtro comercial muestra 1, filtro todos restaura 5,
  3 contadores, back-to-top, toast y marquee.

## 4. Recursos servidos (HTTP 200 reales)

- index.html 200 (29.004 B)
- css/tokens.css, base.css, layout.css, components.css, sections.css 200
- css/audaz.css 200 (5.099 B) · css/audaz2.css 200 (6.651 B)
- js/main.js 200 (9.037 B) · js/audaz.js 200 (5.361 B), sintaxis OK.

## 5. Integridad

- 1 form (lineas 444-494), 1 h1, 0 ids duplicados.
- 10/10 imagenes con alt; hero con fetchpriority high, resto lazy.
- Anclas #servicios #proceso #proyectos #estudio #contacto #main OK.
- Ya no hay href="#" en proyectos (apuntan a #contacto).

## 6. Pendiente no bloqueante

1. Envio de formulario simulado (1,1 s) — conectar Formspree (ver main.js).
2. Sociales y legal sin destino real.
3. Imagenes externas (Unsplash) — considerar propias + width/height.
4. Carpeta ct/ residual.
5. Probar en movil real + Lighthouse.

## 7. Como reproducir

```powershell
cd c:\Users\enriq\OneDrive\Desktop\DEMOS\morada_estudio
npm install
npm run validate   # 31 PASS esperados
python -m http.server 8099
# abrir http://localhost:8099/
```
