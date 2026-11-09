import { useEffect, useState } from "react";
import GlyphPortal from "./ui/glyph-portal.jsx";

const PALABRA = "PRESUPUESTA";
const FUENTE = '"Inter", Arial, sans-serif';
const FUENTE_RESERVA = "Arial, sans-serif";
const ESPERA_MAXIMA = 1600;

const FONDO = {
  position: "absolute",
  inset: 0,
  transform: "scale(var(--gp-field-scale, 1))",
  background:
    "radial-gradient(circle at 20% 12%, rgba(37, 99, 235, 0.55), transparent 38%), radial-gradient(circle at 82% 78%, rgba(30, 41, 59, 0.9), transparent 46%), linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)",
};

// Entrada de la web: el portal mide la letra al montarse, así que la fuente
// debe estar cargada antes. Mientras tanto se reserva el alto de la pantalla.
export function EntradaPortal() {
  const [fuente, setFuente] = useState(null);

  useEffect(() => {
    let terminado = false;
    const terminar = (valor) => {
      if (!terminado) {
        terminado = true;
        setFuente(valor);
      }
    };
    const espera = setTimeout(() => terminar(FUENTE_RESERVA), ESPERA_MAXIMA);
    document.fonts.load('700 100px "Inter"', PALABRA).then(
      (caras) => terminar(caras.length > 0 ? FUENTE : FUENTE_RESERVA),
      () => terminar(FUENTE_RESERVA)
    );
    return () => {
      terminado = true;
      clearTimeout(espera);
    };
  }, []);

  if (!fuente) return <div className="portal-reserva" role="status" aria-label="Cargando" />;

  return (
    <GlyphPortal
      word={PALABRA}
      fontFamily={fuente}
      fontWeight={700}
      scrollLength={2.4}
      enterLabel="Entrar"
      background={<div style={FONDO} />}
      style={{
        "--gp-paper": "#f4f5f7",
        "--gp-ink": "#0f172a",
        "--gp-field": "#0f172a",
        "--gp-foreground": "#ffffff",
        fontFamily: fuente,
      }}
      front={
        <>
          <p className="portal-antetitulo">Calculadora de presupuesto web</p>
          <p className="portal-apoyo">Pasa el cursor por una letra para entrar por ella.</p>
        </>
      }
    >
      <div className="portal-contenido">
        <h1>Calculadora de Presupuesto Web</h1>
        <p className="portal-subtitulo">Obtén un estimado preciso para tu proyecto en 3 minutos.</p>
        <p className="portal-texto">
          Cada concepto tiene un precio visible y el desglose se actualiza con cada elección, para que sepas
          exactamente qué estás pagando y por qué.
        </p>
        <a href="#calculadora" className="boton boton-grande">Empezar mi presupuesto</a>
      </div>
    </GlyphPortal>
  );
}
