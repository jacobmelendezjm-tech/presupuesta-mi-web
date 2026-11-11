# SPEC · Rediseño «escena oscura + verde neón» y vista previa 3D reactiva

> **Nota de vigencia (11/11/2026):** esta especificación documenta la etapa visual oscura publicada el 10/11.
> La dirección visual actual alterna entre claro (marfil/grises cálidos) y oscuro (grafito), con Cormorant Garamond/Inter,
> superficies translúcidas y una píldora de tema persistente. La nueva referencia y el estado están en `memory.md`; los contratos funcionales del
> configurador y de la escena 3D que se describen aquí siguen vigentes.

Proyecto: `c:/Users/Alumno/Desktop/presupuesta-mi-web-main` (API Express en la raíz `src/`, cliente React 19 + Vite 8 en `cliente/`).
Scratchpad compartido: `C:/Users/Alumno/AppData/Local/Temp/claude/29c899574c8b948e/aa29fa90-3206-4e09-bc4a-841d20954825/scratchpad` (en adelante `<SP>`).

Petición del usuario (literal): «quiero que veas esta interfaz, lo que me interesa es que te enfoques en la estética y la
distribución de elementos; como la aplicación es una calculadora de presupuestos, quiero que el cliente, conforme va
modificando y marcando lo que quiere en su página web, se vaya mostrando y marcando como skeletons, spins y un render 3D
inmersivo de página web como el vídeo de ejemplo. Quiero que sea dinámico, interactivo y reactivo.»

---------------------------------------------------------------------------------------------------------------------

## 0. Reglas duras (no negociables)

1. **Solo JavaScript/JSX.** Nada de TypeScript.
2. **Sin dependencias nuevas.** Ni three.js, ni R3F, ni framer-motion, ni librerías de UI. El 3D se hace con **CSS 3D**
   (`perspective`, `transform-style: preserve-3d`, `translateZ`, `rotateX/Y/Z`) sobre DOM real. Animación con CSS y, si hace
   falta, `requestAnimationFrame` escribiendo variables CSS directamente en el DOM (nunca `setState` por fotograma).
3. **CSS propio, sin Tailwind.** Componentes nuevos con **CSS Modules** (`*.module.css`), como la calculadora.
4. **El navegador nunca calcula importes.** El total y el desglose llegan de `POST /api/estimacion` (vía `useCalculator`).
   Sí se puede mostrar el precio de catálogo de una opción («+80 €»): lo publica el servidor en `GET /api/estimacion/catalogo`.
5. **No tocar el servidor** (`src/`), ni `test/`, ni `pruebas/`, ni `package.json` de la raíz.
6. Textos de interfaz en **español de España**; nombres de variables, clases y comentarios en español como el resto del código.
   Comentarios breves y útiles (el código lo lee un alumno y su profesor).
7. **No ejecutes `vite build` ni `npm run build`**: escriben en `../public`, que comparte todo el equipo. Verifica con el
   servidor de desarrollo compartido (§9).
8. Respeta `prefers-reduced-motion` (sin cámara animada, sin inclinación con el ratón, sin brillos en bucle).
9. Accesibilidad: foco visible (verde), contraste AA, `aria-*` correctos, todos los botones con texto o `aria-label`,
   la escena 3D es decorativa para lectores de pantalla (`role="img"` + `aria-label` con el resumen; interior `aria-hidden`).
10. Responsive de **320 px a 1920 px** sin scroll horizontal. Táctil: objetivos ≥ 44 px.
11. Solo edita **tus** archivos (§4). Si necesitas algo de otro archivo, no lo edites: dilo en tu respuesta final.

---------------------------------------------------------------------------------------------------------------------

## 1. Referencias visuales (míralas con la herramienta Read, son imágenes)

- `<SP>/referencias/kawasaki-horizontal.png` → la interfaz que manda el usuario (ya girada a horizontal).
- `<SP>/referencias/video-escena-1.png`, `video-escena-2.png`, `video-transicion.png`, `video-escena-3.png`,
  `video-hoja-1.png`, `video-hoja-2.png` → fotogramas del vídeo de ejemplo (landing de una moto con cámara 3D por secciones).

Qué tomamos de la imagen (distribución):
- Cabecera: logo a la izquierda · navegación centrada en MAYÚSCULAS espaciadas, el activo en blanco con **barra verde debajo**
  · **píldora con borde verde** (buscador) a la derecha · icono hamburguesa de tres líneas.
