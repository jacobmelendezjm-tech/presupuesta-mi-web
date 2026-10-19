// Casos de prueba de POST /api/presupuesto.
// Los nueve primeros son los obligatorios del enunciado.
// En los inválidos, el resto de campos son correctos para comprobar
// cada error por separado.

const casosObligatorios = [
  {
    caso: 1,
    descripcion: "Landing, 1 página, sin extras",
    solicitud: { tipo: "landing", paginas: 1, formulario: false, segundoIdioma: false },
    estadoEsperado: 200,
    totalEsperado: 300,
  },
  {
    caso: 2,
    descripcion: "Corporativa, 4 páginas, formulario y sin segundo idioma",
    solicitud: { tipo: "corporativa", paginas: 4, formulario: true, segundoIdioma: false },
    estadoEsperado: 200,
    totalEsperado: 830,
  },
  {
    caso: 3,
    descripcion: "Landing, 2 páginas, ambos extras",
    solicitud: { tipo: "landing", paginas: 2, formulario: true, segundoIdioma: true },
    estadoEsperado: 200,
    totalEsperado: 580,
  },
  {
    caso: 4,
    descripcion: "Landing, 20 páginas, sin extras",
    solicitud: { tipo: "landing", paginas: 20, formulario: false, segundoIdioma: false },
    estadoEsperado: 200,
    totalEsperado: 1250,
  },
  {
    caso: 5,
    descripcion: "paginas: 0",
    solicitud: { tipo: "landing", paginas: 0, formulario: false, segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "paginas",
  },
  {
    caso: 6,
    descripcion: "paginas: 21",
    solicitud: { tipo: "landing", paginas: 21, formulario: false, segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "paginas",
  },
  {
    caso: 7,
    descripcion: "paginas: 2.5",
    solicitud: { tipo: "landing", paginas: 2.5, formulario: false, segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "paginas",
  },
  {
    caso: 8,
    descripcion: 'tipo: "tienda"',
    solicitud: { tipo: "tienda", paginas: 1, formulario: false, segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "tipo",
  },
  {
    caso: 9,
    descripcion: 'formulario: "false"',
    solicitud: { tipo: "landing", paginas: 1, formulario: "false", segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "formulario",
  },
];

// Pruebas adicionales (no obligatorias) para otros puntos del enunciado.
const casosAdicionales = [
  {
    caso: "A1",
    descripcion: 'paginas: "4" (cadena)',
    solicitud: { tipo: "corporativa", paginas: "4", formulario: true, segundoIdioma: false },
    estadoEsperado: 400,
    campoErroneo: "paginas",
  },
  {
    caso: "A2",
    descripcion: "Falta segundoIdioma",
    solicitud: { tipo: "corporativa", paginas: 4, formulario: true },
    estadoEsperado: 400,
    campoErroneo: "segundoIdioma",
  },
  {
    caso: "A3",
    descripcion: "Propiedades extra (total, precio, tarifas) se ignoran",
    solicitud: {
      tipo: "corporativa",
      paginas: 4,
      formulario: true,
      segundoIdioma: false,
      total: 1,
      precio: 0,
      tarifas: { corporativa: 1 },
    },
    estadoEsperado: 200,
    totalEsperado: 830,
  },
  {
    caso: "A4",
    descripcion: "El cuerpo es un array, no un objeto",
    solicitud: [],
    estadoEsperado: 400,
  },
  {
    caso: "A5",
    descripcion: 'Sin cabecera "Content-Type: application/json"',
    solicitud: { tipo: "landing", paginas: 1, formulario: false, segundoIdioma: false },
    contentType: "text/plain",
    estadoEsperado: 400,
  },
];

module.exports = { casosObligatorios, casosAdicionales };
