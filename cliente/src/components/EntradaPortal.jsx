import { useCallback, useEffect, useRef, useState } from "react";
import GlyphPortal from "./ui/glyph-portal.jsx";
import { VistaWeb3D } from "./escena/VistaWeb3D.jsx";

const PALABRA = "PRESUPUESTA";
const FUENTE = '"Manrope", "Inter", Arial, sans-serif';
const FUENTE_RESERVA = '"Arial", sans-serif';
const ESPERA_MAXIMA = 1600;

const SPECS = [
  ["4 pasos", "Configuración"],
  ["100 %", "Calculado en servidor"],
  ["PDF", "Propuesta formal"],
  ["IA", "Asistente"],
];

function Flecha() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Entrada de la web: la palabra PRESUPUESTA se abre al hacer scroll y deja ver el
// hero. El portal mide la letra al montarse, así que Manrope 800
// debe estar cargada antes; mientras tanto se reserva el alto de la pantalla.
export function EntradaPortal() {
  const [fuente, setFuente] = useState(null);
  const raiz = useRef(null);

  useEffect(() => {
    let terminado = false;
    const terminar = (valor) => {
      if (!terminado) {
        terminado = true;
        setFuente(valor);
      }
    };
    const espera = setTimeout(() => terminar(FUENTE_RESERVA), ESPERA_MAXIMA);
    document.fonts.load('800 100px "Manrope"', PALABRA).then(
      (caras) => terminar(caras.length > 0 ? FUENTE : FUENTE_RESERVA),
      () => terminar(FUENTE_RESERVA)
    );
    return () => {
      terminado = true;
      clearTimeout(espera);
    };
  }, []);

  // El portal avisa del progreso (0 → 1) en cada fotograma. Se guarda en una variable
  // CSS, sin setState, para apagar el neón de las letras mientras la cámara entra.
  const alAvanzar = useCallback((progreso) => {
    raiz.current?.style.setProperty("--entrada", progreso.toFixed(3));
  }, []);

  if (!fuente) {
    return (
      <div className="portal-reserva" role="status" aria-label="Cargando">
        <span className="skeleton portal-reserva-palabra" />
      </div>
    );
  }

  return (
    <div className="entrada" ref={raiz}>
      <GlyphPortal
        className="portal"
        word={PALABRA}
        fontFamily={fuente}
        fontWeight={900}
        scrollLength={2.4}
        enterLabel="Entrar"
        onProgress={alAvanzar}
        background={<div className="entrada-campo" />}
        style={{
          "--gp-paper": "#f1f0ed",
          "--gp-ink": "#171716",
          "--gp-field": "#d1d0cc",
          "--gp-foreground": "#171716",
        }}
        front={
          <>
            <p className="etiqueta portal-antetitulo">Calculadora de presupuestos web</p>
            <p className="portal-apoyo">Pasa el cursor por una letra para entrar por ella.</p>
            <span className="portal-raton" aria-hidden="true">
              <span />
            </span>
          </>
        }
      >
        <div className="hero-fondo" aria-hidden="true" />
        <div className="hero-fundido" aria-hidden="true" />

        <div className="hero">
          <div className="hero-texto">
            <span className="fantasma hero-fantasma" aria-hidden="true">2026</span>
            <p className="etiqueta hero-etiqueta">Presupuesto web en tiempo real</p>
            <h1 className="titular hero-titular">
              <span className="hero-linea">Configura</span>{" "}
              <span className="hero-linea verde">tu web</span>
            </h1>
            <p className="entradilla hero-entradilla">
              Elige el tipo, el alcance y las funciones, y mira cómo tu web se construye en 3D mientras el servidor
              calcula el presupuesto al momento, con cada concepto a la vista.
            </p>
            <div className="hero-acciones">
              <a href="#calculadora" className="boton boton-grande">
                Empezar mi presupuesto <Flecha />
              </a>
              <a href="#asistente" className="boton-contorno hero-secundario">
                Describir mi proyecto
              </a>
            </div>
          </div>

          {/* La maqueta 3D hace de «foto de producto»: se configura sola en bucle */}
          <div className="hero-producto">
            <VistaWeb3D demo />
          </div>

          <ul className="specs hero-specs">
            {SPECS.map(([valor, etiqueta]) => (
              <li key={etiqueta} className="spec">
                <span className="spec-valor">{valor}</span>
                <span className="spec-etiqueta">{etiqueta}</span>
              </li>
            ))}
          </ul>
        </div>
      </GlyphPortal>
    </div>
  );
}