- Izquierda (~60 %): **el producto enorme**, con **tipografía fantasma gigante** detrás (gris muy tenue en degradado) y un
  «eco» difuminado del producto detrás.
- Derecha (~40 %): número fantasma gigante («2023») detrás del bloque · marca pequeña · **título pesado, ancho y verde**
  («H2 R») · párrafos grises · **botón verde sólido rectangular** («BOOK A TESTRIDE»).
- Abajo a la izquierda: **fila de especificaciones**: valor blanco condensado en negrita («998 CC») + etiqueta verde pequeña en
  mayúsculas («CAPACITY»).
- Abajo a la derecha: **caja de borde fino** con el copyright + icono. Semicírculo verde con chevron (volver arriba).
- Fondo: centro gris carbón iluminado (#424242) que cae a negro (#050505) en las esquinas. Un único acento: **verde neón**.

Qué tomamos del vídeo (movimiento):
- Cada sección **mueve la cámara alrededor del producto** (otro ángulo), con **desenfoque** breve durante el movimiento.
- La **luz cambia de color** entre escenas (azul → naranja): nosotros, verde → ámbar con «Despliegue urgente».
- Textos que entran/salen con fundido y desplazamiento; **paginación vertical de puntos** a la izquierda; specs a la derecha.
- La tipografía fantasma gigante se **desliza** en horizontal al cambiar de escena.

**Traducción a nuestro producto: EL PRODUCTO ES LA WEB DEL CLIENTE.** Una maqueta 3D de su web (ventana de navegador con
capas) ocupa el lugar de la moto. Se va **construyendo** con cada elección: aparece primero como **skeleton** con brillo y un
**spinner** («construyendo…»), luego se **materializa** y queda **marcada** con un destello verde. La cámara cambia de ángulo
en cada paso del configurador.

---------------------------------------------------------------------------------------------------------------------

## 2. Base compartida (YA ESCRITA por el coordinador en `cliente/src/index.css`, por encima del marcador)

No modifiques nada por encima de `/* ===== FIN DE LA BASE COMPARTIDA ===== */`. Úsala.

### Tokens
```
--fondo #0b0b0b · --fondo-2 #111111 · --superficie #161616 · --superficie-2 #1e1e1e · --superficie-3 #262626
--borde rgba(255,255,255,.09) · --borde-fuerte rgba(255,255,255,.18)
--texto #f5f5f5 · --texto-2 #a6a6a6 · --texto-3 #8a8a8a · --texto-sobre-verde #021703
--verde #00dc0a · --verde-claro #45f04e · --verde-oscuro #00a307
--verde-suave rgba(0,220,10,.10) · --verde-borde rgba(0,220,10,.45) · --verde-brillo rgba(0,220,10,.35)
--ambar #ffb020 · --rojo #ff6b6b · --fondo-error rgba(255,107,107,.10)
--luz (luz de escena; por defecto = --verde)
--fuente (Inter) · --display (Saira, variable: font-stretch 50%–125%, font-weight 100–900) · --mono
--radio 10px · --radio-grande 18px · --radio-pildora 999px
--ancho 980px · --ancho-amplio 1240px · --ancho-escena 1600px
--alto-nav 72px · --hueco-nav (alto-nav + safe-area)
--curva cubic-bezier(.22,.7,.2,1) · --curva-camara cubic-bezier(.65,0,.2,1)
--sombra 0 24px 60px -24px rgba(0,0,0,.8)
--degradado-escena (radial: #3d3d3d en el centro → #050505 en las esquinas)
```

### Clases globales disponibles
| Clase | Qué es |
| --- | --- |
| `.etiqueta` | Antetítulo: Saira 700 condensada, 12px, `.2em`, MAYÚSCULAS, verde |
| `.titular` | Titular de sección: Saira 800, MAYÚSCULAS, `clamp(40px, 6vw, 84px)`, interlineado .92 |
| `.titular-paso` | Titular más pequeño: `clamp(32px, 3.6vw, 52px)` |
| `.verde` / `.gris` | Color verde / gris secundario (para partes de un titular) |
| `.entradilla` | Párrafo de apoyo gris, 16-17px, máx. 62ch |
| `.fantasma` | Tipografía fantasma gigante (relleno degradado blanco 9 % → 0 %). Ponla en un elemento `aria-hidden`, con `position:absolute` y `font-size` propios |
| `.boton` | CTA verde sólido, texto oscuro, Saira 700 MAYÚSCULAS, radio 8px. Modificadores `.boton-grande`, `.boton-pequeno` |
| `.boton-contorno` | Píldora con borde verde y texto blanco (secundario) |
| `.boton-texto` | Botón sin fondo, MAYÚSCULAS grises → blancas al pasar |
| `.enlace` | Enlace verde |
| `.pildora` | Campo de texto en píldora con borde verde (como el buscador de la referencia) |
| `.spinner` | Anillo que gira; tamaño con `--tam` (por defecto 16px) |
| `.skeleton` | Bloque gris con brillo que barre (shimmer) |
| `.punto-vivo` | Punto verde con pulso (indicador «en vivo») |
| `.specs` + `.spec` + `.spec-valor` + `.spec-etiqueta` | Fila de especificaciones estilo referencia |
| `.oculto` | Solo para lectores de pantalla |
| `.texto-suave` / `.texto-error` | Texto secundario / error |
| `@keyframes girar, brillo, latido, aparecer, subir` | Animaciones base |

### Utilidades JS ya escritas
- `cliente/src/components/ui/numero-animado.jsx` → `export function NumeroAnimado({ valor, formato, duracion = 600, className })`
  Número que se desliza suavemente al nuevo valor (respeta reducir movimiento). `valor == null` → «—».
- `cliente/src/components/ui/use-estado-minimo.js` → `export function useEstadoMinimo(activo, minimo = 450)`
  Devuelve `true` mientras `activo` y lo mantiene al menos `minimo` ms (para que un spinner no parpadee).

---------------------------------------------------------------------------------------------------------------------

## 3. Tipografía y ritmo

- Display **Saira** (`var(--display)`): titulares 800–900, `font-stretch: 100%–112%` (ancha, como «H2 R»); nav, specs y
  etiquetas 600–700 con `font-stretch: 78%–88%` (condensada, como «14.000 RPM»). Itálica solo como detalle (opcional).
- Texto **Inter** (`var(--fuente)`): 15–16px cuerpo, 13–14px detalle.
- Mucho aire, bordes de 1px muy tenues, nada de sombras blancas. Superficies = negro con 3–6 % de blanco.
- El verde es escaso: si todo es verde, nada destaca.

---------------------------------------------------------------------------------------------------------------------

## 4. Propietarios de archivos (cada agente edita SOLO los suyos)

| Agente | Archivos |
| --- | --- |
| **escena3d** | `cliente/src/components/escena/VistaWeb3D.jsx`, `cliente/src/components/escena/VistaWeb3D.module.css`, cualquier archivo nuevo dentro de `cliente/src/components/escena/`, y el laboratorio `cliente/laboratorio.html` + `cliente/src/laboratorio.jsx` (solo para probar; el coordinador lo borrará al final) |
| **configurador** | `cliente/src/components/calculadora/Calculadora.jsx`, `Calculadora.module.css`, `useCalculator.js` (y archivos nuevos dentro de `calculadora/`) |
| **tema** | `cliente/src/App.jsx`, `cliente/src/index.css` (SOLO por debajo del marcador), `cliente/src/components/EntradaPortal.jsx`, archivos nuevos de layout en `cliente/src/components/layout/` si los necesitas |
| **secciones** | `cliente/src/components/ui/pricing.css`, `pricing.jsx`, `planes-mantenimiento.css`, `planes-mantenimiento.jsx`, `asistente-ia.css`, `asistente-ia.jsx` (en los JSX solo cambios mínimos de marcado/clases; no cambies su lógica ni sus llamadas a la API) |
| coordinador | `index.html`, base de `index.css`, `main.jsx`, `glyph-portal.jsx`, `numero-animado.jsx`, `use-estado-minimo.js`, `memory.md`, `README.md` |

---------------------------------------------------------------------------------------------------------------------

## 5. Contratos entre componentes (respétalos al pie de la letra)

### 5.1 `useCalculator()` (agente configurador) — añade:
- `calculando: boolean` → `true` desde que cambia la selección (incluido el debounce) hasta que llega la respuesta (o error)
  de `POST /api/estimacion`. `false` si no hay tipo. No rompas nada de lo que ya devuelve (lo usan `App.jsx` y los packs).
- (Opcional) `ultimoCambio: { id, accion: "anadir" | "quitar" | "cambiar", marca: number } | null`.

### 5.2 `<VistaWeb3D />` (agente escena3d) — `import { VistaWeb3D } from "./components/escena/VistaWeb3D.jsx"`
```
<VistaWeb3D
  tipo={"landing" | "corporativa" | "ecommerce" | "saas" | null}
  paginas={number}            // 1–20 (solo cuenta en landing/corporativa)
  opciones={string[]}         // ids de opción del catálogo (ver §6.3)
  plan={{ id, nombre, precioMensual } | null}   // plan de mantenimiento
  paso={1 | 2 | 3 | 4}        // preset de cámara
  calculando={boolean}        // el servidor está recalculando
  catalogo={objeto de GET /api/estimacion/catalogo | null}  // nombres y precios para las etiquetas «+80 €»
  demo={boolean}              // portada: se configura sola en bucle y la cámara orbita; ignora el resto de props
  className={string}
/>
```
- Ocupa el 100 % de ancho y alto de su contenedor (el padre le da la altura). Dentro dibuja: fondo de escena, tipografía
  fantasma, la maqueta 3D, el suelo/reflejo y un HUD mínimo (estado «construyendo / sincronizado»).
- NO dibuja la fila de specs ni la paginación de pasos: eso es del configurador.
- Exporta también `export const NOMBRES_TIPO = { landing: "LANDING", corporativa: "CORPORATIVA", ecommerce: "E-COMMERCE", saas: "SAAS" }` (útil para otros).

### 5.3 Ids del catálogo (de `src/estimacion.js`, ya en el servidor)
- Tipos: `landing` (300 €), `corporativa` (600 €), `ecommerce` (1.800 €), `saas` (3.500 €).
- Diseño (elección única, grupo `diseno`): `plantilla`, `uiCustom`, `inmersivo`.
- Contenido (grupo `contenido`): `redaccion`.
- Funciones (grupo `funcion`): `formulario`, `cms`, `segundoIdioma`, `crmPagos`, `seo`, `autenticacion`.
- Plazo (grupo `plazo`): `urgente`, `soporte` (soporte es mensual: `periodo: "mes"`).
- Planes: `basico` (29 €/mes), `profesional` (59 €/mes, recomendado), `premium` (99 €/mes).
- `catalogo = { moneda, paginasMax: 20, tipos: [...], opciones: [{ id, grupo, nombre, descripcion, precio, periodo? }], planes: [...] }`

---------------------------------------------------------------------------------------------------------------------

## 6. Escena 3D (`VistaWeb3D`) — la pieza central

### 6.1 Estructura (de fuera a dentro)
```
.escena            (2D, container-type: size; fondo --degradado-escena + foco de --luz; overflow: hidden)
 ├─ .fantasma      (texto gigante detrás: nombre del tipo o «TU WEB»; se desliza al cambiar de tipo)
 ├─ .foco          (radial difuso de color --luz detrás de la maqueta)
 ├─ .camara        (perspective + preset del paso; transición 1.2–1.4 s con --curva-camara)
 │   └─ .inclinacion  (inclinación con el puntero; la escribe un rAF con lerp, sin transición)
 │       └─ .modelo   (preserve-3d)
 │           ├─ páginas extra apiladas detrás (translateZ negativo), «gemela EN» para multidioma
 │           ├─ .ventana   (marco de navegador: barra con 3 puntos + URL; página con bloques en capas Z)
 │           ├─ capas flotantes delante (login, pago, SERP SEO, barra CMS, chat, insignia urgente)
 │           └─ anillo/plataforma de mantenimiento (debajo)
 ├─ .suelo         (reflejo elíptico difuminado bajo la maqueta, color --luz)
 └─ .hud           (2D: «● VISTA PREVIA EN VIVO» · estado «CONSTRUYENDO FORMULARIO… / ✓ SINCRONIZADO»)
```

**Trampas de CSS 3D (léelas):** `overflow` distinto de visible/clip, `opacity < 1`, `filter`, `clip-path`, `mask`,
`isolation: isolate`, `mix-blend-mode` y `backdrop-filter` **aplanan** `preserve-3d`. No los pongas en `.camara`,
`.inclinacion`, `.modelo` ni en ningún contenedor que tenga hijos en Z: aplícalos solo a hojas (elementos sin hijos 3D).
Las esquinas redondeadas de la ventana se dibujan en una capa de fondo propia, no con `overflow:hidden` en el contenedor 3D.
No uses `container-type` en elementos con `preserve-3d`: ponlo en `.escena` (2D) y escala la maqueta con `cqw/cqh` o con
`font-size` en la ventana y unidades `em` dentro.

### 6.2 Cámara por paso (valores orientativos; ajústalos a ojo con capturas)
| Paso | rotateX | rotateY | rotateZ | escala | separación Z de capas | intención |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Tipo | 10° | −22° | 2° | 0.92 | baja | plano 3/4 frontal, «presentación del producto» |
| 2 Alcance | 16° | −38° | 4° | 0.90 | alta (despiece) | se abren las capas y las páginas apiladas se ven en abanico |
| 3 Funciones | 8° | +24° | −2° | 0.96 | media-alta | la cámara gira al otro lado; los módulos salen hacia delante |
| 4 Plazos | 30° | −14° | 6° | 0.88 | media | vista desde arriba: se ve el anillo de mantenimiento |
| demo | órbita lenta ±18° en Y (12 s) | | | | media | portada |

Durante el cambio de paso: desenfoque breve (blur 0→4px→0 en ~700 ms) **solo** en `.fantasma` y `.foco` (hojas 2D), y un
ligero «dolly» de escala. Con reducir movimiento: cambio instantáneo, sin inclinación, sin blur.

Inclinación con el puntero (solo `pointer: fine`): ±7° en Y y ±5° en X según la posición dentro de `.escena`; lerp ~0.08 por
fotograma; al salir vuelve a 0; el rAF se detiene cuando converge y cuando la escena no es visible (IntersectionObserver).

### 6.3 Cada elección = un módulo visible en la maqueta
| Selección | Qué aparece en la maqueta 3D |
| --- | --- |
| sin tipo | Ventana vacía en alambre (bloques con borde discontinuo) + aviso central «ELIGE UN TIPO DE PROYECTO» con un «+» que late. Fantasma «TU WEB» |
| `landing` | Una página larga: nav (logo + 2 enlaces + botón), hero (titular 2 líneas + subtítulo + CTA + imagen), 3 tarjetas de ventajas, banda CTA. URL `tuweb.es` |
| `corporativa` | Nav con **tantos enlaces como páginas** (máx. 6 visibles), hero con imagen, rejilla de 3 servicios, fila de equipo (avatares), pie. URL `tuempresa.es/servicios` |
| `ecommerce` | Nav con buscador y carrito (insignia con número), banner de oferta, rejilla de 4 productos (imagen + nombre + precio), cajón «Carrito» flotando delante. URL `tutienda.es/catalogo` |
| `saas` | App: barra lateral de iconos, barra superior con buscador y avatar, 3 KPI, gráfica de barras que crece, tabla. URL `app.tuproducto.io/panel` |
| `paginas` (landing/corp.) | Hojas apiladas detrás de la ventana, una por página adicional (máx. 7 visibles + chapa «+N»). Al cambiar el número, la hoja nueva entra/sale animada. Con paso 2 se abren en abanico |
| diseño: ninguno | Bloques en alambre (borde discontinuo, sin relleno) |
| `plantilla` | Bloques planos grises uniformes (aspecto de plantilla) |
| `uiCustom` | Acentos a medida: degradado verde en el hero, radios variados, barras de acento verdes, botones verdes |
| `inmersivo` | Lo de UI Custom + **objeto 3D** en el hero (cubo/prisma CSS girando con aristas verdes) + más separación Z + brillo |
| `redaccion` | Las barras-skeleton de texto se convierten en **texto real** («Tu proyecto, a otro nivel», «Servicios», «Contacto», «Empezar»…) con fundido |
| `formulario` | Sección de contacto en la página (2 campos + área + botón «Enviar»); en ecommerce/saas, tarjeta flotante |
| `cms` | Barra de editor flotando sobre la página (iconos lápiz/imagen/texto + «Editar») y contornos discontinuos de edición en titulares |
| `segundoIdioma` | Selector «ES · EN» en el nav + **hoja gemela «EN»** detrás, desplazada a la derecha |
| `crmPagos` | Tarjeta de pago flotante (chip, •••• 4242, botón «Pagar») + nodo CRM unido con línea discontinua animada |
| `seo` | Tarjeta flotante de resultado de buscador (barra de búsqueda, título verde, URL, 2 líneas) + anillo «SEO 98» |
| `autenticacion` | Modal de acceso flotando delante (avatar, 2 campos, «Entrar») + avatar de usuario en el nav |
| `urgente` | **La luz de escena pasa a ámbar** (`--luz: var(--ambar)`) + estelas de velocidad detrás + insignia «⚡ ENTREGA PRIORITARIA» |
| `soporte` | Burbuja de chat en la esquina inferior derecha de la página («¿En qué te ayudo?») |
| plan de mantenimiento | **Anillo de protección** que orbita la base de la maqueta (1/2/3 puntos de luz según básico/profesional/premium) + escudo con el nombre del plan |

### 6.4 Ciclo de vida de cada módulo (skeletons + spinners + marcado)
- **construyendo** (~900 ms al añadirse): skeleton con brillo, contorno verde discontinuo, mini spinner en una esquina y, si hay
  catálogo, una etiqueta flotante con el precio de catálogo («+80 €», «+49 €/mes») que sube y se desvanece en ~2 s.
- **listo + marcado** (~1,6 s): contenido final según el diseño elegido, destello/contorno verde que se apaga.
- **listo**: estado normal.
- **saliendo** (~380 ms al quitarse): sube en Z, se desvanece (la opacidad, en la hoja) y se desmonta.
- Cambiar de **tipo** = reconstrucción completa: lo viejo sale rápido y lo nuevo entra **escalonado** (cada bloque pasa por
  «construyendo» con 60–80 ms de retraso entre bloques), y el fantasma se desliza al nuevo nombre.
- Mientras `calculando` (usa `useEstadoMinimo(calculando, 450)`): el HUD muestra spinner + «CALCULANDO…» y la etiqueta de
  precio del último módulo lleva un spinner. Sin cambios pendientes: «✓ SINCRONIZADO».
- Al montar por primera vez (o al recargar con una selección ya hecha) no hace falta animar todo: entra con un único
  barrido escalonado corto.
- Implementa la presencia con un hook propio (p. ej. `usePresencia(claves)` → `[{ clave, fase }]`) con temporizadores por
  clave; volver a añadir algo que está «saliendo» cancela la salida. Limpia todos los temporizadores al desmontar.

### 6.5 Modo `demo` (portada)
Guion en bucle (~2,2 s por paso): corporativa+plantilla → +formulario → +segundoIdioma → uiCustom → +seo → +cms →
inmersivo → +autenticacion → ecommerce+crmPagos → saas → … La cámara orbita despacio. Sin etiquetas de precio. Se pausa
fuera de pantalla y con la pestaña oculta. Con reducir movimiento: estado fijo bonito (corporativa + uiCustom + formulario + seo).

### 6.6 Calidad visual
- Debe parecer un **render de producto**, no un esquema: degradados sutiles, brillos especulares finos en los bordes,
  sombra de contacto, reflejo en el suelo, foco de luz detrás, profundidad real entre capas.
- Texto de la maqueta pequeño (decorativo). Todo escala con el tamaño de la escena (móvil incluido).
- Rendimiento: ≤ ~160 nodos, animar solo `transform`/`opacity`, `will-change` solo en la cámara, 60 fps en un portátil.

---------------------------------------------------------------------------------------------------------------------

## 7. Configurador (`Calculadora`) — distribución tipo referencia

Escritorio (≥ 1100px):
```
┌──────────────────────── .configurador (máx. --ancho-escena, a sangre) ─────────────────────────────┐
│ ┌──────────── .escena (sticky: top --hueco-nav; alto 100svh − nav) ─────┐ ┌──── .panel ──────────┐ │
│ │ ●  ○  ○  ○   ← paginación vertical de pasos (botones)                  │ │ 01 TIPO  02 ALCANCE  │ │
│ │                                                                        │ │ 03 FUNCIONES 04 PLAZOS│ │
│ │            «CORPORATIVA» fantasma                                      │ │  (activo: barra verde)│ │
│ │                 [ VistaWeb3D ]                                         │ │ «02» fantasma         │ │
│ │                                                                        │ │ PASO 02 / 04 (verde)  │ │
│ │ ─────────────────────────────────────────────────────                  │ │ ALCANCE (verde, ancho)│ │
│ │  05 PÁG      UI CUSTOM     3 MÓDULOS    1.230 €  ⟳                     │ │ Y DISEÑO (blanco)     │ │
│ │  PÁGINAS     DISEÑO        FUNCIONES    ESTIMACIÓN                     │ │ párrafo gris          │ │
│ └────────────────────────────────────────────────────────────────────────┘ │ [tarjetas opción]     │ │
│                                                                            │ [páginas − 05 +]      │ │
│                                                                            │ ATRÁS   [CONTINUAR →] │ │
│                                                                            │ ── TU PRESUPUESTO ──  │ │
│                                                                            │ #desglose: total, líneas│
│                                                                            │ mensual, PDF (píldora │ │
│                                                                            │ + botón verde)        │ │
│                                                                            └───────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Columnas ≈ `minmax(0, 1.35fr) minmax(380px, 1fr)`. La escena se queda fija mientras el panel se desplaza (como el vídeo).
- Specs (abajo de la escena): PÁGINAS (`05 PÁG` o `—`), DISEÑO (nombre corto o `SIN DEFINIR`), FUNCIONES (`N MÓDULOS`),
  ESTIMACIÓN (total con `NumeroAnimado` + spinner mientras `calculando`). Usa las clases `.specs/.spec*`.
- Paso 4: el botón principal pasa a «VER MI PRESUPUESTO» y desplaza a `#desglose`.
- Tarjetas de opción oscuras: borde 1px tenue; activa = borde verde + brillo interior verde + marca verde rellena con check
  oscuro. Justo tras marcarla y mientras `calculando`, su marca muestra un mini spinner (≥ 450 ms) y luego el check «salta».
  Precio en Saira condensada verde («+80 €»). Las tarjetas de tipo (paso 1) llevan un mini esquema dibujado con CSS de ese tipo.
- Selector de páginas como una spec grande: `− 05 +` (botones circulares con borde verde).
- Resumen `#desglose`: «TU PRESUPUESTO» (etiqueta), total grande (Saira 800), líneas con importes (entran con animación),
  filas skeleton mientras llega la primera respuesta, servicios mensuales aparte, error en rojo, y formulario PDF:
  `.pildora` «Nombre o empresa» + `.boton` «SOLICITAR PROPUESTA (PDF)» con spinner al generar.
- Móvil (< 1000px): una columna; la escena arriba, **sticky** bajo la cabecera, con alto `clamp(280px, 46svh, 420px)`; specs
  compactas (4 columnas pequeñas); paginación vertical oculta (quedan las pestañas del panel).
- Mantén TODA la lógica existente (pasos, validación de avance, packs, PDF, errores, aria-live del total).

---------------------------------------------------------------------------------------------------------------------

## 8. Resto de la página (agentes tema y secciones)

Orden: Portal de entrada (`#inicio`) → Configurador (`#calculadora`) → Asistente IA (`#asistente`) → Servicios
(`#servicios`) → Packs (`#packs`) → Mantenimiento (`#mantenimiento`) → Metodología (`#metodologia`) → Preguntas
(`#preguntas`) → Pie.

Numeración de las etiquetas de sección (la misma en todos los agentes): 01 CONFIGURADOR (sin cabecera propia: su panel ya
dice «PASO 0X / 04») · 02 ASISTENTE IA (cabecera dentro de `asistente-ia.jsx`) · 03 SERVICIOS · 04 PACKS (cabecera dentro de
`pricing.jsx`) · 05 MANTENIMIENTO · 06 METODOLOGÍA · 07 PREGUNTAS. Formato: `<p class="etiqueta">03 — SERVICIOS</p>`.

- **Cabecera** (tema): fija arriba, fondo negro translúcido con blur y línea inferior tenue. Logo JM (trazos blancos + punto
  verde) + «PRESUPUESTA» en Saira. Nav centrada en MAYÚSCULAS espaciadas: CONFIGURADOR · ASISTENTE · PACKS · MANTENIMIENTO ·
  FAQ; el enlace de la sección visible (scrollspy con IntersectionObserver) en blanco con barra verde debajo. A la derecha,
  **píldora con borde verde** «ESTIMACIÓN 1.230 €» (NumeroAnimado + spinner si `c.calculando`) que lleva a `#calculadora`, y
  botón hamburguesa (tres líneas) que en < 900px abre un menú desplegable a pantalla completa (Esc y clic fuera lo cierran,
  `aria-expanded`, foco gestionado).
- **Portal + hero** (tema): el portal de letras se queda (`glyph-portal.jsx` no se toca). Papel oscuro `#0b0b0b`, letras que
  dejan ver un campo negro con brillos verdes; fuente Saira 900 al ancho normal (ver nota de `EntradaPortal`: hay que
  cargarla antes de montar el portal, con `document.fonts.load('900 100px "Saira"', PALABRA)`). El contenido revelado sigue la
  distribución de la referencia: a la izquierda etiqueta + titular pesado («CONFIGURA» blanco / «TU WEB» verde) con fantasma
  «2026» detrás, párrafo y CTA verde «EMPEZAR MI PRESUPUESTO» + píldora «DESCRIBIR MI PROYECTO»; a la derecha
  `<VistaWeb3D demo />` como «foto de producto»; abajo specs: «4 PASOS / CONFIGURACIÓN», «100 % / CALCULADO EN SERVIDOR»,
  «PDF / PROPUESTA FORMAL», «IA / ASISTENTE».
- **Secciones** (tema para el marcado de App: servicios, metodología, preguntas; secciones para los componentes): fondo oscuro
  continuo (alternando `--fondo` y `--fondo-2` con fundidos, nunca blanco), cabecera de sección = `.etiqueta` («02 — SERVICIOS»)
  + `.titular` con una palabra en verde + `.entradilla`, y una palabra `.fantasma` gigante detrás.
  - Servicios/tarifas: como specs grandes (valor «300 €» blanco condensado + etiqueta verde + descripción gris), separadas por
    líneas finas.
  - Metodología: números fantasma «01 02 03» con contorno, título en mayúsculas y texto.
  - Preguntas: acordeón con líneas finas, «+» verde que gira a «×».
  - Asistente IA: tarjetas oscuras, campos tipo píldora/área con borde verde al enfocar, chips con borde, Camarón con brillo
    verde suave. La vista previa `.ia-papel` sigue siendo **papel blanco** (como el PDF).
  - Packs: tarjetas oscuras, el popular con anillo verde y etiqueta «MÁS ELEGIDO», precio Saira grande, segmentado oscuro.
  - Mantenimiento: tarjetas oscuras, recomendado/elegido con anillo verde, precio Saira grande.
- **Pie** (tema): palabra fantasma «PRESUPUESTA» gigante, caja de borde fino «Presupuesta mi web | 0613 · Desarrollo web en
  entorno servidor», indicador de la API (punto verde «API EN LÍNEA»), nota de precios, y **semicírculo verde con chevron**
  centrado abajo para volver arriba.

---------------------------------------------------------------------------------------------------------------------

## 9. Cómo verificar (todos)

- Servidor de desarrollo compartido YA EN MARCHA: **http://localhost:5173/** (Vite, recarga sola; `/api` va al Express del
  puerto 3000, también en marcha). No arranques otros en esos puertos ni los pares.
