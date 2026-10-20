# Presupuesta mi web

API desarrollada con **Node.js**, **Express** y **JavaScript** para el módulo
**0613 · Desarrollo web en entorno servidor** (RA7 · CE 7.4, 7.6 y 7.7).

La API recibe las características de una web, **valida los datos en el servidor**
y devuelve un **presupuesto desglosado** calculado con las tarifas propias del
servidor. Nunca usa un precio ni un total enviado por el cliente.

Incluye además la ampliación opcional: una **interfaz React** (carpeta
[`cliente/`](cliente/)) que consume la API.

## Enlaces

| Qué | Enlace |
| --- | ------ |
| Repositorio | <https://github.com/jacobmelendezjm-tech/presupuesta-mi-web> |
| Interfaz React desplegada | <https://presupuesta-mi-web.vercel.app> |
| API desplegada: estado | <https://presupuesta-mi-web.vercel.app/api/estado> |
| API desplegada: tarifas | <https://presupuesta-mi-web.vercel.app/api/tarifas> |
| API desplegada: presupuesto (POST) | `https://presupuesta-mi-web.vercel.app/api/presupuesto` |

Probar el POST desplegado desde la terminal:

```bash
curl -i https://presupuesta-mi-web.vercel.app/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

O ejecutar todas las pruebas contra la versión desplegada:

```bash
API_URL=https://presupuesta-mi-web.vercel.app npm run pruebas
```

---

## Requisitos

- [Node.js](https://nodejs.org/) **18 o superior** (probado con Node.js 24.22.0)
- npm (se instala con Node.js)

Para comprobarlo:

```bash
node -v
npm -v
```

## Instalación

```bash
git clone https://github.com/jacobmelendezjm-tech/presupuesta-mi-web.git
cd presupuesta-mi-web
npm install
```

`npm install` lee [`package.json`](package.json) y [`package-lock.json`](package-lock.json)
e instala Express en `node_modules/`. Esa carpeta no se sube al repositorio.

## Ejecución

```bash
npm start
```

La terminal mostrará:

```
API de presupuestos escuchando en http://localhost:3000
```

- **Puerto:** `3000` por defecto. Se puede cambiar con la variable de entorno
  `PORT` (por ejemplo `PORT=4000 npm start` en Git Bash, macOS o Linux).
- **Detener el servidor:** `Ctrl + C`.
- **Modo desarrollo** (se reinicia solo al guardar cambios): `npm run dev`.

Comprobación rápida: abre <http://localhost:3000/api/estado> en el navegador.
Debe aparecer `{"status":"ok"}`.

---

## Rutas

| Método | Ruta               | Descripción                                   | Respuestas |
| ------ | ------------------ | --------------------------------------------- | ---------- |
| GET    | `/api/estado`      | Confirma que el servicio funciona             | 200        |
| GET    | `/api/tarifas`     | Devuelve las tarifas que usa el servidor      | 200        |
| POST   | `/api/presupuesto` | Valida la solicitud y calcula el presupuesto  | 200 · 400  |

Cualquier otra ruta responde **404** en JSON. Un fallo inesperado responde **500**.

### `GET /api/estado`

```json
{ "status": "ok" }
```

### `GET /api/tarifas`

```json
{
  "moneda": "EUR",
  "tarifas": [
    { "concepto": "landing", "descripcion": "Landing, incluida la primera página", "precio": 300 },
    { "concepto": "corporativa", "descripcion": "Web corporativa, incluida la primera página", "precio": 600 },
    { "concepto": "paginaAdicional", "descripcion": "Cada página adicional a la primera", "precio": 50 },
    { "concepto": "formulario", "descripcion": "Formulario de contacto", "precio": 80 },
    { "concepto": "segundoIdioma", "descripcion": "Segundo idioma", "precio": 150 }
  ]
}
```

### `POST /api/presupuesto`

Cabecera obligatoria: `Content-Type: application/json`.

**Cuerpo** (los cuatro campos son obligatorios):

| Campo           | Tipo     | Valores admitidos                    |
| --------------- | -------- | ------------------------------------ |
| `tipo`          | string   | `"landing"` o `"corporativa"`        |
| `paginas`       | number   | Entero entre `1` y `20`              |
| `formulario`    | boolean  | `true` o `false`                     |
| `segundoIdioma` | boolean  | `true` o `false`                     |

```json
{ "tipo": "corporativa", "paginas": 4, "formulario": true, "segundoIdioma": false }
```

**Respuesta 200:**

```json
{
  "base": 600,
  "paginasAdicionales": 150,
  "formulario": 80,
  "segundoIdioma": 0,
  "total": 830,
  "moneda": "EUR"
}
```

`paginasAdicionales` es el **coste** de las páginas adicionales: (4 − 1) × 50 € = 150 €.

**Respuesta 400** (solicitud incorrecta; no se calcula nada):

```json
{
  "error": "Solicitud no válida",
  "campos": ["paginas"],
  "detalles": ["\"paginas\" debe ser un número entero entre 1 y 20."]
}
```

Se responde 400 cuando:

- el cuerpo no es un objeto JSON (está vacío, es un array o es JSON mal escrito);
- falta alguno de los cuatro campos;
- `tipo` no es `"landing"` ni `"corporativa"`;
- `paginas` no es un número entero entre 1 y 20 (`0`, `21`, `2.5` y `"4"` se rechazan);
- `formulario` o `segundoIdioma` no son booleanos (`"false"` es una cadena y se rechaza);
- la petición no usa `Content-Type: application/json`.

Las **propiedades adicionales se ignoran**: si el cliente envía `"total": 1` o
`"tarifas": {...}`, el servidor no las usa y calcula con sus propias tarifas.

---

## Tarifas y cálculo

| Concepto                                     | Precio |
| -------------------------------------------- | -----: |
| Landing, incluida la primera página          |  300 € |
| Web corporativa, incluida la primera página  |  600 € |
| Cada página adicional a la primera           |   50 € |
| Formulario de contacto                       |   80 € |
| Segundo idioma                               |  150 € |

Sin impuestos, descuentos ni conceptos adicionales. Los presupuestos no se guardan.

**Regla:** `total = precio base + (páginas − 1) × 50 + extras seleccionados`

## Estructura del proyecto

```
presupuesta-mi-web/
├── package.json          ← dependencias y scripts (npm start, npm test…)
├── package-lock.json     ← versiones exactas de las dependencias
├── .gitignore            ← excluye node_modules y credenciales
├── src/
│   ├── server.js         ← arranca el servidor en el puerto 3000
│   ├── app.js            ← rutas de Express (reciben la petición y responden)
│   ├── tarifas.js        ← tarifas del servidor (constantes congeladas)
│   ├── validacion.js     ← validarSolicitud(): comprueba el contrato
│   └── calculo.js        ← calcularPresupuesto(): lógica de negocio
├── test/
│   └── api.test.js       ← pruebas automáticas (npm test)
├── pruebas/
│   ├── casos.js          ← casos de prueba (los 9 obligatorios + adicionales)
│   └── ejecutar-pruebas.js ← prueba la API en marcha (npm run pruebas)
└── cliente/              ← ampliación: interfaz React
```

Cada pieza tiene una sola responsabilidad:

1. **La ruta** (`app.js`) interpreta la petición y gestiona la respuesta.
2. **La validación** (`validacion.js`) decide si los datos cumplen el contrato.
3. **El cálculo** (`calculo.js`) es una función independiente que recibe datos
   ya validados, aplica las tarifas y devuelve el desglose. No usa Express.

---

## Pruebas

### Cómo reproducirlas

**Opción 1. Pruebas automáticas** (no hace falta arrancar el servidor):

```bash
npm test
```

**Opción 2. Contra el servidor en marcha.** En una terminal ejecuta `npm start` y en otra:

```bash
npm run pruebas
```

Muestra una tabla con la solicitud, el resultado esperado y el obtenido.

**Opción 3. Con `curl`** (Git Bash, macOS o Linux):

```bash
curl -i http://localhost:3000/api/estado
curl -i http://localhost:3000/api/tarifas
curl -i http://localhost:3000/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

