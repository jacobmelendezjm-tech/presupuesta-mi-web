const path = require("node:path");
const express = require("express");
const { TARIFAS, DESCRIPCIONES, MONEDA } = require("./tarifas");
const { validarSolicitud } = require("./validacion");
const { calcularPresupuesto } = require("./calculo");
const { PLANES_MANTENIMIENTO } = require("./mantenimiento");

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

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
