import { useEffect, useState } from "react";
import "./planes-mantenimiento.css";

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});

// Planes de mantenimiento mensuales (GET /api/mantenimiento).
// Son un servicio aparte que se contrata tras entregar la web:
// no se suman al presupuesto y sus precios los publica el servidor.
export function PlanesMantenimiento() {
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
    <ul className="mant-rejilla">
      {(planes ?? Array.from({ length: 3 }, (_, i) => ({ id: `cargando-${i}` }))).map((plan) => (
        <li key={plan.id} className="mant-plan" data-recomendado={plan.recomendado || undefined} data-cargando={!plan.nombre || undefined}>
          <div className="mant-cabecera">
            <h3>{plan.nombre ?? "Cargando…"}</h3>
            {plan.recomendado && <span className="mant-insignia">Recomendado</span>}
          </div>
          <p className="mant-descripcion">{plan.descripcion ?? " "}</p>
          <p className="mant-precio">
            <strong>{plan.precioMensual == null ? "—" : formatoEuros.format(plan.precioMensual)}</strong>
            <span>/mes</span>
          </p>
          <ul className="mant-lista">
            {(plan.incluye ?? []).map((texto) => (
              <li key={texto}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                {texto}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
