import { useState } from "react";
import s from "./Calculadora.module.css";

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const precioDe = (o) => `+${euros.format(o.precio)}${o.periodo ? "/mes" : ""}`;

const PASOS = ["Tipo de proyecto", "Alcance y diseño", "Funcionalidades", "Mantenimiento y plazos"];

function Check() {
  return (
    <svg className={s.check} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Tarjeta({ tipo = "checkbox", nombreGrupo, activa, alCambiar, titulo, descripcion, precio }) {
  return (
    <label className={s.tarjeta} data-activa={activa || undefined}>
      <input type={tipo} name={nombreGrupo} checked={activa} onChange={alCambiar} className="oculto" />
      <span className={s.tarjetaCabecera}>
        <span className={s.tarjetaTitulo}>{titulo}</span>
        <span className={s.marca} data-radio={tipo === "radio" || undefined}>{activa && <Check />}</span>
      </span>
      {descripcion && <span className={s.tarjetaTexto}>{descripcion}</span>}
      {precio && <span className={s.tarjetaPrecio}>{precio}</span>}
    </label>
  );
}

function Rejilla({ children }) {
  return <div className={s.rejilla}>{children}</div>;
}

function PasoTipo({ c }) {
  return (
    <Rejilla>
      {c.catalogo.tipos.map((t) => (
        <Tarjeta
          key={t.id}
          tipo="radio"
          nombreGrupo="tipo-proyecto"
          activa={c.tipo === t.id}
          alCambiar={() => c.setTipo(t.id)}
          titulo={t.nombre}
          descripcion={t.descripcion}
          precio={`Desde ${euros.format(t.precio)}`}
        />
      ))}
    </Rejilla>
  );
}

function PasoAlcance({ c }) {
  const { opciones: todas, paginasMax } = c.catalogo;
  const porPaginas = c.tipo === "landing" || c.tipo === "corporativa";

  return (
    <>
      <h4 className={s.subtitulo}>Enfoque de diseño</h4>
      <Rejilla>
        {todas.filter((o) => o.grupo === "diseno").map((o) => (
          <Tarjeta key={o.id} activa={c.opciones.includes(o.id)} alCambiar={() => c.alternarOpcion(o.id)} titulo={o.nombre} descripcion={o.descripcion} precio={precioDe(o)} />
        ))}
      </Rejilla>

      <h4 className={s.subtitulo}>Contenidos</h4>
      <Rejilla>
        {todas.filter((o) => o.grupo === "contenido").map((o) => (
          <Tarjeta key={o.id} activa={c.opciones.includes(o.id)} alCambiar={() => c.alternarOpcion(o.id)} titulo={o.nombre} descripcion={o.descripcion} precio={precioDe(o)} />
        ))}
      </Rejilla>

      {porPaginas && (
        <>
          <h4 className={s.subtitulo} id="titulo-paginas">Número de páginas</h4>
          <div className={s.stepper} role="group" aria-labelledby="titulo-paginas">
            <button type="button" className={s.stepperBoton} disabled={c.paginas <= 1} onClick={() => c.setPaginas(c.paginas - 1)} aria-label="Quitar una página">−</button>
            <output className={s.stepperValor}>{c.paginas}</output>
            <button type="button" className={s.stepperBoton} disabled={c.paginas >= paginasMax} onClick={() => c.setPaginas(c.paginas + 1)} aria-label="Añadir una página">+</button>
            <span className={s.stepperNota}>La primera está incluida en el tipo de proyecto.</span>
          </div>
        </>
      )}
    </>
  );
}

function PasoFunciones({ c }) {
  return (
    <Rejilla>
      {c.catalogo.opciones.filter((o) => o.grupo === "funcion").map((o) => (
        <Tarjeta key={o.id} activa={c.opciones.includes(o.id)} alCambiar={() => c.alternarOpcion(o.id)} titulo={o.nombre} descripcion={o.descripcion} precio={precioDe(o)} />
      ))}
    </Rejilla>
  );
}

function PasoPlazos({ c }) {
  return (
    <>
      <h4 className={s.subtitulo}>Plazos y soporte</h4>
      <Rejilla>
        {c.catalogo.opciones.filter((o) => o.grupo === "plazo").map((o) => (
          <Tarjeta key={o.id} activa={c.opciones.includes(o.id)} alCambiar={() => c.alternarOpcion(o.id)} titulo={o.nombre} descripcion={o.descripcion} precio={precioDe(o)} />
        ))}
      </Rejilla>

      <h4 className={s.subtitulo}>Mantenimiento mensual</h4>
      <Rejilla>
        <Tarjeta tipo="radio" nombreGrupo="plan" activa={c.planId === null} alCambiar={() => c.setPlanId(null)} titulo="Sin mantenimiento" descripcion="Podrás contratarlo más adelante." />
        {c.catalogo.planes.map((p) => (
          <Tarjeta key={p.id} tipo="radio" nombreGrupo="plan" activa={c.planId === p.id} alCambiar={() => c.setPlanId(p.id)} titulo={p.nombre} descripcion={p.descripcion} precio={`${euros.format(p.precioMensual)}/mes`} />
        ))}
      </Rejilla>
    </>
  );
}

const CONTENIDO = [PasoTipo, PasoAlcance, PasoFunciones, PasoPlazos];

function Resumen({ c }) {
  const [cliente, setCliente] = useState("");
  const [estado, setEstado] = useState({ cargando: false, error: null });
  const { estimacion } = c;

  const solicitarPdf = async (evento) => {
    evento.preventDefault();
    setEstado({ cargando: true, error: null });
    try {
      await c.descargarPdf(cliente);
      setEstado({ cargando: false, error: null });
    } catch (error) {
      setEstado({ cargando: false, error: error.message });
    }
  };

  return (
    <aside className={s.resumen} aria-label="Resumen del presupuesto">
      <p className={s.resumenEtiqueta}>Estimación total</p>
      <p className={s.resumenTotal} aria-live="polite">{euros.format(estimacion?.total ?? 0)}</p>
      <p className={s.nota}>Sin impuestos · calculado por el servidor</p>

      {estimacion ? (
        <ul className={s.lineas}>
          {estimacion.lineas.map((l) => (
            <li key={l.id} className={s.linea}>
              <span>
                {l.nombre}
                {l.unidad && <small className={s.lineaDetalle}> · {l.cantidad} × {euros.format(l.precioUnitario)}</small>}
              </span>
              <strong>{euros.format(l.importe)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.vacio}>Elige un tipo de proyecto para empezar.</p>
      )}

      {estimacion?.mensual.length > 0 && (
        <div className={s.mensual}>
          <p className={s.resumenEtiqueta}>Servicios mensuales (no incluidos)</p>
          <ul className={s.lineas}>
            {estimacion.mensual.map((m) => (
              <li key={m.id} className={s.linea}>
                <span>{m.nombre}</span>
                <strong>{euros.format(m.importe)}/mes</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.error && <p className="texto-error" role="alert">{c.error}</p>}

      <form className={s.formulario} onSubmit={solicitarPdf}>
        <label className={s.campo}>
          Nombre o empresa
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={120} required placeholder="Empresa S.L." />
        </label>
        <button type="submit" className="boton boton-grande" disabled={!estimacion || estado.cargando}>
          {estado.cargando ? "Generando…" : "Solicitar propuesta formal (PDF)"}
        </button>
        {estado.error && <p className="texto-error" role="alert">{estado.error}</p>}
      </form>
    </aside>
  );
}

export function Calculadora({ c }) {
  if (!c.catalogo) {
    return <p className={c.error ? "texto-error" : "texto-suave"}>{c.error ?? "Cargando el catálogo…"}</p>;
  }

  const Contenido = CONTENIDO[c.paso - 1];
  const puedeAvanzar = c.paso > 1 || Boolean(c.tipo);

  return (
    <div className={s.distribucion}>
      <div className={s.principal}>
        <div className={s.progreso} role="progressbar" aria-label="Progreso" aria-valuemin={1} aria-valuemax={PASOS.length} aria-valuenow={c.paso}>
          <span className={s.progresoRelleno} style={{ transform: `scaleX(${c.paso / PASOS.length})` }} />
        </div>

        <ol className={s.pasos}>
          {PASOS.map((nombre, i) => (
            <li key={nombre}>
              <button
                type="button"
                className={s.paso}
                data-actual={c.paso === i + 1 || undefined}
                aria-current={c.paso === i + 1 ? "step" : undefined}
                disabled={i > 0 && !c.tipo}
                onClick={() => c.setPaso(i + 1)}
              >
                <span className={s.pasoNumero}>{i + 1}</span>
                <span className={s.pasoNombre}>{nombre}</span>
              </button>
            </li>
          ))}
        </ol>

        <div key={c.paso} className={s.contenido}>
          <h3 className={s.tituloPaso}>{PASOS[c.paso - 1]}</h3>
          <Contenido c={c} />
        </div>

        <div className={s.navegacion}>
          <button type="button" className={s.atras} disabled={c.paso === 1} onClick={() => c.setPaso(c.paso - 1)}>Atrás</button>
          {c.paso < PASOS.length && (
            <button type="button" className="boton" disabled={!puedeAvanzar} onClick={() => c.setPaso(c.paso + 1)}>Continuar</button>
          )}
        </div>
      </div>

      <Resumen c={c} />
    </div>
  );
}
