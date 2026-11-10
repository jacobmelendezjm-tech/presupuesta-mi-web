// Formatos compartidos por la calculadora. Solo dan forma a lo que publica
// el servidor: aquí no se calcula ningún importe.
export const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});

/** 5 → «05», como las specs de la referencia. */
export const dosCifras = (n) => String(n).padStart(2, "0");

/** Precio de catálogo de una opción: «+80 €» o «+49 €/mes». */
export const precioDe = (opcion) => `+${euros.format(opcion.precio)}${opcion.periodo ? "/mes" : ""}`;

/** «1 página», «5 páginas». */
export const paginasEnTexto = (n) => `${n} ${n === 1 ? "página" : "páginas"}`;

/** Landing y corporativa son los únicos tipos que cobran por páginas. */
export const cuentaPaginas = (tipo) => tipo === "landing" || tipo === "corporativa";
