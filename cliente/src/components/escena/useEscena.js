import { useEffect, useState } from "react";

export { useReducirMovimiento } from "../ui/use-reducir-movimiento.js";

/**
 * true mientras la escena está en pantalla y la pestaña visible.
 * Sirve para pausar la demo, los brillos en bucle y el rAF de la inclinación.
 */
export function useVisibilidad(ref) {
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestana, setPestana] = useState(() => !document.hidden);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;
    const observador = new IntersectionObserver(([entrada]) => setEnPantalla(entrada.isIntersecting), { rootMargin: "60px" });
    observador.observe(elemento);
    const alCambiarPestana = () => setPestana(!document.hidden);
    document.addEventListener("visibilitychange", alCambiarPestana);
    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", alCambiarPestana);
    };
  }, [ref]);

  return enPantalla && pestana;
}

/**
 * Inclinación con el puntero (solo ratón o lápiz, nunca táctil).
 * Un rAF acerca poco a poco (lerp) los grados actuales a los del puntero y los
 * escribe como variables CSS en el elemento: --inc-x y --inc-y, sin unidad.
 * No hay setState por fotograma y el bucle se detiene cuando converge.
 */
export function useInclinacion(ref, activa) {
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;

    const reiniciar = () => {
      elemento.style.setProperty("--inc-x", "0");
      elemento.style.setProperty("--inc-y", "0");
    };
    const fino = window.matchMedia("(pointer: fine)").matches;
    if (!activa || !fino) {
      reiniciar();
      return undefined;
    }

    const MAX_Y = 7; // grados de giro horizontal
    const MAX_X = 5; // grados de cabeceo
    let objetivoX = 0;
    let objetivoY = 0;
    let x = 0;
    let y = 0;
    let fotograma = 0;

    const pintar = () => {
      x += (objetivoX - x) * 0.08;
      y += (objetivoY - y) * 0.08;
      const quieto = Math.abs(objetivoX - x) < 0.01 && Math.abs(objetivoY - y) < 0.01;
      if (quieto) {
        x = objetivoX;
        y = objetivoY;
      }
      elemento.style.setProperty("--inc-x", x.toFixed(3));
      elemento.style.setProperty("--inc-y", y.toFixed(3));
      fotograma = quieto ? 0 : requestAnimationFrame(pintar);
    };
    const arrancar = () => {
      if (!fotograma) fotograma = requestAnimationFrame(pintar);
    };

    const mover = (evento) => {
      if (evento.pointerType === "touch") return;
      const caja = elemento.getBoundingClientRect();
      const px = (evento.clientX - caja.left) / caja.width - 0.5;
      const py = (evento.clientY - caja.top) / caja.height - 0.5;
      objetivoY = Math.max(-1, Math.min(1, px * 2)) * MAX_Y;
      objetivoX = Math.max(-1, Math.min(1, py * 2)) * -MAX_X;
      arrancar();
    };
    const salir = () => {
      objetivoX = 0;
      objetivoY = 0;
      arrancar();
    };

    elemento.addEventListener("pointermove", mover);
    elemento.addEventListener("pointerleave", salir);
    return () => {
      elemento.removeEventListener("pointermove", mover);
      elemento.removeEventListener("pointerleave", salir);
      cancelAnimationFrame(fotograma);
      reiniciar();
    };
  }, [ref, activa]);
}
