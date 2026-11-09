const path = require("node:path");
const express = require("express");
const { TARIFAS, DESCRIPCIONES, MONEDA } = require("./tarifas");
const { validarSolicitud } = require("./validacion");
const { calcularPresupuesto } = require("./calculo");
const { PLANES_MANTENIMIENTO } = require("./mantenimiento");
const { CATALOGO } = require("./catalogo");
const { pedirPropuestaIA, ErrorIA } = require("./openai");
const { validarDescripcion, normalizarPropuesta, validarSeleccion, construirDocumento } = require("./propuesta");
const { generarPdf } = require("./pdf");

const app = express();

// Convierte el cuerpo JSON de la petición en un objeto (req.body).
app.use(express.json());

// Interfaz React compilada (solo existe tras `npm run build`).
// En Vercel, la carpeta public/ la sirve directamente su CDN.
app.use(express.static(path.join(__dirname, "..", "public")));

// GET /api/estado → confirma que el servicio funciona.
app.get("/api/estado", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/tarifas → publica las tarifas que usa el servidor.
app.get("/api/tarifas", (req, res) => {
  const tarifas = Object.entries(TARIFAS).map(([concepto, precio]) => ({
    concepto,
    descripcion: DESCRIPCIONES[concepto],
    precio,
  }));

  res.json({ moneda: MONEDA, tarifas });
});

// GET /api/mantenimiento → planes de mantenimiento mensuales (opcionales,
// se contratan tras entregar la web y no se suman al presupuesto).
app.get("/api/mantenimiento", (req, res) => {
  res.json({ moneda: MONEDA, periodo: "mes", planes: PLANES_MANTENIMIENTO });
});

// POST /api/presupuesto → valida la solicitud y calcula el presupuesto.
// La ruta solo interpreta la petición y gestiona la respuesta;
// el cálculo lo hace calcularPresupuesto(), que está en otro archivo.
app.post("/api/presupuesto", (req, res) => {
  // La petición debe enviarse con Content-Type: application/json.
  if (!req.is("application/json")) {
    return res.status(400).json({
      error: "Solicitud no válida",
      campos: [],
      detalles: ['La petición debe usar la cabecera "Content-Type: application/json".'],
    });
  }

  // 1. Validar antes de calcular.
  const resultado = validarSolicitud(req.body);

  if (!resultado.valido) {
    return res.status(400).json({
      error: "Solicitud no válida",
      campos: resultado.campos,
      detalles: resultado.detalles,
    });
  }

  // 2. Calcular con las tarifas del servidor (solo con los datos validados).
  const presupuesto = calcularPresupuesto(resultado.datos);

  // 3. Responder con el desglose.
  res.status(200).json(presupuesto);
});

// GET /api/catalogo → servicios que se pueden proponer y añadir.
app.get("/api/catalogo", (req, res) => {
  res.json({ moneda: MONEDA, servicios: CATALOGO });
});

// Responde 400 si la petición no es JSON o no supera la validación.
function datosValidados(req, res, validar) {
  if (!req.is("application/json")) {
    res.status(400).json({
      error: "Solicitud no válida",
      campos: [],
      detalles: ['La petición debe usar la cabecera "Content-Type: application/json".'],
    });
    return null;
  }
  const resultado = validar(req.body);
  if (!resultado.valido) {
    res.status(400).json({ error: "Solicitud no válida", campos: resultado.campos, detalles: resultado.detalles });
    return null;
  }
  return resultado.datos;
}

// POST /api/propuesta → la IA interpreta la solicitud; aquí se valida lo que devuelve.
app.post("/api/propuesta", async (req, res, next) => {
  const datos = datosValidados(req, res, validarDescripcion);
  if (!datos) return;

  try {
    const respuestaIA = await pedirPropuestaIA(datos);
    res.status(200).json(normalizarPropuesta(respuestaIA));
  } catch (error) {
    if (!(error instanceof ErrorIA)) return next(error);
    res.status(error.estado).json({
      error: "No se pudo preparar la propuesta",
      campos: [],
      detalles: [error.message],
      reintentable: true,
    });
  }
});

// POST /api/propuesta/documento → calcula los importes de la selección confirmada.
app.post("/api/propuesta/documento", (req, res) => {
  const datos = datosValidados(req, res, validarSeleccion);
  if (datos) res.status(200).json(construirDocumento(datos));
});

// POST /api/propuesta/pdf → recalcula en el servidor y devuelve el PDF.
app.post("/api/propuesta/pdf", async (req, res, next) => {
  const datos = datosValidados(req, res, validarSeleccion);
  if (!datos) return;

  try {
    const pdf = await generarPdf(construirDocumento(datos));
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="presupuesto.pdf"');
    res.end(pdf);
  } catch (error) {
    next(error);
  }
});

// Cualquier otra ruta → 404 en formato JSON.
app.use((req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.path}` });
});

// Gestor de errores: JSON mal escrito → 400; fallo inesperado → 500.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Solicitud no válida",
      campos: [],
      detalles: ["El cuerpo de la petición no es un JSON válido."],
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Solicitud no válida",
      campos: [],
      detalles: ["El texto enviado es demasiado largo."],
    });
  }

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