En **PowerShell** de Windows:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/presupuesto -ContentType "application/json" -Body '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

> Abrir una URL en la barra del navegador solo envía peticiones GET. Para el
> POST con JSON hay que usar un cliente HTTP (curl, Postman, Thunder Client…).

### Resultados: rutas GET

| Prueba | Solicitud               | Resultado esperado                     | Resultado obtenido                                     | ¿OK? |
| ------ | ----------------------- | -------------------------------------- | ------------------------------------------------------ | :--: |
| E1     | `GET /api/estado`       | 200 · `{"status":"ok"}`                | 200 · `{"status":"ok"}`                                |  ✔   |
| E2     | `GET /api/tarifas`      | 200 · las cinco tarifas con su nombre  | 200 · landing 300, corporativa 600, paginaAdicional 50, formulario 80, segundoIdioma 150 (EUR) |  ✔   |

### Resultados: `POST /api/presupuesto` (los 9 casos obligatorios)

En los casos inválidos, los demás campos son correctos para comprobar cada error por separado.

| Caso | Solicitud enviada | Resultado esperado | Resultado obtenido | ¿OK? |
| :--: | ----------------- | ------------------ | ------------------ | :--: |
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · Total: 300 € | 200 · `{"base":300,"paginasAdicionales":0,"formulario":0,"segundoIdioma":0,"total":300,"moneda":"EUR"}` | ✔ |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · Total: 830 € | 200 · `{"base":600,"paginasAdicionales":150,"formulario":80,"segundoIdioma":0,"total":830,"moneda":"EUR"}` | ✔ |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · Total: 580 € | 200 · `{"base":300,"paginasAdicionales":50,"formulario":80,"segundoIdioma":150,"total":580,"moneda":"EUR"}` | ✔ |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · Total: 1.250 € | 200 · `{"base":300,"paginasAdicionales":950,"formulario":0,"segundoIdioma":0,"total":1250,"moneda":"EUR"}` | ✔ |
| 5 | `{"tipo":"landing","paginas":0,"formulario":false,"segundoIdioma":false}` | 400 | 400 · campos: `["paginas"]` · "paginas" debe ser un número entero entre 1 y 20. | ✔ |
| 6 | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | 400 | 400 · campos: `["paginas"]` · "paginas" debe ser un número entero entre 1 y 20. | ✔ |
| 7 | `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | 400 | 400 · campos: `["paginas"]` · "paginas" debe ser un número entero entre 1 y 20. | ✔ |
| 8 | `{"tipo":"tienda","paginas":1,"formulario":false,"segundoIdioma":false}` | 400 | 400 · campos: `["tipo"]` · "tipo" debe ser "landing" o "corporativa". | ✔ |
| 9 | `{"tipo":"landing","paginas":1,"formulario":"false","segundoIdioma":false}` | 400 | 400 · campos: `["formulario"]` · "formulario" debe ser un booleano: true o false. | ✔ |

### Resultados: pruebas adicionales

| Caso | Solicitud enviada | Resultado esperado | Resultado obtenido | ¿OK? |
| :--: | ----------------- | ------------------ | ------------------ | :--: |
| A1 | `{"tipo":"corporativa","paginas":"4","formulario":true,"segundoIdioma":false}` (`"4"` es una cadena) | 400 | 400 · "paginas" debe ser un número entero entre 1 y 20. | ✔ |
| A2 | `{"tipo":"corporativa","paginas":4,"formulario":true}` (falta un campo) | 400 | 400 · Falta el campo obligatorio "segundoIdioma". | ✔ |
| A3 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false,"total":1,"precio":0,"tarifas":{"corporativa":1}}` | 200 · Total: 830 € (se ignoran los extras) | 200 · Total: 830 € | ✔ |
| A4 | `[]` (array en lugar de objeto) | 400 | 400 · El cuerpo de la petición debe ser un objeto JSON. | ✔ |
| A5 | Cuerpo válido con `Content-Type: text/plain` | 400 | 400 · La petición debe usar la cabecera "Content-Type: application/json". | ✔ |
| A6 | `{"tipo": "landing",` (JSON mal escrito) | 400 | 400 · El cuerpo de la petición no es un JSON válido. | ✔ |
| A7 | `GET /api/otra` (ruta inexistente) | 404 | 404 · No existe la ruta GET /api/otra | ✔ |

