const { TARIFAS, MONEDA } = require("./tarifas");

/**
 * Calcula el presupuesto a partir de datos YA VALIDADOS.
 * No sabe nada de Express, de peticiones ni de respuestas HTTP:
 * solo aplica las tarifas del servidor.
 *
 * Regla: total = precio base + páginas adicionales + extras seleccionados
 *
 * Ejemplo: { tipo: "corporativa", paginas: 4, formulario: true, segundoIdioma: false }
 *   base               = 600            (web corporativa)
 *   paginasAdicionales = (4 - 1) × 50   = 150
 *   formulario         = 80             (seleccionado)
 *   segundoIdioma      = 0              (no seleccionado)
 *   total              = 600 + 150 + 80 + 0 = 830
 */
function calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma }) {
  const base = TARIFAS[tipo];
  const paginasAdicionales = (paginas - 1) * TARIFAS.paginaAdicional;
  const costeFormulario = formulario ? TARIFAS.formulario : 0;
  const costeSegundoIdioma = segundoIdioma ? TARIFAS.segundoIdioma : 0;

  const total = base + paginasAdicionales + costeFormulario + costeSegundoIdioma;

  return {
    base,
    paginasAdicionales,
    formulario: costeFormulario,
    segundoIdioma: costeSegundoIdioma,
    total,
    moneda: MONEDA,
  };
}

module.exports = { calcularPresupuesto };
