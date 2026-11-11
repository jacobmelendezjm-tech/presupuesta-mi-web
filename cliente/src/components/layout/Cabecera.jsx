import { useCallback, useEffect, useRef, useState } from "react";
import { NumeroAnimado } from "../ui/numero-animado.jsx";
import { useEstadoMinimo } from "../ui/use-estado-minimo.js";
import { LogoJM } from "./LogoJM.jsx";
import { useSeccionActiva } from "./useSeccionActiva.js";
import s from "./Cabecera.module.css";

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const CLAVE_TEMA = "presupuesta-mi-web-tema";

// Secciones en el orden de la página. Las que tienen «nav» salen también en la barra.
const SECCIONES = [
  { id: "calculadora", numero: "01", texto: "Configurador", nav: "Configurador" },
  { id: "asistente", numero: "02", texto: "Asistente IA", nav: "Asistente" },
  { id: "servicios", numero: "03", texto: "Servicios" },
  { id: "packs", numero: "04", texto: "Packs", nav: "Packs" },
  { id: "mantenimiento", numero: "05", texto: "Mantenimiento", nav: "Mantenimiento" },
  { id: "metodologia", numero: "06", texto: "Metodología" },
  { id: "preguntas", numero: "07", texto: "Preguntas", nav: "FAQ" },
];
const IDS_OBSERVADOS = ["inicio", ...SECCIONES.map((seccion) => seccion.id)];
const ENFOCABLES = "a[href], button:not([disabled])";

