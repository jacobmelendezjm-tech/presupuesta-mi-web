import "./panel-jarvis.css";

function Metrica({ nombre, valor, progreso }) {
  const porcentaje = Math.max(0, Math.min(100, Math.round(progreso)));
  return (
    <div className="jarvis-metrica">
      <span>{nombre}</span>
      <output>{valor}</output>
      <div className="jarvis-barra" role="progressbar" aria-label={nombre} aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje}>
        <span style={{ "--p": porcentaje / 100 }} />
      </div>
    </div>
  );
}

function Panel({ id, titulo, texto, children }) {
  return (
    <article className="jarvis-panel">
      <header className="jarvis-cabecera">
        <span className="jarvis-id">{id}</span>
        <span className="jarvis-carga" aria-hidden="true"><i /><i /><i /></span>
      </header>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </article>
  );
}

// Tres paneles con datos reales de la página: la configuración elegida, el
// reparto del total calculado por el servidor y el estado de la API.
export function PanelJarvis({ paginas, paginasMax, extrasActivos, extrasTotal, presupuesto, estadoApi, hayTarifas, ultimoEstado }) {
  const total = presupuesto?.total;
  const parte = (importe) => (total ? (importe / total) * 100 : 0);
  const textoParte = (importe) => (total ? `${Math.round(parte(importe))}%` : "—");
  const extras = presupuesto ? presupuesto.formulario + presupuesto.segundoIdioma : 0;
  const apiActiva = estadoApi === "ok";
  const respuestaCorrecta = ultimoEstado >= 200 && ultimoEstado < 300;

  return (
    <>
      <Panel id="MOD-01" titulo="Web Diagnostics" texto="Lo que has configurado para tu web.">
        <Metrica nombre="Páginas" valor={`${paginas} / ${paginasMax}`} progreso={(paginas / paginasMax) * 100} />
        <Metrica nombre="Extras activos" valor={`${extrasActivos} / ${extrasTotal}`} progreso={(extrasActivos / extrasTotal) * 100} />
      </Panel>

      <Panel id="MOD-02" titulo="Energy Core" texto="Cómo se reparte el total que calcula el servidor.">
        <Metrica nombre="Precio base" valor={textoParte(presupuesto?.base ?? 0)} progreso={parte(presupuesto?.base ?? 0)} />
        <Metrica nombre="Páginas adicionales" valor={textoParte(presupuesto?.paginasAdicionales ?? 0)} progreso={parte(presupuesto?.paginasAdicionales ?? 0)} />
        <Metrica nombre="Extras" valor={textoParte(extras)} progreso={parte(extras)} />
      </Panel>

      <Panel id="MOD-03" titulo="Telemetry Data" texto="Estado de la conexión con la API.">
        <Metrica nombre="API" valor={apiActiva ? "ONLINE" : estadoApi === "error" ? "OFFLINE" : "…"} progreso={apiActiva ? 100 : 0} />
        <Metrica nombre="Tarifas recibidas" valor={hayTarifas ? "OK" : "—"} progreso={hayTarifas ? 100 : 0} />
        <Metrica nombre="Última respuesta" valor={ultimoEstado ? `HTTP ${ultimoEstado}` : "—"} progreso={respuestaCorrecta ? 100 : 0} />
      </Panel>
    </>
  );
}
