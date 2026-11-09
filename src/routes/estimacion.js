const express = require("express");
const { catalogoPublico, validarEstimacion, validarSolicitudPdf, calcularEstimacion, construirDocumentoEstimacion } = require("../estimacion");
const { generarPdf } = require("../pdf");

// Rutas de la calculadora por pasos. Se montan en /api desde app.js.
const router = express.Router();

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

// GET /api/estimacion/catalogo → tipos, opciones y planes con sus precios.
router.get("/estimacion/catalogo", (req, res) => {
  res.json(catalogoPublico());
});

// POST /api/estimacion → calcula la selección con los precios del servidor.
router.post("/estimacion", (req, res) => {
  const datos = datosValidados(req, res, validarEstimacion);
  if (datos) res.status(200).json(calcularEstimacion(datos));
});

// POST /api/estimacion/pdf → recalcula y devuelve la propuesta en PDF.
router.post("/estimacion/pdf", async (req, res, next) => {
  const datos = datosValidados(req, res, validarSolicitudPdf);
  if (!datos) return;

  try {
    const pdf = await generarPdf(construirDocumentoEstimacion(datos));
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="propuesta.pdf"');
    res.end(pdf);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
