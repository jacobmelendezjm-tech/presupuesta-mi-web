import { useEffect, useState } from "react";
import PricingSection from "./components/ui/pricing.jsx";
import { PlanesMantenimiento } from "./components/ui/planes-mantenimiento.jsx";
import { AsistenteIA } from "./components/ui/asistente-ia.jsx";
import { EntradaPortal } from "./components/EntradaPortal.jsx";
import { Calculadora } from "./components/calculadora/Calculadora.jsx";
import { useCalculator } from "./components/calculadora/useCalculator.js";
import { Cabecera } from "./components/layout/Cabecera.jsx";
import { Pie } from "./components/layout/Pie.jsx";

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });

const METODOLOGIA = [
  { titulo: "Eliges", texto: "Seleccionas el tipo de proyecto, el alcance y las funcionalidades. El navegador nunca envía un precio." },
  { titulo: "El servidor valida", texto: "Cada selección se comprueba contra el catálogo. Si algo no encaja, recibes un error claro." },
  { titulo: "El servidor calcula", texto: "Aplica sus propias tarifas y devuelve el desglose línea a línea." },
];

const PREGUNTAS = [
  ["¿El importe es definitivo?", "Es una estimación orientativa sin impuestos. El importe final se confirma al definir el alcance del proyecto."],
  ["¿Quién calcula el precio?", "Siempre el servidor, con sus propias tarifas. El navegador solo envía las opciones que eliges."],
  ["¿Se guardan mis datos?", "No. Cada cálculo se hace al momento y el nombre solo se usa para generar tu PDF."],
  ["¿El mantenimiento está incluido?", "No. Es un servicio mensual y opcional que aparece aparte y nunca se suma al total."],
  ["¿Y si no sé qué necesito?", "Describe tu proyecto en el asistente: propone servicios del catálogo y tú decides cuáles confirmar."],
];

// Nombre corto de cada tarifa para la etiqueta verde (el texto largo lo manda el servidor)
const NOMBRE_TARIFA = {
  landing: "Landing",
  corporativa: "Web corporativa",
  paginaAdicional: "Página extra",
  formulario: "Formulario",
  segundoIdioma: "Segundo idioma",
};

const dosCifras = (n) => String(n).padStart(2, "0");

function Flecha() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Cabecera de sección como la referencia: antetítulo verde numerado, titular
// pesado con una palabra en verde y una palabra fantasma gigante detrás.
function CabeceraSeccion({ id, etiqueta, fantasma, entradilla, children }) {
  return (
    <header className="seccion-cabecera">
      <span className="fantasma seccion-fantasma" aria-hidden="true">{fantasma}</span>
      <p className="etiqueta revelar">{etiqueta}</p>
      <h2 className="titular revelar" id={id}>{children}</h2>
      {entradilla && <p className="entradilla revelar">{entradilla}</p>}
    </header>
  );
}

