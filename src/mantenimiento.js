// Planes de mantenimiento: servicio mensual opcional que se contrata
// DESPUÉS de entregar la web. Es independiente del presupuesto:
// POST /api/presupuesto nunca los suma al total.
// Igual que las tarifas, sus precios solo existen en el servidor.

const PLANES_MANTENIMIENTO = Object.freeze([
  Object.freeze({
    id: "basico",
    nombre: "Básico",
    precioMensual: 29,
    descripcion: "Tu web siempre en línea, segura y al día.",
    incluye: Object.freeze([
      "Actualizaciones de seguridad",
      "Copia de seguridad semanal",
      "Vigilancia de caídas 24/7",
    ]),
  }),
  Object.freeze({
    id: "profesional",
    nombre: "Profesional",
    precioMensual: 59,
    recomendado: true,
    descripcion: "Para negocios que actualizan su web a menudo.",
    incluye: Object.freeze([
      "Todo lo del plan Básico",
      "Copia de seguridad diaria",
      "2 horas de cambios de contenido al mes",
      "Informe mensual de visitas",
    ]),
  }),
  Object.freeze({
    id: "premium",
    nombre: "Premium",
    precioMensual: 99,
    descripcion: "Atención prioritaria y mejoras continuas.",
    incluye: Object.freeze([
      "Todo lo del plan Profesional",
      "5 horas de cambios al mes",
      "Respuesta en menos de 24 horas",
      "Revisión trimestral de velocidad y SEO",
    ]),
  }),
]);

module.exports = { PLANES_MANTENIMIENTO };
