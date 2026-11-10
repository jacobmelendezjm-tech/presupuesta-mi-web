import { useEffect, useRef, useState } from "react";

// Mantiene un estado «activo» visible un mínimo de tiempo. Sirve para que un
// spinner no parpadee cuando el servidor responde en pocos milisegundos.
export function useEstadoMinimo(activo, minimo = 450) {
  const [visible, setVisible] = useState(activo);
  const desde = useRef(activo ? performance.now() : 0);

  useEffect(() => {
    if (activo) {
      desde.current = performance.now();
      setVisible(true);
      return undefined;
    }
    const resto = minimo - (performance.now() - desde.current);
    if (resto <= 0) {
      setVisible(false);
      return undefined;
    }
    const espera = setTimeout(() => setVisible(false), resto);
    return () => clearTimeout(espera);
  }, [activo, minimo]);

  return activo || visible;
}
