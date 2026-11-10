import s from "./VistaWeb3D.module.css";
import m from "./Maquetas.module.css";

// Piezas pequeñas que comparten las maquetas y los módulos flotantes.

/** Texto de la maqueta: sin «Redacción» se ve como barra skeleton; con ella, como texto real. */
export function T({ children, className = "" }) {
  return <span className={`${m.t} ${className}`}>{children}</span>;
}

/** Spinner diminuto de la esquina mientras el módulo se construye. */
function SpinnerModulo({ fase }) {
  return fase === "construyendo" ? <span className={`spinner ${s.spinnerModulo}`} /> : null;
}

/**
 * Bloque de la página (una hoja 3D): se coloca a la profundidad `z` (múltiplo de --sep)
 * y entra escalonado según `i`. Si es un módulo, `fase` le da su propio ciclo de vida.
 */
export function Bloque({ i = 0, z = 1, fase, className = "", etiqueta = null, children, ...resto }) {
  return (
    <div className={`${s.bloque} ${className}`} data-fase={fase} style={{ "--i": i, "--z": z }} {...resto}>
      {children}
      <SpinnerModulo fase={fase} />
      {etiqueta}
    </div>
  );
}

/**
 * Módulo que flota alrededor de la ventana: un grupo plano colocado en Z (la posición
 * la pone su clase) con una tarjeta dentro que hace de skeleton → contenido.
 */
export function Flotante({ fase, className = "", tarjeta = "", etiqueta = null, extra = null, children }) {
  return (
    <div className={`${s.flotante} ${className}`} data-fase={fase}>
      {extra}
      <div className={`${s.bloque} ${tarjeta}`} data-fase={fase}>
        {children}
        <SpinnerModulo fase={fase} />
      </div>
      {etiqueta}
    </div>
  );
}

/** Pieza pequeña dentro de un bloque (selector de idioma, avatar…). */
export function Pieza({ fase, className = "", children }) {
  return (
    <span className={`${s.pieza} ${className}`} data-fase={fase}>
      {children}
    </span>
  );
}

/** Trazos de los iconos lineales (viewBox 24 × 24). */
const TRAZOS = {
  lapiz: "M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3",
  imagen: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9.5a1 1 0 1 0 0-.01",
  texto: "M5 6V4h14v2M12 4v16M9 20h6",
  rayo: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5",
  chat: "M4 5h16v11H9l-5 4V5z",
  lupa: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20",
  carrito: "M3 4h2l2.4 10.5h10.2L20 7H6.2M9.5 19.5a1 1 0 1 0 0-.01M17 19.5a1 1 0 1 0 0-.01",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
};

// Cada icono es un único <i> pintado con currentColor y recortado por una máscara SVG
// (un nodo en lugar de dos: la escena tiene un presupuesto de ~160 nodos).
const svg = (d, relleno) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${relleno ? "black" : "none"}' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${d}'/></svg>`;

const MASCARAS = Object.fromEntries(
  Object.entries(TRAZOS).map(([nombre, d]) => [nombre, `url("data:image/svg+xml,${encodeURIComponent(svg(d, nombre === "rayo"))}")`])
);

export function Icono({ nombre, className = "" }) {
  return <i className={`${m.svg} ${className}`} style={{ "--icono": MASCARAS[nombre] }} />;
}

/** Estilo con la máscara de un icono, para dibujarlo en un ::before sin nodo extra. */
export const icono = (nombre) => ({ "--icono": MASCARAS[nombre] });

/** Las tres herramientas del CMS en un solo elemento (tres capas de máscara). */
export const HERRAMIENTAS_CMS = { "--i1": MASCARAS.lapiz, "--i2": MASCARAS.imagen, "--i3": MASCARAS.texto };