Resultados obtenidos el 19/10/2026 con `curl` contra `http://localhost:3000`,
y confirmados con `npm test` (19 pruebas, 19 correctas). Los mismos casos
dan el mismo resultado contra la versión desplegada en Vercel.

---

## Ampliación: interfaz React (CE 7.7)

Landing en React que funciona como calculadora y consume las tres rutas de la API:

- `GET /api/estado`: muestra el indicador «API en línea» en la barra de navegación.
- `GET /api/tarifas`: muestra los precios en las opciones del configurador y en la
  sección «Tarifas».
- `POST /api/presupuesto`: recalcula el presupuesto en el servidor con cada cambio
  y muestra el total, el desglose o los errores 400 (el campo erróneo se marca en
  rojo usando la lista `campos` de la respuesta).

**Diseño:** página de producto de estilo Apple: titulares grandes, secciones claras
y oscuras alternas, barra de navegación translúcida, botones redondeados y un
configurador por pasos como el de una tienda online. Secciones:

| Sección | Qué muestra |
| ------- | ----------- |
| Inicio | Titular y una vista previa de la web que cambia con la configuración |
| Configura tu web | Tipo de web, número de páginas y extras, con el total al lado |
| Tu presupuesto | Total, barra con el peso de cada concepto y desglose línea a línea |
| Tarifas | Las cinco tarifas que publica el servidor |
| Cómo funciona | Los tres pasos del cálculo y la última petición y respuesta JSON reales |