// Cabecera fija: logo, navegación con la sección visible marcada, estimación en
// directo (la calcula el servidor; aquí solo se muestra) y menú de secciones.
export function Cabecera({ total, calculando }) {
  const activa = useSeccionActiva(IDS_OBSERVADOS);
  const ocupado = useEstadoMinimo(calculando, 450); // el spinner no parpadea si el servidor va rápido
  const [abierto, setAbierto] = useState(false);
  const [temaOscuro, setTemaOscuro] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_TEMA) === "oscuro";
    } catch {
      return typeof document !== "undefined" && document.documentElement.dataset.tema === "oscuro";
    }
  });
  const boton = useRef(null);
  const menu = useRef(null);
  const interior = useRef(null);

  // Conserva la elección y coordina el color de la interfaz del navegador.
  useEffect(() => {
    const tema = temaOscuro ? "oscuro" : "claro";
    const raiz = document.documentElement;
    raiz.dataset.tema = tema;
    raiz.style.colorScheme = temaOscuro ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", temaOscuro ? "#181817" : "#f1f0ed");
    try {
      window.localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // La página sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  }, [temaOscuro]);

  // Al cerrar, el foco vuelve a la hamburguesa (salvo si se navega a una sección).
  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    const raiz = document.documentElement;
    raiz.classList.add("menu-abierto"); // bloquea el scroll de la página detrás del menú
    menu.current?.querySelector(ENFOCABLES)?.focus();

    const alTeclear = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
        return;
      }
      // Tab desde el último enlace del menú vuelve a la hamburguesa (no se escapa a la página)
      if (e.key === "Tab" && !e.shiftKey) {
        const enfocables = menu.current?.querySelectorAll(ENFOCABLES) ?? [];
        if (document.activeElement === enfocables[enfocables.length - 1]) {
          e.preventDefault();
          boton.current?.focus();
        }
      }
    };
    // Clic fuera del contenido del menú (en el fondo o en la página) = cerrar
    const alPulsar = (e) => {
      const objetivo = e.target;
      if (boton.current?.contains(objetivo)) return;
      const enElFondo = objetivo === menu.current || objetivo === interior.current;
      if (menu.current?.contains(objetivo) && !enElFondo) return;
      cerrar(!objetivo.closest?.(ENFOCABLES));
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("click", alPulsar);
    return () => {
      raiz.classList.remove("menu-abierto");
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("click", alPulsar);
    };
  }, [abierto, cerrar]);

  const textoTotal = total == null ? "sin calcular" : euros.format(total);

  return (
    <header className={s.cabecera} data-menu={abierto || undefined}>
      <a href="#calculadora" className={s.saltar}>Saltar al configurador</a>

      <div className={s.barra}>
        <a href="#inicio" className={s.marca} aria-label="Presupuesta, ir al inicio">
          <LogoJM className={s.logo} />
          <span className={s.marcaTexto}>Presupuesta</span>
        </a>

        <nav className={s.nav} aria-label="Principal">
          <ul className={s.enlaces}>
            {SECCIONES.filter((seccion) => seccion.nav).map(({ id, nav }) => (
              <li key={id}>
                <a href={`#${id}`} className={s.enlace} aria-current={activa === id ? "true" : undefined}>
                  {nav}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.acciones}>
          <a
            href="#calculadora"
            className={s.estimacion}
            data-calculando={ocupado || undefined}
            aria-label={`Estimación: ${textoTotal}. Ir al configurador`}
          >
            <span className={s.estimacionEtiqueta}>Estimación</span>
            <NumeroAnimado valor={total} formato={euros.format} className={s.estimacionValor} />
            <span className={s.estimacionEstado} aria-hidden="true">
              {ocupado ? (
                <span className="spinner" style={{ "--tam": "14px" }} />
              ) : (
                <span className={s.estimacionPunto} data-activo={total != null || undefined} />
              )}
            </span>
            {/* Destello verde cada vez que llega un total nuevo (la clave lo reinicia) */}
            {total != null && <span key={total} className={s.destello} aria-hidden="true" />}
          </a>

          <button
            type="button"
            className={s.tema}
            data-oscuro={temaOscuro || undefined}
            aria-pressed={temaOscuro}
            aria-label={temaOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={temaOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={() => setTemaOscuro((oscuro) => !oscuro)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {temaOscuro ? (
                <>
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </>
              ) : (
                <path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
              )}
            </svg>
            <span className={s.temaTexto}>{temaOscuro ? "Claro" : "Oscuro"}</span>
            <span className={s.temaInterruptor} aria-hidden="true"><span /></span>
          </button>

          <button
            ref={boton}
            type="button"
            className={s.hamburguesa}
            aria-expanded={abierto}
            aria-controls="menu-principal"
            aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
            onClick={() => setAbierto((valor) => !valor)}
          >
            <span className={s.lineas} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {/* Cerrado = hidden (display: none): no se puede enfocar ni lo leen los lectores */}
      <div id="menu-principal" ref={menu} className={s.menu} hidden={!abierto}>
        <span className={`fantasma ${s.menuFantasma}`} aria-hidden="true">Índice</span>
        <div ref={interior} className={s.menuInterior}>
          <nav aria-label="Secciones">
            <p className={`etiqueta ${s.menuEtiqueta}`}>Índice</p>
            <ol className={s.menuLista}>
              {SECCIONES.map(({ id, numero, texto }, i) => (
                <li key={id} style={{ "--i": i }}>
                  <a
                    href={`#${id}`}
                    className={s.menuEnlace}
                    aria-current={activa === id ? "true" : undefined}
                    onClick={() => cerrar(false)}
                  >
                    <span className={s.menuNumero} aria-hidden="true">{numero}</span>
                    {texto}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={s.menuLateral}>
            <p className="etiqueta">Tu estimación</p>
            <p className={s.menuTotal}>
              {total == null ? (
                <span className={s.menuSinTotal}>Sin calcular</span>
              ) : (
                <NumeroAnimado valor={total} formato={euros.format} />
              )}
              {ocupado && <span className="spinner" style={{ "--tam": "20px" }} aria-hidden="true" />}
            </p>
            <p className={s.menuNota}>
              {total == null
                ? "Elige un tipo de proyecto y el servidor la calcula al momento."
                : "Calculada por el servidor con cada elección."}
            </p>
            {/* Con un total ya calculado, el atajo lleva directamente al desglose */}
            <a href={total == null ? "#calculadora" : "#desglose"} className="boton" onClick={() => cerrar(false)}>
              {total == null ? "Empezar mi presupuesto" : "Ver mi presupuesto"}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
