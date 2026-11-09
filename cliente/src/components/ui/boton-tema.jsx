import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "./boton-tema.css";

const CLAVE = "tema";

// Tema inicial: el que eligió la persona (localStorage) o el del sistema.
// index.html ya lo aplica antes de pintar la página para evitar un parpadeo.
function temaInicial() {
  const actual = document.documentElement.dataset.theme;
  if (actual === "dark" || actual === "light") return actual;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function guardar(tema) {
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // Sin almacenamiento (modo privado): el tema solo dura esta visita.
  }
}

function elegido() {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

// Botón que alterna entre modo claro y nocturno.
// El cambio se anima con un círculo que crece desde el propio botón.
export function BotonTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", tema);
  }, [tema]);

  // Si nadie ha elegido tema, sigue al del sistema cuando cambie.
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (e) => {
      if (!elegido()) setTema(e.matches ? "dark" : "light");
    };
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const alternar = (evento) => {
    const nuevo = tema === "dark" ? "light" : "dark";
    guardar(nuevo);

    const aplicar = () => {
      flushSync(() => setTema(nuevo));
      document.documentElement.dataset.theme = nuevo;
    };

    const sinAnimacion =
      !document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinAnimacion) {
      aplicar();
      return;
    }

    // Centro del botón y radio hasta la esquina más lejana de la ventana.
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = caja.left + caja.width / 2;
    const y = caja.top + caja.height / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    document.startViewTransition(aplicar).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(0.28, 0.11, 0.32, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  };

  const oscuro = tema === "dark";

  return (
    <button
      type="button"
      className="boton-tema"
      data-tema={tema}
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo nocturno"}
      title={oscuro ? "Modo claro" : "Modo nocturno"}
    >
      {/* Sol: círculo + rayos. En modo nocturno el círculo crece, los rayos
          desaparecen y una máscara recorta la luna. */}
      <svg className="boton-tema-icono" viewBox="0 0 24 24" aria-hidden="true">
        <mask id="boton-tema-mascara">
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          <circle className="boton-tema-sombra" cx="24" cy="2" r="7" fill="#000" />
        </mask>
        <circle className="boton-tema-astro" cx="12" cy="12" r="5" fill="currentColor" mask="url(#boton-tema-mascara)" />
        <g className="boton-tema-rayos" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}
