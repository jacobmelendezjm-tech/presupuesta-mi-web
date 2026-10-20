# Memoria del proyecto · Presupuesta mi web

Qué se ha hecho hasta ahora, cómo está montado y cómo seguir la próxima vez.
Última actualización: **20/10/2026**.

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
5. **CSS propio, sin Tailwind.** Los componentes que se copien de shadcn o
   21st.dev (pensados para Tailwind y TypeScript) se adaptan a JSX + CSS en
   `cliente/src/components/ui/`, sin añadir dependencias.
6. **Estilo visual:** página de producto tipo Apple (titulares grandes,
   secciones claras y oscuras alternas, botones en píldora, tarjetas con anillo
   azul), con modo claro y nocturno.
7. **Commits solo a tu nombre**, sin coautores.
8. **No subir** `node_modules`, `public/` (se genera al compilar) ni credenciales.

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
| Navegación | Isla flotante de cristal (glassmorphism) con logo JM, enlaces, indicador «API en línea», botón de tema y «Calcular». Se compacta al hacer scroll |
| Hero | Componente `hero-1.jsx`: cuadrícula, titular con degradado, arco luminoso y fundido hacia la siguiente sección |
| Configura tu web | Tipo, páginas (stepper + deslizador) y extras. Vista previa de la web y total al lado |
| Tu presupuesto | Total animado, barra por conceptos y desglose |
| Tarifas | Las cinco tarifas de `GET /api/tarifas`, con los precios alineados |
| Packs | `pricing.jsx`: Esencial (300 €), Negocio (880 €) y Empresa (1.230 €). Su precio lo pide a `POST /api/presupuesto`; el control «Un idioma / Dos idiomas» los recalcula. «Elegir» carga el pack en el configurador |
| Mantenimiento | `planes-mantenimiento.jsx`, datos de `GET /api/mantenimiento` |
| Cómo funciona | Tres pasos y la última petición y respuesta JSON reales |
| Barra inferior | Total fijo abajo cuando no se ve el desglose |

Otros detalles:

- **Modo nocturno:** `boton-tema.jsx`. Recuerda la elección en `localStorage`
  (clave `tema`); si no hay, sigue al sistema. El cambio se anima con un círculo
  (View Transitions) y un script en `index.html` evita el destello blanco.
- **Logo JM** lineal con punto azul (`LogoJM` en `App.jsx`), también en el pie
  y como icono de la pestaña. Está dibujado a partir de una descripción: si
  tienes el archivo original, sustitúyelo.
- **Responsive y navegadores:** ver el apartado 6.

### Historial de cambios importantes

| Fecha | Cambio |
| ----- | ------ |
| 19/10/2026 | API, pruebas, README y despliegue en Vercel |
| 20/10/2026 | Se quitó del historial de GitHub la línea de coautoría de los commits |
| 20/10/2026 | Rediseño como landing estilo Apple con calculadora |
| 20/10/2026 | Logo JM, hero nuevo, modo nocturno, packs y planes de mantenimiento |
| 20/10/2026 | Navegación en isla de cristal y revisión responsive y de navegadores |

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
npm test                    # 21 pruebas automáticas
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
test/api.test.js            pruebas automáticas
pruebas/                    casos y script de pruebas contra la API en marcha
cliente/index.html          metadatos, fuentes y script anti-destello del tema
cliente/src/App.jsx         página completa (estado, peticiones y secciones)
cliente/src/index.css       estilos globales, tokens de color y modo nocturno
cliente/src/components/ui/  hero-1, boton-tema, pricing, planes-mantenimiento
vercel.json                 compila la interfaz al desplegar
```

Los colores se cambian en los tokens del principio de `index.css`
(`:root` para el modo claro y `:root[data-theme="dark"]` para el nocturno).

---

## 6. Responsive y compatibilidad

_Se completa al terminar la revisión en curso._

---

## 7. Pendiente y próximos pasos

### Mejoras pendientes de una revisión anterior

- Si la API deja de responder, la tarjeta de error aún muestra el último
  estado («El servidor respondió 200»).
- El indicador «API en línea» y las tarifas solo se piden al cargar la página.
- Los botones − / + saltan a 1 o 2 si el campo tiene un valor no válido (21, 2.5).
- El total animado hace que los lectores de pantalla anuncien muchos números
  seguidos; conviene un único aviso con el total final.
- Algunos grises pequeños tienen poco contraste.

### Ideas para seguir

1. **Guardar presupuestos** (siguiente paso que propone la sesión 0613):
   Supabase + PostgreSQL, con `POST /api/presupuestos` para guardar y
   `GET /api/presupuestos/:id` para recuperar.
2. Pasar a **Next.js**, que es la arquitectura del curso.
3. Confirmar o cambiar los precios y el contenido de los packs y de los planes
   de mantenimiento (son inventados).
4. Sustituir el logo JM por el archivo original si lo tienes.
