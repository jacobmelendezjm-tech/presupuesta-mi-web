import { useEffect, useState } from "react";

// Guion de la portada: la web se configura sola, un cambio cada ~2,2 s
// (los cambios de tipo y de diseño se quedan algo más, para que se vea el resultado).
const PROFESIONAL = { id: "profesional", nombre: "Profesional", precioMensual: 59 };

const GUION = [
  { tipo: "corporativa", paginas: 5, opciones: ["plantilla"], plan: null, pausa: 3200 },
  { tipo: "corporativa", paginas: 5, opciones: ["plantilla", "formulario"], plan: null },
  { tipo: "corporativa", paginas: 5, opciones: ["plantilla", "formulario", "segundoIdioma"], plan: null },
  { tipo: "corporativa", paginas: 5, opciones: ["uiCustom", "formulario", "segundoIdioma"], plan: null, pausa: 2800 },
  { tipo: "corporativa", paginas: 5, opciones: ["uiCustom", "formulario", "segundoIdioma", "seo"], plan: null },
  { tipo: "corporativa", paginas: 5, opciones: ["uiCustom", "formulario", "segundoIdioma", "seo", "cms"], plan: null },
  { tipo: "corporativa", paginas: 5, opciones: ["inmersivo", "formulario", "segundoIdioma", "seo", "cms"], plan: null, pausa: 2800 },
  { tipo: "corporativa", paginas: 5, opciones: ["inmersivo", "formulario", "segundoIdioma", "seo", "cms", "autenticacion"], plan: PROFESIONAL },
  { tipo: "ecommerce", paginas: 1, opciones: ["inmersivo", "crmPagos", "seo"], plan: PROFESIONAL, pausa: 3400 },
  { tipo: "saas", paginas: 1, opciones: ["uiCustom", "autenticacion", "redaccion"], plan: PROFESIONAL, pausa: 3400 },
  { tipo: "landing", paginas: 1, opciones: ["uiCustom", "redaccion", "formulario"], plan: null, pausa: 3400 },
];

// Con «reducir movimiento»: un estado fijo y bonito, sin bucle.
const FIJO = { tipo: "corporativa", paginas: 5, opciones: ["uiCustom", "formulario", "seo"], plan: null };

const PAUSA = 2200;

/** Devuelve la configuración que toca en la demo. Se pausa fuera de pantalla o con la pestaña oculta. */
export function useDemo(activa, visible, reducido) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!activa || reducido || !visible) return undefined;
    const espera = setTimeout(() => setIndice((i) => (i + 1) % GUION.length), GUION[indice].pausa ?? PAUSA);
    return () => clearTimeout(espera);
  }, [activa, reducido, visible, indice]);

  return reducido ? FIJO : GUION[indice];
}
