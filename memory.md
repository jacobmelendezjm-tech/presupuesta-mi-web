# Memoria del proyecto · Presupuesta mi web

Qué se ha hecho hasta ahora, cómo está montado y cómo seguir la próxima vez.
Última actualización: **10/11/2026**.

> **⚠ HAY UN REDISEÑO A MEDIAS (10/11/2026). Lee primero el apartado 8, «Trabajo en curso».**
> Se subió a GitHub (y Vercel lo desplegó) el 10/11 **sin terminar de revisar**: puede haber fallos, sobre todo en móvil.

---

## 1. Qué es

Práctica individual del módulo **0613 · Desarrollo web en entorno servidor**:
una API en **Node.js + Express** que valida las características de una web y
calcula su presupuesto con las tarifas del servidor. Como ampliación (para el
10), una interfaz **React** que consume la API.

| Recurso | Enlace |
| ------- | ------ |
| Repositorio | <https://github.com/jacobmelendezjm-tech/presupuesta-mi-web> |
| Web publicada | <https://presupuesta-mi-web.vercel.app> |
| Estado de la API | <https://presupuesta-mi-web.vercel.app/api/estado> |

---

## 2. Reglas que no hay que romper

Vienen del enunciado y de decisiones ya tomadas:

1. **Solo JavaScript.** Nada de TypeScript (el enunciado lo remarca).
2. **Las tarifas y el cálculo viven en el servidor.** El cliente nunca envía ni
   decide un precio. Sin impuestos, descuentos ni conceptos añadidos al total.
3. **El cálculo está separado de la ruta** (`src/calculo.js` no sabe nada de Express).
4. **Las tres rutas obligatorias no se tocan:** `GET /api/estado`,
   `GET /api/tarifas` y `POST /api/presupuesto`.
5. **CSS propio, sin Tailwind** (CSS Modules en la calculadora). Los componentes que se copien de shadcn o
   21st.dev (pensados para Tailwind y TypeScript) se adaptan a JSX + CSS en
   `cliente/src/components/ui/`, sin añadir dependencias.
6. **Estilo visual (nuevo desde el 10/11/2026):** escena oscura con acento verde neón, inspirada en una
   interfaz de referencia de Kawasaki H2R (`videos/referencia-kawasaki.png`) y en un vídeo de una landing
   de moto con cámara 3D (`videos/animacion dinamica .mp4`). Fondo `#0B0B0B` → gris carbón `#3D3D3D` en el
   centro, texto `#F5F5F5`, verde `#00DC0A` (muestreado de la referencia) solo en lo importante, titulares
   en **Saira** (variable: ancho y peso) y texto en **Inter**. Los tokens están en `:root` de `index.css`.
   (El estilo anterior, corporativo en claro con azul `#2563EB`, queda sustituido.)
7. **Commits solo a tu nombre**, sin coautores.
8. **No subir** `node_modules`, `public/` de la raíz (se genera al compilar), `.env` ni credenciales.
9. **Tras cada cambio:** actualizar este archivo y el README, hacer commit y push
   a `main`. Vercel despliega solo. Hay un hook Stop en `.claude/settings.json`
   que lo recuerda (esa carpeta no se sube: es configuración de este equipo).

---

## 3. Lo que está hecho

### API (núcleo de la práctica)

- Las tres rutas obligatorias con validación completa (400 con `campos` y
  `detalles`), 404 en JSON y 500 para fallos inesperados.
- Los 9 casos obligatorios y 7 adicionales documentados en el README.
- 21 pruebas automáticas con `npm test` (todas pasan).
- **Ampliación:** `GET /api/mantenimiento` con tres planes mensuales
  (Básico 29 €, Profesional 59 €, Premium 99 €). Están en
  `src/mantenimiento.js` y **no se suman nunca** al presupuesto (hay una prueba
  que lo comprueba).

### Interfaz React (ampliación CE 7.7)

Landing que funciona como calculadora. Secciones, en orden:

