// Tarifas del servidor. Son la única fuente de precios de la API:
// el cliente nunca puede enviar ni modificar estos valores.
// Object.freeze impide cambiarlas mientras el servidor está en marcha.

const MONEDA = "EUR";

const TARIFAS = Object.freeze({
  landing: 300, // Landing, incluida la primera página
  corporativa: 600, // Web corporativa, incluida la primera página
  paginaAdicional: 50, // Cada página adicional a la primera
  formulario: 80, // Formulario de contacto
  segundoIdioma: 150, // Segundo idioma
});

// Descripción legible de cada concepto, para publicarla en GET /api/tarifas.
const DESCRIPCIONES = Object.freeze({
  landing: "Landing, incluida la primera página",
  corporativa: "Web corporativa, incluida la primera página",
  paginaAdicional: "Cada página adicional a la primera",
  formulario: "Formulario de contacto",
  segundoIdioma: "Segundo idioma",
});

// Tipos de web admitidos: son los que tienen precio base.
const TIPOS_WEB = Object.freeze(["landing", "corporativa"]);

const PAGINAS_MIN = 1;
const PAGINAS_MAX = 20;

module.exports = {
  MONEDA,
  TARIFAS,
  DESCRIPCIONES,
  TIPOS_WEB,
  PAGINAS_MIN,
  PAGINAS_MAX,
};
