import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const euros = (cantidad) => formatoEuros.format(cantidad);

// Iconos pequeños en línea (mismo trazo que los iconos de shadcn/lucide).
function Icono({ nombre, className = "icono" }) {
  const trazos = {
    landing: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 14h8" /></>,
    corporativa: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M8 7h4M8 11h4M8 15h4" /><path d="M2 21h20" /></>,
    paginaAdicional: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 12v6M9 15h6" /></>,
    formulario: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    segundoIdioma: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></>,
    menos: <path d="M5 12h14" />,
    mas: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
    alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}

const TIPOS = [
  { valor: "landing", titulo: "Landing", texto: "Una página para un producto o campaña." },
  { valor: "corporativa", titulo: "Corporativa", texto: "La web completa de una empresa." },
];

const EXTRAS = [
  { campo: "formulario", titulo: "Formulario de contacto", texto: "Para que te escriban desde la web." },
  { campo: "segundoIdioma", titulo: "Segundo idioma", texto: "Toda la web traducida a otro idioma." },
];

const CONCEPTOS_GRAFICO = [
  { clave: "base", etiqueta: "Base" },
  { clave: "paginasAdicionales", etiqueta: "Páginas" },
  { clave: "formulario", etiqueta: "Formulario" },
  { clave: "segundoIdioma", etiqueta: "Idioma" },
];

const ERROR_CONEXION = "No se pudo conectar con la API. ¿Está en marcha con npm start?";

// Elementos que reaccionan al ratón con una luz que sigue al cursor.
const SELECTOR_REACTIVO = ".card, .opcion-tipo, .fila-extra, .boton, .stepper, .barra-total";

// Guarda la posición del ratón (relativa a cada elemento) en las variables
// CSS --mx y --my. El CSS las usa para dibujar el brillo. Solo se activa en
// dispositivos con ratón; en pantallas táctiles no hace nada.
function useLuzRaton() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let x = -9999;
    let y = -9999;
    let fotograma = 0;

    const pintar = () => {
      fotograma = 0;
      for (const el of document.querySelectorAll(SELECTOR_REACTIVO)) {
        const caja = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - caja.left}px`);
        el.style.setProperty("--my", `${y - caja.top}px`);
      }
    };
    const programar = () => {
      if (!fotograma) fotograma = requestAnimationFrame(pintar);
    };
    const mover = (e) => {
      x = e.clientX;
      y = e.clientY;
      programar();
    };
    const salir = () => {
      x = -9999;
      y = -9999;
      programar();
    };

    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("scroll", programar, { passive: true });
    document.documentElement.addEventListener("pointerleave", salir);
    return () => {
      cancelAnimationFrame(fotograma);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("scroll", programar);
      document.documentElement.removeEventListener("pointerleave", salir);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Componentes de interfaz
// ---------------------------------------------------------------------------

function Tarjeta({ className = "", children, ...resto }) {
  return (
    <section className={`card ${className}`} {...resto}>
      {children}
    </section>
  );
}

function Interruptor({ id, activo, onChange, etiqueta }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      className="switch"
      onClick={() => onChange(!activo)}
    >
      <span className="switch-thumb" />
    </button>
  );
}

// Gráfico de barras del desglose: una sola serie, barras ancladas a la base,
// con tooltip al pasar el ratón o al tocar (foco) cada barra.
function GraficoDesglose({ presupuesto }) {
  const valores = CONCEPTOS_GRAFICO.map((c) => ({ ...c, valor: presupuesto ? presupuesto[c.clave] : 0 }));
  const maximo = Math.max(...valores.map((v) => v.valor), 1);

  return (
    <div className="grafico" role="group" aria-label="Gráfico del desglose del presupuesto">
      <ul className="grafico-area">
        {valores.map((v) => (
          <li key={v.clave} className="grafico-columna">
            <button
              type="button"
              className="grafico-barra"
              style={{ height: `${(v.valor / maximo) * 100}%` }}
              aria-label={`${v.etiqueta}: ${euros(v.valor)}`}
              data-vacio={v.valor === 0 || undefined}
            >
              <span className="tooltip" role="tooltip">
                <span className="tooltip-etiqueta">{v.etiqueta}</span>
                <strong>{euros(v.valor)}</strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ul className="grafico-ejes" aria-hidden="true">
        {valores.map((v) => (
          <li key={v.clave}>{v.etiqueta}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aplicación
// ---------------------------------------------------------------------------

export default function App() {
  // Datos del formulario. "paginas" se guarda como texto para poder enviar
  // cualquier valor y ver cómo responde la validación del servidor.
  const [tipo, setTipo] = useState("corporativa");
  const [paginas, setPaginas] = useState("4");
  const [formulario, setFormulario] = useState(true);
  const [segundoIdioma, setSegundoIdioma] = useState(false);

  const [estadoApi, setEstadoApi] = useState("comprobando"); // comprobando | ok | error
  const [tarifas, setTarifas] = useState(null);
  const [presupuesto, setPresupuesto] = useState(null);
  const [errores, setErrores] = useState({ campos: [], detalles: [] });
  const [calculando, setCalculando] = useState(false);

  const peticionActual = useRef(null);

  useLuzRaton();

  // Al cargar: GET /api/estado y GET /api/tarifas.
  useEffect(() => {
    fetch("/api/estado")
      .then((r) => r.json())
      .then((d) => setEstadoApi(d.status === "ok" ? "ok" : "error"))
      .catch(() => setEstadoApi("error"));

    fetch("/api/tarifas")
      .then((r) => r.json())
      .then((d) => setTarifas(d.tarifas))
      .catch(() => setErrores({ campos: [], detalles: [ERROR_CONEXION] }));
  }, []);

  // POST /api/presupuesto: el servidor valida y calcula; aquí solo mostramos.
  const calcular = useCallback(async () => {
    peticionActual.current?.abort();
    const controlador = new AbortController();
    peticionActual.current = controlador;
    setCalculando(true);

    const solicitud = {
      tipo,
      paginas: paginas === "" ? null : Number(paginas),
      formulario,
      segundoIdioma,
    };

    try {
      const respuesta = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controlador.signal,
        body: JSON.stringify(solicitud),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        // Guardamos también la solicitud para que el resumen muestre
        // exactamente lo que calculó el servidor.
        setPresupuesto({ ...datos, solicitud });
        setErrores({ campos: [], detalles: [] });
      } else {
        setPresupuesto(null);
        setErrores({
          campos: datos.campos ?? [],
          detalles: datos.detalles?.length ? datos.detalles : [datos.error],
        });
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      setPresupuesto(null);
      setErrores({ campos: [], detalles: [ERROR_CONEXION] });
    } finally {
      if (peticionActual.current === controlador) setCalculando(false);
    }
  }, [tipo, paginas, formulario, segundoIdioma]);

  // Recalcula automáticamente (con una pequeña espera) al cambiar cualquier dato.
  useEffect(() => {
    const espera = setTimeout(calcular, 250);
    return () => clearTimeout(espera);
  }, [calcular]);

  const precio = (concepto) => {
    const tarifa = tarifas?.find((t) => t.concepto === concepto);
    return tarifa ? euros(tarifa.precio) : "…";
  };

  const numeroPaginas = Number(paginas);
  const paginasEnRango = Number.isInteger(numeroPaginas) && numeroPaginas >= 1 && numeroPaginas <= 20;
  const cambiarPaginas = (delta) => {
    const actual = paginasEnRango ? numeroPaginas : 1;
    setPaginas(String(Math.min(20, Math.max(1, actual + delta))));
  };

  const hayError = errores.detalles.length > 0;
  const errorEn = (campo) => errores.campos.includes(campo);
  const mayorConcepto = presupuesto
    ? CONCEPTOS_GRAFICO.reduce((a, b) => (presupuesto[b.clave] > presupuesto[a.clave] ? b : a))
    : null;

  return (
    <>
      <div className="fondo" aria-hidden="true" />

      <main className="contenedor">
        <div className="disposicion">
          {/* ---------------- Formulario ---------------- */}
            <Tarjeta className="card-formulario">
              <header className="card-header card-header-accion">
                <div>
                  <h1 className="card-title">Presupuesta mi web</h1>
                  <p className="card-description">
                    Configura tu web. El servidor valida los datos y calcula el precio.
                  </p>
                </div>
                <span className={`badge badge-${estadoApi}`}>
                  <span className="badge-punto" aria-hidden="true" />
                  {estadoApi === "ok" ? "API en línea" : estadoApi === "error" ? "API sin conexión" : "Comprobando…"}
                </span>
              </header>

              <form
                className="card-content formulario"
                onSubmit={(e) => {
                  e.preventDefault();
                  calcular();
                }}
                noValidate
              >
                {/* Tipo de web */}
                <fieldset className="campo">
                  <legend className="etiqueta">Tipo de web</legend>
                  <div className={`opciones-tipo ${errorEn("tipo") ? "con-error" : ""}`}>
                    {TIPOS.map((t) => (
                      <label key={t.valor} className="opcion-tipo" data-activo={tipo === t.valor || undefined}>
                        <input
                          type="radio"
                          name="tipo"
                          value={t.valor}
                          checked={tipo === t.valor}
                          onChange={() => setTipo(t.valor)}
                        />
                        <span className="opcion-icono">
                          <Icono nombre={t.valor} />
                        </span>
                        <span className="opcion-texto">
                          <span className="opcion-titulo">{t.titulo}</span>
                          <span className="texto-suave">{t.texto}</span>
                        </span>
                        <span className="opcion-precio">desde {precio(t.valor)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Número de páginas */}
                <div className="campo">
                  <div className="campo-cabecera">
                    <label htmlFor="paginas" className="etiqueta">
                      Número de páginas
                    </label>
                    <span className="texto-suave">1 incluida · +{precio("paginaAdicional")} cada adicional</span>
                  </div>
                  <div className="paginas">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={paginasEnRango ? numeroPaginas : 1}
                      onChange={(e) => setPaginas(e.target.value)}
                      aria-label="Número de páginas (deslizador)"
                      className="slider"
                      style={{ "--progreso": `${(((paginasEnRango ? numeroPaginas : 1) - 1) / 19) * 100}%` }}
                    />
                    <div className={`stepper ${errorEn("paginas") ? "con-error" : ""}`}>
                      <button type="button" className="boton-icono" onClick={() => cambiarPaginas(-1)} aria-label="Quitar una página">
                        <Icono nombre="menos" />
                      </button>
                      <input
                        id="paginas"
                        type="number"
                        inputMode="decimal"
                        className="input input-numero"
                        value={paginas}
                        onChange={(e) => setPaginas(e.target.value)}
                        aria-invalid={errorEn("paginas") || undefined}
                        aria-describedby="ayuda-paginas"
                      />
                      <button type="button" className="boton-icono" onClick={() => cambiarPaginas(1)} aria-label="Añadir una página">
                        <Icono nombre="mas" />
                      </button>
                    </div>
                  </div>
                  <p id="ayuda-paginas" className={errorEn("paginas") ? "texto-error" : "texto-suave"}>
                    {errorEn("paginas") ? "Debe ser un número entero entre 1 y 20." : "Entre 1 y 20 páginas."}
                  </p>
                </div>

                {/* Extras */}
                <fieldset className="campo">
                  <legend className="etiqueta">Extras</legend>
                  <ul className="lista-extras">
                    {EXTRAS.map((extra) => {
                      const activo = extra.campo === "formulario" ? formulario : segundoIdioma;
                      const cambiar = extra.campo === "formulario" ? setFormulario : setSegundoIdioma;
                      return (
                        <li key={extra.campo} className="fila-extra" onClick={() => cambiar(!activo)}>
                          <span className="opcion-icono">
                            <Icono nombre={extra.campo} />
                          </span>
                          <span className="opcion-texto">
                            <span className="opcion-titulo">{extra.titulo}</span>
                            <span className="texto-suave">{extra.texto}</span>
                          </span>
                          <span className="fila-extra-precio">+{precio(extra.campo)}</span>
                          <span onClick={(e) => e.stopPropagation()}>
                            <Interruptor id={extra.campo} activo={activo} onChange={cambiar} etiqueta={extra.titulo} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                <div className="acciones">
                  <p className="texto-suave">El precio se recalcula en el servidor con cada cambio.</p>
                  <button type="submit" className="boton boton-primario" disabled={calculando}>
                    {calculando ? "Calculando…" : "Calcular presupuesto"}
                  </button>
                </div>
              </form>
            </Tarjeta>

          {/* ---------------- Columna lateral ---------------- */}
          <aside className="columna-lateral" aria-live="polite">
            <Tarjeta className="tarjeta-total" id="total">
              <div className="card-content">
                <p className="texto-suave">Total del presupuesto</p>
                <p className="cifra-grande">{presupuesto ? euros(presupuesto.total) : "—"}</p>
                <p className="texto-suave">{presupuesto ? "Sin impuestos · EUR" : "Revisa los datos del formulario"}</p>
                {presupuesto && (
                  <p className="resumen">
                    {presupuesto.solicitud.tipo === "landing" ? "Landing" : "Corporativa"} ·{" "}
                    {presupuesto.solicitud.paginas} {presupuesto.solicitud.paginas === 1 ? "página" : "páginas"}
                    {presupuesto.solicitud.formulario ? " · formulario" : ""}
                    {presupuesto.solicitud.segundoIdioma ? " · 2 idiomas" : ""}
                  </p>
                )}
              </div>
            </Tarjeta>

            {hayError && (
              <Tarjeta className="tarjeta-error" role="alert">
                <div className="card-content">
                  <p className="error-titulo">
                    <Icono nombre="alerta" /> Solicitud no válida · 400
                  </p>
                  <ul className="error-lista">
                    {errores.detalles.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </Tarjeta>
            )}

            <Tarjeta className="tarjeta-grafico" id="desglose">
              <header className="card-header">
                <h2 className="card-title">Desglose del presupuesto</h2>
                <p className="card-description">Coste de cada concepto calculado por el servidor</p>
              </header>
              <div className="card-content">
                <GraficoDesglose presupuesto={presupuesto} />
                <dl className="desglose">
                  {CONCEPTOS_GRAFICO.map((c) => (
                    <div key={c.clave}>
                      <dt>
                        {c.clave === "base"
                          ? `Base${presupuesto ? ` (${presupuesto.solicitud.tipo})` : ""}`
                          : c.clave === "paginasAdicionales"
                            ? `Páginas adicionales${presupuesto ? ` (${presupuesto.solicitud.paginas - 1})` : ""}`
                            : c.clave === "formulario"
                              ? "Formulario de contacto"
                              : "Segundo idioma"}
                      </dt>
                      <dd>{presupuesto ? euros(presupuesto[c.clave]) : "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <footer className="card-footer">
                {mayorConcepto ? (
                  <>
                    <strong>Mayor coste: {mayorConcepto.etiqueta}</strong>
                    <span className="texto-suave">
                      {euros(presupuesto[mayorConcepto.clave])} de {euros(presupuesto.total)}
                    </span>
                  </>
                ) : (
                  <span className="texto-suave">Sin datos que mostrar</span>
                )}
              </footer>
            </Tarjeta>
          </aside>

            {/* ---------------- Tabla de tarifas (GET /api/tarifas) ---------------- */}
            <Tarjeta className="card-tarifas">
              <header className="card-header">
                <h2 className="card-title">Tarifas del servidor</h2>
                <p className="card-description">
                  Publicadas en <code>GET /api/tarifas</code>. El cliente nunca envía precios.
                </p>
              </header>
              <div className="card-content tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th scope="col">Concepto</th>
                      <th scope="col" className="solo-escritorio">Descripción</th>
                      <th scope="col" className="derecha">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tarifas ?? []).map((t) => (
                      <tr key={t.concepto}>
                        <td>
                          <span className="celda-concepto">
                            <span className="opcion-icono pequeno">
                              <Icono nombre={t.concepto} />
                            </span>
                            <span>
                              <code className="codigo">{t.concepto}</code>
                              <span className="texto-suave solo-movil">{t.descripcion}</span>
                            </span>
                          </span>
                        </td>
                        <td className="solo-escritorio texto-suave">{t.descripcion}</td>
                        <td className="derecha numero">{euros(t.precio)}</td>
                      </tr>
                    ))}
                    {!tarifas && (
                      <tr>
                        <td colSpan="3" className="texto-suave">Cargando tarifas…</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
        </div>

        <footer className="pie">
          0613 · Desarrollo web en entorno servidor · Node.js + Express + React
        </footer>
      </main>

      {/* Barra fija con el total en móvil y tablet */}
      <a href="#desglose" className="barra-total" aria-label="Ver el desglose del presupuesto">
        <span className="texto-suave">Total</span>
        <strong>{presupuesto ? euros(presupuesto.total) : "—"}</strong>
        <span className="barra-total-enlace">Ver desglose</span>
      </a>
    </>
  );
}
