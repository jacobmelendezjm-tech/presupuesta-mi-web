const { TIPOS_WEB, PAGINAS_MIN, PAGINAS_MAX } = require("./tarifas");

const CAMPOS_OBLIGATORIOS = ["tipo", "paginas", "formulario", "segundoIdioma"];

/**
 * Comprueba que el cuerpo de la petición cumple el contrato de la API.
 *
 * Devuelve:
 *  - { valido: true, datos }  con SOLO los cuatro campos permitidos
 *    (cualquier otra propiedad, como "total" o "precio", se ignora).
 *  - { valido: false, campos, detalles } con los campos erróneos y
 *    un mensaje por cada problema encontrado.
 */
function validarSolicitud(cuerpo) {
  // 1. El cuerpo debe ser un objeto JSON (no null, no array, no texto).
  if (typeof cuerpo !== "object" || cuerpo === null || Array.isArray(cuerpo)) {
    return {
      valido: false,
      campos: [],
      detalles: ["El cuerpo de la petición debe ser un objeto JSON."],
    };
  }

  const campos = [];
  const detalles = [];

  // 2. Deben estar los cuatro campos obligatorios.
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!Object.hasOwn(cuerpo, campo)) {
      campos.push(campo);
      detalles.push(`Falta el campo obligatorio "${campo}".`);
    }
  }

  const { tipo, paginas, formulario, segundoIdioma } = cuerpo;

  // 3. tipo: "landing" o "corporativa" (tiene que ser una cadena exacta).
  if (Object.hasOwn(cuerpo, "tipo") && !TIPOS_WEB.includes(tipo)) {
    campos.push("tipo");
    detalles.push(`"tipo" debe ser "landing" o "corporativa".`);
  }

  // 4. paginas: número entero entre 1 y 20.
  //    Number.isInteger("4") es false y Number.isInteger(2.5) también,
  //    así que las cadenas y los decimales se rechazan.
  if (
    Object.hasOwn(cuerpo, "paginas") &&
    !(Number.isInteger(paginas) && paginas >= PAGINAS_MIN && paginas <= PAGINAS_MAX)
  ) {
    campos.push("paginas");
    detalles.push(
      `"paginas" debe ser un número entero entre ${PAGINAS_MIN} y ${PAGINAS_MAX}.`
    );
  }

  // 5. formulario y segundoIdioma: booleanos de verdad (true o false).
  //    La cadena "false" es de tipo string, no boolean, y se rechaza.
  if (Object.hasOwn(cuerpo, "formulario") && typeof formulario !== "boolean") {
    campos.push("formulario");
    detalles.push(`"formulario" debe ser un booleano: true o false.`);
  }
  if (Object.hasOwn(cuerpo, "segundoIdioma") && typeof segundoIdioma !== "boolean") {
    campos.push("segundoIdioma");
    detalles.push(`"segundoIdioma" debe ser un booleano: true o false.`);
  }

  if (campos.length > 0) {
    return { valido: false, campos, detalles };
  }

  // Creamos un objeto nuevo solo con los campos del contrato.
  return { valido: true, datos: { tipo, paginas, formulario, segundoIdioma } };
}

module.exports = { validarSolicitud, CAMPOS_OBLIGATORIOS };