| Sección | Qué hace |
| ------- | -------- |
| Cabecera | Logo JM, Metodología, Servicios, Preguntas frecuentes y «Estimación» en directo |
| Entrada | `EntradaPortal.jsx` + `ui/glyph-portal.jsx`: la palabra PRESUPUESTA se abre al hacer scroll y deja ver el titular |
| Calculadora | `components/calculadora/`: 4 pasos, resumen lateral fijo y CTA de PDF |
| Asistente IA | Propuesta con OpenAI, revisión y PDF |
| Servicios | Tarifas de `GET /api/tarifas` |
| Packs | `pricing.jsx`: su precio lo pide a `POST /api/presupuesto`; «Elegir» los carga en la calculadora |
| Mantenimiento | `planes-mantenimiento.jsx`, compartido con el paso 4; es mensual y no suma al total |
| Metodología y Preguntas | Tres pasos, última petición al servidor y preguntas frecuentes |

Otros detalles:

- **Calculadora:** `useCalculator.js` solo guarda qué se ha elegido; el importe viene de
  `POST /api/estimacion` (`src/estimacion.js`). Landing y corporativa reutilizan
  `calcularPresupuesto`, así que coinciden con la ruta obligatoria.
- **Precios provisionales:** e-commerce, SaaS, diseño, CMS, CRM, SEO, autenticación,
  urgencia y soporte son inventados; se cambian arriba en `src/estimacion.js`.
- **Portal:** copia del componente Glyph Portal (MIT, © Christian Katzmann; conservar el
  aviso), pasado a JSX y traducido. Mide la letra al montarse: la fuente debe estar
  cargada antes, de eso se encarga `EntradaPortal.jsx`.
- **Sin modo claro/oscuro:** se quitó el botón de tema.
- **Responsive y navegadores:** ver el apartado 6.

### Asistente con IA y PDF (Presupuesta mi Web 2)

Flujo en la sección «Cuéntanos tu proyecto» (`asistente-ia.jsx`): descripción →
propuesta de OpenAI → revisión (aceptar, eliminar, añadir, completar datos) →
vista previa → PDF. Rutas nuevas: `GET /api/catalogo`, `POST /api/propuesta`,
`POST /api/propuesta/documento` y `POST /api/propuesta/pdf`.

- Modelo por defecto: `gpt-5.4-mini` (Responses API con JSON Schema estricto).
- La clave está en `.env` en local y debe estar en Vercel como `OPENAI_API_KEY`.
- PDF con **PDFKit** en el servidor y la identidad de la web: logo JM, Inter,
  cabecera azul noche, acento azul y escala sobria en el desglose. Las fuentes están en
  `src/assets/fuentes/` (licencia OFL). `src/pdf.js` cita cada ruta entera a propósito:
  si se construyen con variables, Vercel no las empaqueta y el PDF falla solo en producción.
- Camarón: `cliente/public/camaron.png` (web) y `src/assets/camaron.png` (PDF).
- 45 pruebas con `npm test`; OpenAI se simula en `test/propuesta.test.js`.

### Historial de cambios importantes

| Fecha | Cambio |
| ----- | ------ |
| 19/10/2026 | API, pruebas, README y despliegue en Vercel |
| 20/10/2026 | Se quitó del historial de GitHub la línea de coautoría de los commits |
| 20/10/2026 | Rediseño como landing estilo Apple con calculadora |
| 20/10/2026 | Logo JM, hero nuevo, modo nocturno, packs y planes de mantenimiento |
| 20/10/2026 | Navegación en isla de cristal y revisión responsive y de navegadores |
| 09/11/2026 | Asistente con OpenAI, revisión de servicios, presupuesto en PDF y Camarón |
| 09/11/2026 | El fundido del hero termina en `--fondo`, el color del asistente (se notaba el corte) |
| 09/11/2026 | Planes de mantenimiento seleccionables y fundido entre todas las secciones y el pie |
| 09/11/2026 | Se probó un rediseño HUD estilo Stark Tech y se descartó por no gustar (revertido; el código sigue en el commit `e942576`) |
| 09/11/2026 | Se probaron una web 3D con Three.js y otra Stark con React Three Fiber; ambas se descartaron sin llegar a publicarse |
| 09/11/2026 | Calculadora corporativa de 4 pasos, `POST /api/estimacion`, portal de entrada y PDF con Inter e identidad sobria |
| 10/11/2026 | **Publicado sin revisar del todo:** rediseño oscuro/verde y vista previa 3D en directo de la web que configura el cliente (ver apartado 8) |

---

## 4. Cómo trabajar con el proyecto

### Requisitos

Node.js 18 o superior (probado con 25) y npm.

### Arrancar en local

```bash
npm install                 # dependencias de la API
npm run build               # instala y compila la interfaz en public/
npm start                   # API + interfaz en http://localhost:3000
```

