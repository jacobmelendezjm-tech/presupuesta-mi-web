import { useEffect, useState } from "react";
import "./planes-mantenimiento.css";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});

function Check({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// Tarjeta skeleton mientras llegan los planes del servidor (con la forma de la real).
function EsqueletoPlan() {
  return (
    <div className="mant-esqueleto">
      <span className="skeleton mant-esq-titulo" />
      <span className="skeleton mant-esq-linea" />
      <span className="skeleton mant-esq-linea mant-esq-corta" />
      <span className="skeleton mant-esq-precio" />
      <span className="skeleton mant-esq-linea" />
      <span className="skeleton mant-esq-linea" />
      <span className="skeleton mant-esq-linea mant-esq-corta" />
      <span className="skeleton mant-esq-boton" />
    </div>
  );
}

// Planes de mantenimiento mensuales (GET /api/mantenimiento).
// Son un servicio aparte que se contrata tras entregar la web:
// no se suman al presupuesto y sus precios los publica el servidor.
// El plan elegido vive en App para poder mostrarlo también en el desglose.
export function PlanesMantenimiento({ planElegido, onElegir }) {
  const [planes, setPlanes] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/mantenimiento")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setPlanes(d.planes))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="mant-error">No se pudieron cargar los planes. ¿Está la API en marcha?</p>;
  }

  return (
    <>
    <ul
      className="mant-rejilla"
      data-con-plan={planElegido ? true : undefined}
      aria-busy={planes ? undefined : true}
      aria-label={planes ? undefined : "Cargando los planes de mantenimiento"}
    >
      {(planes ?? Array.from({ length: 3 }, (_, i) => ({ id: `cargando-${i}` }))).map((plan) => {
        const elegido = planElegido?.id === plan.id;
        return (
        <li
          key={plan.id}
          className="mant-plan revelar"
          data-recomendado={plan.recomendado || undefined}
          data-cargando={!plan.nombre || undefined}
          data-elegido={elegido || undefined}
          aria-hidden={!plan.nombre || undefined}
        >
          {plan.nombre ? (
            <>
              <div className="mant-cabecera">
                <h3>{plan.nombre}</h3>
                {plan.recomendado && <span className="mant-insignia">Recomendado</span>}
              </div>
              <p className="mant-descripcion">{plan.descripcion ?? " "}</p>
              <p className="mant-precio">
                <strong>{plan.precioMensual == null ? "—" : formatoEuros.format(plan.precioMensual)}</strong>
                <span>/mes</span>
              </p>
              <ul className="mant-lista">
                {(plan.incluye ?? []).map((texto) => (
                  <li key={texto}>
                    <Check />
                    {texto}
                  </li>
                ))}
              </ul>
              {/* El ::after del botón cubre la tarjeta: se puede pulsar entera. */}
              <button
                type="button"
                className="boton-contorno mant-boton"
                disabled={!plan.nombre}
                onClick={() => onElegir(elegido ? null : plan)}
              >
                {elegido && <Check className="mant-boton-check" />}
                {elegido ? "Elegido" : "Elegir"}
                <span className="oculto"> plan {plan.nombre}</span>
              </button>
            </>
          ) : (
            <EsqueletoPlan />
          )}
        </li>
        );
      })}
    </ul>
    {planes && (
      <p className="mant-estado" aria-live="polite">
        {planElegido ? (
          <>
            <span className="mant-estado-texto">
              <Check className="mant-estado-check" />
              <span>
                Plan {planElegido.nombre} elegido: {formatoEuros.format(planElegido.precioMensual)}/mes, aparte del
                presupuesto de creación.
              </span>
            </span>
            <a href="#desglose" className="enlace mant-enlace">Ver mi presupuesto</a>
            <button type="button" className="boton-texto mant-quitar" onClick={() => onElegir(null)}>Quitar plan</button>
          </>
        ) : (
          "Elige un plan o sigue sin mantenimiento: es opcional."
        )}
      </p>
    )}
    </>
  );
}
