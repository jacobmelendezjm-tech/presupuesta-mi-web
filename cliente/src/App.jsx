import { useEffect, useState } from "react";
import PricingSection from "./components/ui/pricing.jsx";
import { PlanesMantenimiento } from "./components/ui/planes-mantenimiento.jsx";
import { AsistenteIA } from "./components/ui/asistente-ia.jsx";
import { EntradaPortal } from "./components/EntradaPortal.jsx";
import { Calculadora } from "./components/calculadora/Calculadora.jsx";
import { useCalculator } from "./components/calculadora/useCalculator.js";

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

function LogoJM({ className = "logo" }) {
  return (
    <svg className={className} viewBox="0 0 46 26" fill="none" aria-hidden="true">
      <path d="M3 18a5 5 0 0 0 10 0V3M19 23V3l8 11 8-11v20" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42" cy="21" r="2.4" fill="var(--azul)" />
    </svg>
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
      .then((d) => setTarifas(d.tarifas))
      .catch(() => setTarifas([]));
  }, []);

  const precioIdioma = tarifas?.find((t) => t.concepto === "segundoIdioma")?.precio;

  const elegirPack = (config) => {
    c.cargarPack(config);
    document.getElementById("calculadora")?.scrollIntoView();
  };

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-interior">
          <a href="#inicio" className="marca" aria-label="Presupuesta, ir al inicio">
            <LogoJM />
            Presupuesta
          </a>
          <nav aria-label="Secundaria">
            <ul className="cabecera-enlaces">
              <li><a href="#metodologia">Metodología</a></li>
              <li><a href="#servicios">Servicios</a></li>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
            </ul>
          </nav>
          <p className="cabecera-estimacion">
            Estimación: <strong>{euros.format(c.estimacion?.total ?? 0)}</strong>
          </p>
        </div>
      </header>

      <main>
        <div id="inicio">
          <EntradaPortal />
        </div>

        <section className="seccion" id="calculadora" aria-label="Calculadora">
          <Calculadora c={c} />
          <p className="alternativa">
            ¿Prefieres contarlo con tus palabras? <a href="#asistente" className="enlace">Describe tu proyecto al asistente</a>
          </p>
        </section>

        <section className="seccion seccion-blanca" id="asistente">
          <AsistenteIA />
        </section>

        <section className="seccion" id="servicios">
          <div className="seccion-cabecera">
            <h2 className="titular">Servicios y tarifas base</h2>
            <p className="entradilla">Publicadas por el servidor en <code>GET /api/tarifas</code>.</p>
          </div>
          <ul className="rejilla-tarifas">
            {(tarifas ?? []).map((t) => (
              <li key={t.concepto} className="tarifa">
                <p>{t.descripcion}</p>
                <strong>{euros.format(t.precio)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="seccion seccion-blanca" id="packs">
          <PricingSection onElegir={elegirPack} precioIdioma={precioIdioma == null ? null : euros.format(precioIdioma)} />
        </section>

        <section className="seccion" id="mantenimiento">
          <div className="seccion-cabecera">
            <h2 className="titular">Mantenimiento</h2>
            <p className="entradilla">Planes mensuales opcionales, sin permanencia y fuera del presupuesto de creación.</p>
          </div>
          <PlanesMantenimiento planElegido={c.plan} onElegir={(plan) => c.setPlanId(plan?.id ?? null)} />
        </section>

        <section className="seccion seccion-blanca" id="metodologia">
          <div className="seccion-cabecera">
            <h2 className="titular">Metodología</h2>
            <p className="entradilla">Un proceso transparente de principio a fin.</p>
          </div>
          <ol className="metodologia">
            {METODOLOGIA.map((p, i) => (
              <li key={p.titulo}>
                <span className="metodologia-numero">{i + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
          {c.intercambio && (
            <details className="tecnico">
              <summary>Ver la última petición al servidor (HTTP {c.intercambio.estado})</summary>
              <pre>{JSON.stringify({ solicitud: c.intercambio.solicitud, respuesta: c.intercambio.datos }, null, 2)}</pre>
            </details>
          )}
        </section>

        <section className="seccion" id="preguntas">
          <div className="seccion-cabecera">
            <h2 className="titular">Preguntas frecuentes</h2>
          </div>
          <div className="preguntas">
            {PREGUNTAS.map(([pregunta, respuesta]) => (
              <details key={pregunta}>
                <summary>{pregunta}</summary>
                <p>{respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="pie-interior">
          <p>Precios sin impuestos y tarifas ficticias de la actividad. Los presupuestos no se guardan.</p>
          <div className="pie-linea">
            <span className="pie-marca">
              <LogoJM className="logo logo-pie" />
              Presupuesta mi web · 0613 · Desarrollo web en entorno servidor
            </span>
            <span className={`estado estado-${estadoApi}`} title="GET /api/estado">
              <span className="estado-punto" aria-hidden="true" />
              {estadoApi === "ok" ? "API en línea" : estadoApi === "error" ? "API sin conexión" : "Comprobando…"}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