Para desarrollar la interfaz con recarga automática, en dos terminales:

```bash
npm run dev                 # terminal 1: API en el puerto 3000 (se reinicia sola)
cd cliente && npm run dev   # terminal 2: interfaz en http://localhost:5173
```

### Probar

```bash
npm test                    # 45 pruebas automáticas
npm run pruebas             # los casos contra la API en marcha
```

### Publicar

Vercel está conectado al repositorio: **cada `git push` a `main` vuelve a
desplegar la web** en un par de minutos. No hace falta hacer nada en Vercel.

```bash
git add -A
git commit -m "Describe el cambio"
git push
```

---

## 5. Mapa de archivos

```
src/app.js                  rutas de Express
src/tarifas.js              tarifas (constantes congeladas)
src/validacion.js           validarSolicitud()
src/calculo.js              calcularPresupuesto()
src/mantenimiento.js        planes de mantenimiento (ampliación)
src/estimacion.js           catálogo y cálculo de la calculadora por pasos
src/routes/estimacion.js    rutas de la calculadora
src/routes/propuesta.js     rutas del asistente (equivale a un route.ts de Next.js)
src/catalogo.js             servicios que la IA puede proponer
src/openai.js               llamada a OpenAI e instrucciones del modelo
src/propuesta.js            validación de la IA y de la selección; documento final
src/pdf.js                  generación del PDF con PDFKit
test/                       pruebas automáticas (api, propuesta y estimacion)
pruebas/                    casos y script de pruebas contra la API en marcha
cliente/index.html          metadatos y fuentes
cliente/src/App.jsx         página completa (estado, peticiones y secciones)
cliente/src/index.css       estilos globales y tokens de color
cliente/src/components/calculadora/  useCalculator, Calculadora y su CSS Module
cliente/src/components/EntradaPortal.jsx  entrada de la web
cliente/src/components/ui/  glyph-portal, pricing, planes-mantenimiento, asistente-ia
vercel.json                 compila la interfaz al desplegar
```

Los colores se cambian en los tokens de `:root`, al principio de `index.css`.

---

## 6. Responsive y compatibilidad

Comprobado en Chrome de 320 a 1366 px de ancho, sin desbordes. La calculadora pasa a
una columna por debajo de 1000 px y el portal respeta `prefers-reduced-motion`.
Falta probarlo en Safari y Firefox.

---

## 7. Pendiente y próximos pasos

### Mejoras pendientes de una revisión anterior

- El indicador «API en línea» y las tarifas solo se piden al cargar la página.
- Algunos grises pequeños tienen poco contraste.

### Ideas para seguir

1. **Guardar presupuestos** (siguiente paso que propone la sesión 0613):
   Supabase + PostgreSQL, con `POST /api/presupuestos` para guardar y
   `GET /api/presupuestos/:id` para recuperar.
2. Pasar a **Next.js**, que es la arquitectura del curso.
3. Confirmar o cambiar los precios y el contenido de los packs, de los planes
   de mantenimiento y de los servicios provisionales de `src/estimacion.js` (son inventados).

---

## 8. Trabajo en curso (10/11/2026): rediseño oscuro/verde con vista previa 3D

### Qué pidió el usuario

Aplicar la **estética y la distribución** de la interfaz de referencia (`videos/referencia-kawasaki.png`) a toda
la web, y que **mientras el cliente marca opciones en la calculadora, su web se vaya construyendo en una
maqueta 3D** (skeletons, spinners y cámara que cambia de ángulo, como en `videos/animacion dinamica .mp4`).
Dinámico, interactivo y reactivo.

### Decisiones tomadas

- **El producto es la web del cliente:** una maqueta 3D (ventana de navegador con capas) ocupa el lugar
  de la moto de la referencia. Cada opción del catálogo añade un módulo visible: formulario, CMS, idioma
  «EN», pagos, SEO, login, chat de soporte, luz ámbar si es urgente, anillo si hay mantenimiento, una hoja
  por página…
- **3D con CSS** (`perspective` + `preserve-3d`) sobre DOM real. **Sin three.js ni dependencias nuevas.**
- El servidor sigue calculando todo. La maqueta solo muestra precios de catálogo («+80 €»).
- **La especificación completa está en [`REDISENO.md`](REDISENO.md)**: tokens, contratos entre
  componentes, cámara por paso, tabla «opción → módulo 3D» y maquetación. Sus rutas `<SP>/referencias/…`
  eran temporales: la imagen está ahora en `videos/referencia-kawasaki.png`.