Es **responsive**: en escritorio el configurador tiene dos columnas (vista previa y
total fijos a la izquierda); por debajo de 900 px pasa a una sola columna. Al salir
del inicio aparece una barra fija abajo con el total. Respeta la opción del sistema
de reducir el movimiento.

Hacen falta **dos terminales**:

```bash
# Terminal 1: la API (en la carpeta del proyecto)
npm start
```

```bash
# Terminal 2: la interfaz
cd cliente
npm install
npm run dev
```

Abre <http://localhost:5173>. Vite reenvía las peticiones `/api` a
`http://localhost:3000` (ver [`cliente/vite.config.js`](cliente/vite.config.js)).

El formulario no bloquea valores incorrectos (por ejemplo, `2.5` páginas) para
que se vea cómo la validación del servidor los rechaza y la interfaz muestra el error.

**Alternativa con un solo proceso:** compila la interfaz y deja que Express la sirva:

```bash
npm run build   # compila cliente/ en public/
npm start       # interfaz y API en http://localhost:3000
```

## Despliegue en Vercel

El proyecto está desplegado en <https://presupuesta-mi-web.vercel.app>, conectado
al repositorio de GitHub: cada `git push` a `main` vuelve a desplegarlo.

- Vercel detecta Express y convierte `src/app.js` en una función del servidor.
- [`vercel.json`](vercel.json) ejecuta `npm run build`, que compila la interfaz
  React en `public/`; Vercel sirve esa carpeta desde su CDN.
- Así la interfaz y la API comparten dirección y no hace falta CORS.

---

## Explicación del código

### Una validación: `paginas`

En [`src/validacion.js`](src/validacion.js):

```js
Number.isInteger(paginas) && paginas >= 1 && paginas <= 20
```

- `Number.isInteger(4)` → `true`: es un número entero.
- `Number.isInteger("4")` → `false`: es una cadena, aunque parezca un número.
- `Number.isInteger(2.5)` → `false`: no es entero.
- `0` y `21` son enteros, pero quedan fuera del rango.

Si la condición no se cumple, la ruta responde **400** con el campo erróneo y
**no llama** a la función de cálculo.

### Un cálculo: corporativa, 4 páginas, con formulario

En [`src/calculo.js`](src/calculo.js), `calcularPresupuesto()` recibe los datos
ya validados y usa solo `TARIFAS` del servidor:

| Paso | Operación | Resultado |
| ---- | --------- | --------: |
| Base | `TARIFAS["corporativa"]` | 600 € |
| Páginas adicionales | `(4 − 1) × 50` | 150 € |
| Formulario | `true` → `TARIFAS.formulario` | 80 € |
| Segundo idioma | `false` → `0` | 0 € |
| **Total** | `600 + 150 + 80 + 0` | **830 €** |
