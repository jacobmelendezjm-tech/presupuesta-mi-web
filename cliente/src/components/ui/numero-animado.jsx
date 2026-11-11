import { useEffect, useRef, useState } from "react";

// Número que pasa suavemente de un valor al siguiente (por ejemplo, el total
// del presupuesto). Solo anima lo que ya ha calculado el servidor: no calcula nada.
// Con «reducir movimiento» el cambio es inmediato.
export function NumeroAnimado({ valor, formato = String, duracion = 350, className }) {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);

  useEffect(() => {
    const desde = actual.current;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (valor == null || desde == null || desde === valor || reducido) {
      actual.current = valor;
      setMostrado(valor);
      return undefined;
    }
    let fotograma;
    const inicio = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / duracion);
      actual.current = Math.round(desde + (valor - desde) * (1 - Math.pow(1 - p, 3)));
      setMostrado(actual.current);
      if (p < 1) fotograma = requestAnimationFrame(paso);
    };
    fotograma = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(fotograma);
  }, [valor, duracion]);

  return <span className={className}>{mostrado == null ? "—" : formato(mostrado)}</span>;
}
