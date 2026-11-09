const express = require("express");
const { MONEDA } = require("../tarifas");
const { CATALOGO } = require("../catalogo");
const { pedirPropuestaIA, ErrorIA } = require("../openai");
const { validarDescripcion, normalizarPropuesta, validarSeleccion, construirDocumento } = require("../propuesta");
const { generarPdf } = require("../pdf");

// Rutas del asistente con IA. Se montan en /api desde app.js.
// Cada ruta solo recibe la petición, delega el trabajo y elige la respuesta HTTP.
const router = express.Router();

// GET /api/catalogo → servicios que se pueden proponer y añadir.
router.get("/catalogo", (req, res) => {
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
router.post("/propuesta", async (req, res, next) => {
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
router.post("/propuesta/documento", (req, res) => {
  const datos = datosValidados(req, res, validarSeleccion);
  if (datos) res.status(200).json(construirDocumento(datos));
});

// POST /api/propuesta/pdf → recalcula en el servidor y devuelve el PDF.
router.post("/propuesta/pdf", async (req, res, next) => {
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

module.exports = router;
