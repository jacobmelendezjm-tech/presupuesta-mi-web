import { useEffect, useState } from "react";

// Scrollspy: devuelve el id de la sección que cruza una franja estrecha a media
// altura de la pantalla (o null). Usa IntersectionObserver, sin escuchar el scroll.
// «ids» debe ser estable (una constante del módulo), en el orden de la página.
export function useSeccionActiva(ids) {
  const [activa, setActiva] = useState(null);

  useEffect(() => {
    const dentro = new Set();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) dentro.add(entrada.target.id);
          else dentro.delete(entrada.target.id);
        }
        // Si en un borde cruzan dos secciones, gana la primera en el orden de la página
        setActiva(ids.find((id) => dentro.has(id)) ?? null);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const id of ids) {
      const elemento = document.getElementById(id);
      if (elemento) observador.observe(elemento);
    }
    return () => observador.disconnect();
  }, [ids]);

  return activa;
}
