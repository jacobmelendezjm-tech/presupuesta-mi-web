import { LogoJM } from "./LogoJM.jsx";
import s from "./Pie.module.css";

const TEXTO_ESTADO = {
  ok: "API en línea",
  error: "API sin conexión",
  comprobando: "Comprobando la API…",
};

// Pie como la referencia: palabra fantasma gigante, caja de borde fino con la
// autoría, estado de GET /api/estado y semicírculo verde para volver arriba.
export function Pie({ estadoApi }) {
  return (
    <footer className={s.pie}>
      <span className={`fantasma ${s.fantasma}`} aria-hidden="true">Presupuesta</span>

      <div className={s.interior}>
        <div className={s.fila}>
          <p className={s.marca}>
            <LogoJM className={s.logo} />
            Presupuesta
          </p>
          <p className={s.estado} data-estado={estadoApi} title="GET /api/estado">
            {estadoApi === "ok" && <span className="punto-vivo" aria-hidden="true" />}
            {estadoApi === "error" && <span className={s.puntoError} aria-hidden="true" />}
            {estadoApi === "comprobando" && <span className="spinner" style={{ "--tam": "12px" }} aria-hidden="true" />}
            {TEXTO_ESTADO[estadoApi] ?? TEXTO_ESTADO.comprobando}
          </p>
        </div>

        <div className={s.base}>
          <p className={s.nota}>
            Precios sin impuestos y tarifas ficticias de la actividad. Los presupuestos no se guardan.
          </p>
          <p className={s.caja}>
            <strong>Presupuesta mi web</strong>
            <span className={s.separador} aria-hidden="true">|</span>
            0613 · Desarrollo web en entorno servidor
          </p>
        </div>
      </div>

      <a href="#inicio" className={s.arriba} aria-label="Volver arriba">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
          <path d="M6 14.5l6-6 6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </footer>
  );
}
