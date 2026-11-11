import { useEffect, useLayoutEffect, useState } from "react";

// Presencia animada: convierte una lista de claves («formulario», «seo»…) en
// elementos con fase, para que cada módulo pueda construirse y retirarse con calma.
//
//   inicial      → ya estaba al montar: entra con un barrido corto
//   construyendo → skeleton con brillo + spinner
//   marcado      → contenido final con un destello verde que se apaga
//   listo        → estado normal
//   saliendo     → se va animado y después se desmonta
//
// Cada fase dura lo que diga `tiempos` (en ms); «listo» no caduca.

export const TIEMPOS = { inicial: 450, construyendo: 320, marcado: 900, saliendo: 260 };

const SIGUIENTE = { inicial: "listo", construyendo: "marcado", marcado: "listo" };

// Aplica una lista nueva de claves sobre los elementos actuales.
function fusionar(previos, claves, ahora) {
  const quedan = new Set(claves);
  let cambio = false;

  const lista = previos.map((item) => {
    if (quedan.has(item.clave)) {
      if (item.fase !== "saliendo") return item;
      cambio = true;
      return { ...item, fase: "marcado", desde: ahora }; // vuelve a estar: se cancela la salida
    }
    if (item.fase === "saliendo") return item;
    cambio = true;
    return { ...item, fase: "saliendo", desde: ahora };
  });

  const estaban = new Set(previos.map((item) => item.clave));
  for (const clave of claves) {
    if (estaban.has(clave)) continue;
    cambio = true;
    lista.push({ clave, fase: "construyendo", desde: ahora });
  }

  return cambio ? lista : previos;
}

// Pasa a la fase siguiente lo que ya ha cumplido su tiempo (puede encadenar
// varias si la pestaña estuvo dormida) y desmonta lo que terminó de salir.
function avanzar(previos, ahora, tiempos) {
  let cambio = false;
  const lista = [];
  for (const original of previos) {
    let item = original;
    while (item) {
      const duracion = tiempos[item.fase];
      if (duracion == null || ahora < item.desde + duracion) break;
      cambio = true;
      item = item.fase === "saliendo" ? null : { ...item, fase: SIGUIENTE[item.fase], desde: item.desde + duracion };
    }
    if (item) lista.push(item);
  }
  return cambio ? lista : previos;
}

/**
 * @param {string[]} claves  lo que debe verse ahora
 * @param {object} tiempos   duración de cada fase en ms (usa una constante, no un objeto nuevo en cada render)
 * @returns {{ clave: string, fase: string, desde: number }[]} lo presente y lo que está saliendo
 */
export function usePresencia(claves, tiempos = TIEMPOS) {
  const firma = claves.join("|");

  // Lo que ya está al montar no se «construye»: solo hace un barrido corto.
  const [items, setItems] = useState(() => {
    const ahora = performance.now();
    return claves.map((clave) => ({ clave, fase: "inicial", desde: ahora }));
  });

  // useLayoutEffect: el elemento nuevo aparece en el mismo fotograma, sin parpadeo.
  useLayoutEffect(() => {
    setItems((previos) => fusionar(previos, firma ? firma.split("|") : [], performance.now()));
  }, [firma]);

  // Un único temporizador: el del próximo cambio de fase. Se limpia al desmontar.
  useEffect(() => {
    let proximo = Infinity;
    for (const item of items) {
      const duracion = tiempos[item.fase];
      if (duracion != null) proximo = Math.min(proximo, item.desde + duracion);
    }
    if (proximo === Infinity) return undefined;
    const espera = setTimeout(
      () => setItems((previos) => avanzar(previos, performance.now(), tiempos)),
      Math.max(0, proximo - performance.now()) + 4
    );
    return () => clearTimeout(espera);
  }, [items, tiempos]);

  return items;
}
