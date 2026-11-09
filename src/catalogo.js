const { TARIFAS } = require("./tarifas");

// Catálogo de servicios: la referencia para las propuestas de la IA.
// Los precios se leen de TARIFAS, que sigue siendo la única fuente de precios.
//
// grupo "tipo":   se elige exactamente uno (es el precio base de la web).
// grupo "unidad": se cobra por cantidad, así que necesita ese dato.
// grupo "extra":  importe fijo si se contrata.
const CATALOGO = Object.freeze(
  [
    {
      id: "landing",
      grupo: "tipo",
      nombre: "Landing",
      descripcion:
        "Web de un único objetivo para lanzar un producto, una campaña o un evento. Incluye la primera página.",
      precio: TARIFAS.landing,
    },
    {
      id: "corporativa",
      grupo: "tipo",
      nombre: "Web corporativa",
      descripcion:
        "Web con varias secciones para explicar quién es la empresa y qué hace. Incluye la primera página.",
      precio: TARIFAS.corporativa,
    },
    {
      id: "paginaAdicional",
      grupo: "unidad",
      nombre: "Páginas adicionales",
      descripcion: "Cada página de la web a partir de la segunda.",
      precio: TARIFAS.paginaAdicional,
      unidad: "página",
    },
    {
      id: "formulario",
      grupo: "extra",
      nombre: "Formulario de contacto",
      descripcion:
        "Formulario para que los visitantes envíen una solicitud o un mensaje desde la web. No gestiona disponibilidad, pagos ni cuentas de usuario.",
      precio: TARIFAS.formulario,
    },
    {
      id: "segundoIdioma",
      grupo: "extra",
      nombre: "Segundo idioma",
      descripcion: "Toda la web disponible en un idioma adicional.",
      precio: TARIFAS.segundoIdioma,
    },
  ].map(Object.freeze)
);

const IDS_CATALOGO = Object.freeze(CATALOGO.map((s) => s.id));
const IDS_TIPO = Object.freeze(CATALOGO.filter((s) => s.grupo === "tipo").map((s) => s.id));

const buscarServicio = (id) => CATALOGO.find((s) => s.id === id);

module.exports = { CATALOGO, IDS_CATALOGO, IDS_TIPO, buscarServicio };
