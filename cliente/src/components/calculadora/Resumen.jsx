import { useId, useState } from "react";
import { NumeroAnimado } from "../ui/numero-animado.jsx";
import { euros } from "./formato.js";
import r from "./Resumen.module.css";

// Resumen del presupuesto (#desglose). Todo lo que muestra llega de
// POST /api/estimacion: aquí solo se pinta, nunca se suma nada.
export function Resumen({ c, ocupado, tituloRef }) {
  const idCampo = useId();
  const [cliente, setCliente] = useState("");
  const [pdf, setPdf] = useState({ cargando: false, error: null, listo: false });
  const { estimacion } = c;
  const esperandoPrimera = Boolean(c.tipo) && !estimacion && !c.error;
  const desactualizado = Boolean(estimacion) && (ocupado || Boolean(c.error));
  // Con error, el total que se ve es el último válido: se atenúa y se avisa.
  const totalAntiguo = Boolean(estimacion) && Boolean(c.error);

  const solicitarPdf = async (evento) => {
    evento.preventDefault();
    if (pdf.cargando || !estimacion) return;
    setPdf({ cargando: true, error: null, listo: false });
    try {
      await c.descargarPdf(cliente);
      setPdf({ cargando: false, error: null, listo: true });
    } catch (error) {
      setPdf({ cargando: false, error: error.message, listo: false });
    }
  };

  // Lo que se anuncia a los lectores de pantalla: solo el valor final, no la animación.
  const anuncio = estimacion
    ? `Total estimado: ${euros.format(estimacion.total)}.${estimacion.totalMensual > 0 ? ` Mensual aparte: ${euros.format(estimacion.totalMensual)} al mes.` : ""}`
    : "";

  return (
    <section className={r.resumen} id="desglose" aria-labelledby={`${idCampo}-titulo`}>
      <h3 className={r.cabecera} id={`${idCampo}-titulo`} ref={tituloRef} tabIndex={-1}>
        <span className="etiqueta">Tu presupuesto</span>
      </h3>

      <div className={r.caja}>
        <div className={r.totalFila}>
          {esperandoPrimera ? (
            <span className={`skeleton ${r.totalEsqueleto}`} aria-hidden="true" />
          ) : (
            <p className={r.total} data-apagado={!estimacion || totalAntiguo || undefined} aria-hidden="true">
              {/* Sin tipo aún no hay nada que presupuestar: se ve «0 €» atenuado */}
              <NumeroAnimado valor={estimacion?.total ?? 0} formato={euros.format} duracion={700} />
            </p>
          )}
        </div>
        <p className="oculto" aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
        {/* Mientras el servidor recalcula, el punto «en vivo» pasa a spinner */}
        <p className={r.nota} data-calculando={ocupado || undefined}>
          {ocupado ? (
            <>
              <span className="spinner" style={{ "--tam": "13px" }} aria-hidden="true" />
              Calculando en el servidor…
            </>
          ) : (
            <>
              <span className="punto-vivo" aria-hidden="true" />
              {totalAntiguo ? "Último cálculo válido del servidor" : "Sin impuestos · calculado por el servidor"}
            </>
          )}
        </p>

        {!c.tipo && (
          <div className={r.vacio}>
            <p>Elige un tipo de proyecto y aquí verás el desglose línea a línea.</p>
            <ul className={r.lineas} aria-hidden="true">
              {[62, 44, 52].map((ancho) => (
                <li key={ancho} className={r.lineaVacia}>
                  <span style={{ width: `${ancho}%` }} />
                  <span />
                </li>
              ))}
            </ul>
          </div>
        )}

        {esperandoPrimera && (
          <ul className={r.lineas} aria-hidden="true">
            {[58, 40, 48].map((ancho) => (
              <li key={ancho} className={r.lineaEsqueleto}>
                <span className="skeleton" style={{ width: `${ancho}%` }} />
                <span className="skeleton" />
              </li>
            ))}
          </ul>
        )}

        {estimacion && (
          <ul className={r.lineas} data-desactualizado={desactualizado || undefined}>
            {estimacion.lineas.map((l, i) => (
              <li key={l.id} className={r.linea} style={{ "--i": i }}>
                <span className={r.lineaNombre}>
                  {l.nombre}
                  {l.unidad && (
                    <small className={r.lineaDetalle}>
                      {l.cantidad} × {euros.format(l.precioUnitario)}
                    </small>
                  )}
                </span>
                <strong className={r.importe}>
                  <NumeroAnimado valor={l.importe} formato={euros.format} />
                </strong>
              </li>
            ))}
          </ul>
        )}

        {estimacion?.mensual.length > 0 && (
          <div className={r.mensual}>
            <p className={r.subtitulo}>Servicios mensuales · no se suman al total</p>
            <ul className={r.lineas} data-desactualizado={desactualizado || undefined}>
              {estimacion.mensual.map((m, i) => (
                <li key={m.id} className={r.linea} style={{ "--i": i }}>
                  <span className={r.lineaNombre}>{m.nombre}</span>
                  <strong className={r.importe}>{euros.format(m.importe)}/mes</strong>
                </li>
              ))}
            </ul>
            <p className={r.totalMensual}>
              <span>Total mensual</span>
              <strong>{euros.format(estimacion.totalMensual)}/mes</strong>
            </p>
          </div>
        )}

        {c.error && (
          <div className={r.error} role="alert">
            <p>{c.error}</p>
            {c.tipo && c.catalogo && (
              <button type="button" className={r.reintentar} onClick={c.reintentar}>
                Reintentar
              </button>
            )}
          </div>
        )}

        <form className={r.formulario} onSubmit={solicitarPdf}>
          <label className={r.campoEtiqueta} htmlFor={idCampo}>
            Nombre o empresa
          </label>
          <input
            id={idCampo}
            className="pildora"
            value={cliente}
            onChange={(e) => {
              setCliente(e.target.value);
              if (pdf.error || pdf.listo) setPdf({ cargando: false, error: null, listo: false });
            }}
            maxLength={120}
            required
            autoComplete="organization"
            placeholder="Empresa S.L."
          />
          <button type="submit" className={`boton boton-grande ${r.botonPdf}`} disabled={!estimacion} aria-busy={pdf.cargando || undefined}>
            {pdf.cargando ? (
              <>
                <span className={`spinner ${r.spinnerBoton}`} aria-hidden="true" />
                Generando PDF…
              </>
            ) : (
              <>
                Solicitar propuesta (PDF)
                <svg className={r.flecha} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4v12m0 0 5-5m-5 5-5-5M5 20h14" />
                </svg>
              </>
            )}
          </button>
          {!c.tipo && <p className={r.pista}>Elige primero un tipo de proyecto.</p>}
          {pdf.error && (
            <p className="texto-error" role="alert">
              {pdf.error}
            </p>
          )}
          {pdf.listo && (
            <p className={r.listo} role="status">
              PDF generado: revisa tus descargas.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