### Estado de cada parte (lo hicieron 4 agentes; se pararon antes de terminar su revisión)

| Parte | Archivos | Estado |
| ----- | -------- | ------ |
| Base compartida | `cliente/index.html` (fuentes Saira + Inter), `index.css` **por encima** del marcador `FIN DE LA BASE COMPARTIDA` (tokens y clases `.etiqueta`, `.titular`, `.fantasma`, `.boton`, `.boton-contorno`, `.boton-texto`, `.pildora`, `.spinner`, `.skeleton`, `.punto-vivo`, `.specs`), `ui/numero-animado.jsx`, `ui/use-estado-minimo.js` | Hecha |
| Escena 3D | `components/escena/` (`VistaWeb3D`, `Maquetas`, `Modulos`, `piezas`, `usePresencia`, `useEscena`, `useDemo` y sus CSS) + laboratorio `cliente/laboratorio.html` y `src/laboratorio.jsx` | Escrita y funcionando en escritorio; **falta revisarla** |
| Configurador | `calculadora/` (`Calculadora`, `Pasos`, `Resumen` y sus CSS, `formato.js`, `use-movimiento-reducido.js`, `useCalculator.js` con el nuevo `calculando`) | Funciona en escritorio; **falta revisarlo** |
| Tema | `App.jsx`, `components/layout/` (`Cabecera`, `Pie`, `LogoJM`, `useSeccionActiva`), `EntradaPortal.jsx`, `index.css` por debajo del marcador | Escrito; **falta revisarlo** |
| Secciones | `ui/asistente-ia`, `ui/pricing`, `ui/planes-mantenimiento` (jsx + css) | Escrito; **falta revisarlo** |

Comprobado el 10/11: `npx vite build` compila sin errores. El servidor (`src/`) no se ha tocado.

### Pendiente, en orden

1. **Revisar en el navegador** (`npm run dev` en la raíz + `cd cliente && npm run dev`) a 1440, 1024, 390 y
   320 px, y con «reducir movimiento». Que cada opción se vea en la maqueta, que no haya errores de consola
   y que no haya scroll horizontal. Revisar también el portal y el hero, la cabecera en móvil (menú
   hamburguesa), el asistente, los packs, el mantenimiento y el pie.
2. **Unificar** los dos hooks de «reducir movimiento» (`escena/useEscena.js` y `calculadora/use-movimiento-reducido.js`).
3. **Quitar los alias temporales** `--azul`, `--azul-hover`, `--enlace` y `--fondo-claro` del `:root` de
   `index.css`. Antes, comprobar con una búsqueda que nadie los usa.
4. **Borrar el laboratorio** (`cliente/laboratorio.html` y `cliente/src/laboratorio.jsx`). No entra en el
   build, pero sobra en el repositorio.
5. **README:** cambiar «estilo corporativo sobrio» por el estilo nuevo y explicar la vista previa 3D.
6. `REDISENO.md` ya está subido (documentación del rediseño). Al terminar, actualizar la tabla de historial.
7. **Publicar las correcciones:** `npm test` (45 pruebas), `npm run build`, commit y `git push`. Vercel despliega solo.

### Git (importante)

- La carpeta se descargó como ZIP. El 10/11 se convirtió en repositorio git sin tocar archivos
  (`git init` + `git fetch` + `git reset --mixed origin/main`). Ya sigue a `origin/main` desde el commit
  `b2395af`, así que `git status` muestra solo los cambios del rediseño.
- Identidad configurada en este repositorio: `jacobmelendezjm-tech <jacobmelendez.jm@gmail.com>`.
  Los commits van **sin coautores**.
- `videos/` está excluida en `.git/info/exclude`: el vídeo, la imagen de referencia y el arnés **no se suben**.
- El push usa el Git Credential Manager de Windows: puede abrir una ventana para iniciar sesión en GitHub.

### Herramienta de capturas (opcional)

`videos/arnes-capturas.js` hace capturas con Chrome sin cabeza a partir de un plan JSON (formato en
`REDISENO.md` §9). Necesita `playwright-core`: instálalo en una carpeta aparte
(`npm i playwright-core@1.49.1`) y ejecuta `node arnes-capturas.js plan.json` desde allí.