export default function App() {
  const c = useCalculator();
  const [estadoApi, setEstadoApi] = useState("comprobando");
  const [tarifas, setTarifas] = useState(null);

  // GET /api/estado y GET /api/tarifas al cargar.
  useEffect(() => {
    fetch("/api/estado")
      .then((r) => r.json())
      .then((d) => setEstadoApi(d.status === "ok" ? "ok" : "error"))
      .catch(() => setEstadoApi("error"));
    fetch("/api/tarifas")
      .then((r) => r.json())
      .then((d) => setTarifas(d.tarifas ?? []))
      .catch(() => setTarifas([]));
  }, []);

  const precioIdioma = tarifas?.find((t) => t.concepto === "segundoIdioma")?.precio;

  const elegirPack = (config) => {
    c.cargarPack(config);
    document.getElementById("calculadora")?.scrollIntoView();
  };

  return (
    <>
      <Cabecera total={c.estimacion?.total ?? null} calculando={Boolean(c.calculando)} />

      <main>
        <div id="inicio">
          <EntradaPortal />
        </div>

        <section className="seccion seccion-configurador" id="calculadora" aria-label="Configurador">
          <Calculadora c={c} />
          <p className="alternativa">
            <span className="alternativa-icono" aria-hidden="true">IA</span>
            <span>¿Prefieres contarlo con tus palabras?</span>
            <a href="#asistente" className="enlace alternativa-enlace">
              Describe tu proyecto al asistente <Flecha />
            </a>
          </p>
        </section>

        <section className="seccion seccion-alterna" id="asistente">
          <AsistenteIA />
        </section>

        <section className="seccion" id="servicios" aria-labelledby="titulo-servicios">
          <div className="seccion-interior">
            <CabeceraSeccion
              id="titulo-servicios"
              etiqueta="03 — Servicios"
              fantasma="Tarifas"
              entradilla={
                <>
                  Publicadas por el servidor en <code>GET /api/tarifas</code>. El navegador solo las muestra: nunca
                  calcula un importe.
                </>
              }
            >
              Servicios y <span className="verde">tarifas</span>
            </CabeceraSeccion>

            {tarifas == null ? (
              <ul className="tarifas" aria-busy="true" aria-label="Cargando tarifas">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="tarifa">
                    <span className="skeleton tarifa-hueco-valor" />
                    <span className="skeleton tarifa-hueco-etiqueta" />
                    <span className="skeleton tarifa-hueco-texto" />
                  </li>
                ))}
              </ul>
            ) : tarifas.length === 0 ? (
              <p className="texto-error">No se pudieron cargar las tarifas. ¿Está la API en marcha?</p>
            ) : (
              <ul className="tarifas">
                {tarifas.map((t) => (
                  <li key={t.concepto} className="tarifa revelar">
                    <strong className="tarifa-valor">{euros.format(t.precio)}</strong>
                    <span className="tarifa-etiqueta">{NOMBRE_TARIFA[t.concepto] ?? t.concepto}</span>
                    <p className="tarifa-descripcion">{t.descripcion}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="seccion seccion-alterna" id="packs">
          <PricingSection onElegir={elegirPack} precioIdioma={precioIdioma == null ? null : euros.format(precioIdioma)} />
        </section>

        <section className="seccion" id="mantenimiento" aria-labelledby="titulo-mantenimiento">
          <div className="seccion-interior">
            <CabeceraSeccion
              id="titulo-mantenimiento"
              etiqueta="05 — Mantenimiento"
              fantasma="Soporte"
              entradilla="Planes mensuales opcionales, sin permanencia y fuera del presupuesto de creación."
            >
              Mantenimiento <span className="verde">mensual</span>
            </CabeceraSeccion>
            <PlanesMantenimiento planElegido={c.plan} onElegir={(plan) => c.setPlanId(plan?.id ?? null)} />
          </div>
        </section>

        <section className="seccion seccion-alterna" id="metodologia" aria-labelledby="titulo-metodologia">
          <div className="seccion-interior">
            <CabeceraSeccion
              id="titulo-metodologia"
              etiqueta="06 — Metodología"
              fantasma="Proceso"
              entradilla="Un proceso transparente de principio a fin."
            >
              Cómo se <span className="verde">calcula</span>
            </CabeceraSeccion>

            <ol className="metodo-lista">
              {METODOLOGIA.map((p, i) => (
                <li key={p.titulo} className="metodo revelar">
                  <span className="metodo-numero" aria-hidden="true">{dosCifras(i + 1)}</span>
                  <h3 className="metodo-titulo">{p.titulo}</h3>
                  <p className="metodo-texto">{p.texto}</p>
                </li>
              ))}
            </ol>

            {c.intercambio ? (
              <details className="tecnico">
                <summary className="tecnico-resumen">
                  <span className="tecnico-titulo">Ver la última petición al servidor</span>
                  <code className="tecnico-ruta">POST /api/estimacion</code>
                  <span className="tecnico-http" data-error={c.intercambio.estado >= 400 || undefined}>
                    HTTP {c.intercambio.estado}
                  </span>
                  <span className="tecnico-chevron" aria-hidden="true" />
                </summary>
                <pre className="tecnico-codigo">
                  {JSON.stringify({ solicitud: c.intercambio.solicitud, respuesta: c.intercambio.datos }, null, 2)}
                </pre>
              </details>
            ) : (
              <p className="tecnico tecnico-vacio">
                <span className="tecnico-punto" aria-hidden="true" />
                Aún no hay peticiones. Elige un tipo de proyecto en el{" "}
                <a href="#calculadora" className="enlace">configurador</a> y aquí verás lo que se envía y lo que responde el
                servidor.
              </p>
            )}
          </div>
        </section>

        <section className="seccion" id="preguntas" aria-labelledby="titulo-preguntas">
          <div className="seccion-interior preguntas-distribucion">
            <CabeceraSeccion
              id="titulo-preguntas"
              etiqueta="07 — Preguntas"
              fantasma="FAQ"
              entradilla="Lo esencial antes de pedir tu presupuesto."
            >
              Preguntas <span className="verde">frecuentes</span>
            </CabeceraSeccion>

            <div className="preguntas">
              {PREGUNTAS.map(([pregunta, respuesta], i) => (
                <details key={pregunta} className="pregunta revelar" name="preguntas">
                  <summary className="pregunta-resumen">
                    <span className="pregunta-numero" aria-hidden="true">{dosCifras(i + 1)}</span>
                    <span className="pregunta-texto">{pregunta}</span>
                    <span className="pregunta-icono" aria-hidden="true" />
                  </summary>
                  <p className="pregunta-respuesta">{respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Pie estadoApi={estadoApi} />
    </>
  );
}