- Laboratorio de la escena (lo crea escena3d): **http://localhost:5173/laboratorio.html**.
- Capturas con Chrome sin cabeza: escribe un plan JSON en `<SP>/agentes/<tu-nombre>/` y ejecuta
  `node "<SP>/harness/shot.js" "<SP>/agentes/<tu-nombre>/plan.json"`. Formato:
  ```
  { "url": "http://localhost:5173/", "out": "<SP>/agentes/<tu-nombre>/capturas", "width": 1440, "height": 900,
    "reducedMotion": false, "mobile": false, "touch": false,
    "steps": [ {"do":"wait","ms":800}, {"do":"scroll","sel":"#calculadora","offset":-72},
               {"do":"click","sel":"text=Web Corporativa"}, {"do":"hover","sel":"..."}, {"do":"mouse","x":600,"y":400},
               {"do":"eval","name":"x","js":"document.title"}, {"do":"shot","name":"01","full":false,"sel":null} ] }
  ```
  Imprime errores de consola y de página: **no puede haber ninguno tuyo**. Mira las PNG con Read.
- El portal de entrada ocupa varias pantallas de scroll: para ir al configurador usa `{"do":"scroll","sel":"#calculadora"}`.
- Otros agentes están editando a la vez: si ves un error que no es de tus archivos, espera unos segundos y repite.
- Comprueba al menos 1440×900, 1024×768 y 390×844 (`"mobile": true, "touch": true`), y una pasada con `"reducedMotion": true`.
