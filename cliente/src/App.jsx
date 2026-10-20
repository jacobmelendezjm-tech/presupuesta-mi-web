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

const PAGINAS_MIN = 1;
const PAGINAS_MAX = 20;

const TIPOS = [
  {
    valor: "landing",
    titulo: "Landing",
    lema: "Una página. Un objetivo.",
    texto: "Para lanzar un producto, una campaña o un evento.",
  },
  {
    valor: "corporativa",
    titulo: "Corporativa",
    lema: "Toda tu empresa. En una web.",
    texto: "Varias secciones para contar quién eres y qué haces.",
  },
];

const EXTRAS = [
  {
    campo: "formulario",
    titulo: "Formulario de contacto",
    texto: "Que tus clientes te escriban sin salir de la web.",
  },
  {
    campo: "segundoIdioma",
    titulo: "Segundo idioma",
    texto: "Toda la web traducida, para llegar más lejos.",
  },
];

// Conceptos del desglose que devuelve POST /api/presupuesto.
const CONCEPTOS = [
  { clave: "base", etiqueta: "Precio base" },
  { clave: "paginasAdicionales", etiqueta: "Páginas adicionales" },
  { clave: "formulario", etiqueta: "Formulario de contacto" },
  { clave: "segundoIdioma", etiqueta: "Segundo idioma" },
];

const PASOS = [
  {
    numero: "01",
    titulo: "Tú eliges.",
    texto: "El navegador solo envía el tipo de web, las páginas y los extras. Nunca un precio.",
  },
  {
    numero: "02",
    titulo: "El servidor valida.",
    texto: "Comprueba cada campo y su tipo. Si algo no cumple el contrato, responde con un error 400.",
  },
  {
    numero: "03",
    titulo: "El servidor calcula.",
    texto: "Aplica sus propias tarifas y devuelve el desglose y el total con un 200.",
  },
];

const ERROR_CONEXION = "No se pudo conectar con la API. ¿Está en marcha con npm start?";

const resumenSolicitud = (s) =>
  [
    s.tipo === "landing" ? "Landing" : "Web corporativa",
    `${s.paginas} ${s.paginas === 1 ? "página" : "páginas"}`,
    s.formulario && "formulario",
    s.segundoIdioma && "2 idiomas",
  ]
    .filter(Boolean)
    .join(" · ");

const prefiereMenosMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

// Anima un número desde el valor que se está mostrando hasta el nuevo objetivo.
function useNumeroAnimado(objetivo) {
  const [valor, setValor] = useState(objetivo ?? 0);
  const mostrado = useRef(objetivo ?? null);

  useEffect(() => {
    if (objetivo == null) return;
    const desde = mostrado.current;
    // El primer valor se muestra directamente; solo se animan los cambios.
    if (desde == null || desde === objetivo || prefiereMenosMovimiento()) {
      mostrado.current = objetivo;
      setValor(objetivo);
      return;
    }

    let fotograma;
    const inicio = performance.now();
    const duracion = 700;
    const paso = (ahora) => {
      const progreso = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      mostrado.current = Math.round(desde + (objetivo - desde) * suavizado);
      setValor(mostrado.current);
      if (progreso < 1) fotograma = requestAnimationFrame(paso);
    };
    fotograma = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(fotograma);
  }, [objetivo]);

  return valor;
}

// Indica si un elemento está dentro de la ventana.
function useEnVista(ref, inicial = false, opciones) {
  const [enVista, setEnVista] = useState(inicial);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || !("IntersectionObserver" in window)) return;
    const observador = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting), opciones);
    observador.observe(elemento);
    return () => observador.disconnect();
    // Las opciones se fijan al montar el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return enVista;
}

// ---------------------------------------------------------------------------
// Componentes de interfaz
// ---------------------------------------------------------------------------

function Icono({ nombre, className = "icono" }) {
  const trazos = {
    landing: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 14h8" /></>,
    corporativa: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M8 7h4M8 11h4M8 15h4" /><path d="M2 21h20" /></>,
    paginaAdicional: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 12v6M9 15h6" /></>,
    formulario: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    segundoIdioma: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></>,
    menos: <path d="M5 12h14" />,
    mas: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
    flecha: <path d="m9 6 6 6-6 6" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}

// Logo JM: letras de trazo lineal (usan el color del texto) y un punto de acento.
function LogoJM({ className = "logo-jm" }) {
  return (
    <svg className={className} viewBox="0 0 46 26" fill="none" aria-hidden="true">
      <path
        d="M3 18a5 5 0 0 0 10 0V3M19 23V3l8 11 8-11v20"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="21" r="2.4" className="logo-jm-punto" />
    </svg>
  );
}

// Hace aparecer su contenido con un fundido al entrar en la ventana.
function Revelar({ as: Etiqueta = "div", className = "", retraso = 0, children, ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref}
      className={`revelar${visible ? " visible" : ""} ${className}`}
      style={{ "--retraso": `${retraso}ms` }}
      {...resto}
    >
      {children}
    </Etiqueta>
  );
}

// Ventana de navegador dibujada con CSS que refleja la configuración elegida.
function VistaPrevia({ tipo, paginas, formulario, segundoIdioma, className = "" }) {
  const numero = Number.isInteger(paginas) && paginas >= PAGINAS_MIN && paginas <= PAGINAS_MAX ? paginas : 1;
  const enlaces = Math.min(numero, 5);
  const restantes = numero - enlaces;

  return (
    <div className={`vista ${className}`} data-tipo={tipo} aria-hidden="true">
      <div className="vista-barra">
        <span className="vista-puntos"><i /><i /><i /></span>
        <span className="vista-url">tuweb.com</span>
      </div>
      <div className="vista-pagina">
        <div className="vista-nav">
          <span className="vista-logo" />
          <span className="vista-enlaces">
            {Array.from({ length: enlaces }, (_, i) => <i key={i} />)}
            {restantes > 0 && <em>+{restantes}</em>}
          </span>
          {segundoIdioma && <span className="vista-idioma">ES · EN</span>}
        </div>
        <div className="vista-hero">
          <b />
          <b className="corta" />
          <span className="vista-boton" />
        </div>
        {tipo === "corporativa" ? (
          <div className="vista-tarjetas"><i /><i /><i /></div>
        ) : (
          <div className="vista-banda"><i /><i /></div>
        )}
        {formulario && (
          <div className="vista-formulario">
            <i /><i /><span />
          </div>
        )}
      </div>
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
  const [intercambio, setIntercambio] = useState(null); // última solicitud y respuesta

  const peticionActual = useRef(null);
  const refHero = useRef(null);
  const refDesglose = useRef(null);
  const heroEnVista = useEnVista(refHero, true);
  const desgloseEnVista = useEnVista(refDesglose, false, { threshold: 0.15 });

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
      setIntercambio({ solicitud, estado: respuesta.status, datos });

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

  const tarifa = (concepto) => tarifas?.find((t) => t.concepto === concepto)?.precio;
  const precio = (concepto) => (tarifa(concepto) == null ? "…" : euros(tarifa(concepto)));

  const numeroPaginas = Number(paginas);
  const paginasEnRango =
    Number.isInteger(numeroPaginas) && numeroPaginas >= PAGINAS_MIN && numeroPaginas <= PAGINAS_MAX;
  const cambiarPaginas = (delta) => {
    const actual = paginasEnRango ? numeroPaginas : PAGINAS_MIN;
    setPaginas(String(Math.min(PAGINAS_MAX, Math.max(PAGINAS_MIN, actual + delta))));
  };

  const extras = { formulario, segundoIdioma };
  const cambiarExtra = { formulario: setFormulario, segundoIdioma: setSegundoIdioma };

  const hayError = errores.detalles.length > 0;
  const errorEn = (campo) => errores.campos.includes(campo);
  const totalAnimado = useNumeroAnimado(presupuesto?.total);
  const totalTexto = presupuesto ? euros(totalAnimado) : "—";
  const desde = tarifas ? Math.min(tarifa("landing"), tarifa("corporativa")) : null;
  const mostrarBarra = !heroEnVista && !desgloseEnVista;

  const configuracion = { tipo, paginas: numeroPaginas, formulario, segundoIdioma };

  return (
    <>
      {/* ---------------- Navegación ---------------- */}
      <nav className="nav" aria-label="Principal">
        <div className="nav-interior">
          <a href="#inicio" className="marca" aria-label="JM · Presupuesta, ir al inicio">
            <LogoJM />
            <span className="marca-separador" aria-hidden="true" />
            Presupuesta
          </a>
          <ul className="nav-enlaces">
            <li><a href="#configurar">Configurar</a></li>
            <li><a href="#desglose">Desglose</a></li>
            <li><a href="#tarifas">Tarifas</a></li>
            <li><a href="#como-funciona">Cómo funciona</a></li>
          </ul>
          <div className="nav-acciones">
            <span className={`estado estado-${estadoApi}`} title="GET /api/estado">
              <span className="estado-punto" aria-hidden="true" />
              <span className="estado-texto">
                {estadoApi === "ok" ? "API en línea" : estadoApi === "error" ? "API sin conexión" : "Comprobando…"}
              </span>
            </span>
            <a href="#configurar" className="boton boton-pequeno">Calcular</a>
          </div>
        </div>
      </nav>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="hero" id="inicio" ref={refHero}>
          <div className="hero-texto">
            <p className="hero-eyebrow revelar-inicio">Presupuesta mi web</p>
            <h1 className="hero-titulo revelar-inicio" style={{ "--retraso": "80ms" }}>
              Tu web.
              <br />
              <span className="degradado">Al precio exacto.</span>
            </h1>
            <p className="hero-subtitulo revelar-inicio" style={{ "--retraso": "160ms" }}>
              Elige el tipo, las páginas y los extras. Nuestro servidor valida cada dato y calcula tu
              presupuesto al instante.
            </p>
            <div className="hero-acciones revelar-inicio" style={{ "--retraso": "240ms" }}>
              <a href="#configurar" className="boton">Configurar mi web</a>
              <a href="#tarifas" className="enlace">
                Ver tarifas <Icono nombre="flecha" className="icono-enlace" />
              </a>
            </div>
            <p className="hero-desde revelar-inicio" style={{ "--retraso": "320ms" }}>
              {desde != null ? `Desde ${euros(desde)}¹` : " "}
            </p>
          </div>
          <div className="hero-visual revelar-inicio" style={{ "--retraso": "400ms" }}>
            <div className="hero-brillo" aria-hidden="true" />
            <VistaPrevia {...configuracion} className="vista-grande" />
          </div>
        </section>

        {/* ---------------- Configurador ---------------- */}
        <section className="seccion seccion-clara" id="configurar">
          <Revelar className="seccion-cabecera">
            <h2 className="titular">Configura tu web.</h2>
            <p className="entradilla">Cada cambio se envía al servidor y se calcula en tiempo real.</p>
          </Revelar>

          <div className="configurador">
            {/* Columna fija con la vista previa y el total */}
            <div className="configurador-visual">
              <div className="configurador-fijo">
                <VistaPrevia {...configuracion} />
                <div className="mini-total" aria-live="polite">
                  <span className="texto-suave">Tu presupuesto</span>
                  <strong className={hayError ? "mini-total-error" : ""}>
                    {hayError ? "Revisa los datos" : totalTexto}
                  </strong>
                  <span className="texto-suave mini-total-resumen">
                    {presupuesto ? resumenSolicitud(presupuesto.solicitud) : calculando ? "Calculando…" : " "}
                  </span>
                </div>
              </div>
            </div>

            <form
              className="configurador-pasos"
              onSubmit={(e) => {
                e.preventDefault();
                calcular();
              }}
              noValidate
            >
              {/* Paso 1: tipo de web */}
              <fieldset className="paso">
                <legend className="paso-titulo">
                  Tipo de web. <span className="gris">¿Cuál encaja contigo?</span>
                </legend>
                <div className={`opciones${errorEn("tipo") ? " con-error" : ""}`}>
                  {TIPOS.map((t) => (
                    <label key={t.valor} className="opcion" data-activo={tipo === t.valor || undefined}>
                      <input
                        type="radio"
                        name="tipo"
                        value={t.valor}
                        checked={tipo === t.valor}
                        onChange={() => setTipo(t.valor)}
                        className="oculto"
                      />
                      <span className="opcion-cabecera">
                        <Icono nombre={t.valor} className="opcion-icono" />
                        <span className="opcion-precio">desde {precio(t.valor)}</span>
                      </span>
                      <span className="opcion-titulo">{t.titulo}</span>
                      <span className="opcion-lema">{t.lema}</span>
                      <span className="opcion-texto">{t.texto}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Paso 2: número de páginas */}
              <div className="paso" role="group" aria-labelledby="titulo-paginas">
                <h3 className="paso-titulo" id="titulo-paginas">
                  Páginas. <span className="gris">¿Cuántas necesitas?</span>
                </h3>
                <div className={`tarjeta-paginas${errorEn("paginas") ? " con-error" : ""}`}>
                  <div className="stepper">
                    <button
                      type="button"
                      className="boton-circular"
                      onClick={() => cambiarPaginas(-1)}
                      disabled={paginasEnRango && numeroPaginas <= PAGINAS_MIN}
                      aria-label="Quitar una página"
                    >
                      <Icono nombre="menos" />
                    </button>
                    <div className="stepper-valor">
                      <input
                        id="paginas"
                        type="number"
                        inputMode="decimal"
                        className="input-paginas"
                        value={paginas}
                        onChange={(e) => setPaginas(e.target.value)}
                        aria-invalid={errorEn("paginas") || undefined}
                        aria-describedby="ayuda-paginas"
                        aria-label="Número de páginas"
                      />
                      <span className="stepper-unidad">{numeroPaginas === 1 ? "página" : "páginas"}</span>
                    </div>
                    <button
                      type="button"
                      className="boton-circular"
                      onClick={() => cambiarPaginas(1)}
                      disabled={paginasEnRango && numeroPaginas >= PAGINAS_MAX}
                      aria-label="Añadir una página"
                    >
                      <Icono nombre="mas" />
                    </button>
                  </div>
                  <input
                    type="range"
                    min={PAGINAS_MIN}
                    max={PAGINAS_MAX}
                    value={paginasEnRango ? numeroPaginas : PAGINAS_MIN}
                    onChange={(e) => setPaginas(e.target.value)}
                    aria-label="Número de páginas (deslizador)"
                    className="deslizador"
                    style={{
                      "--progreso": `${(((paginasEnRango ? numeroPaginas : PAGINAS_MIN) - PAGINAS_MIN) / (PAGINAS_MAX - PAGINAS_MIN)) * 100}%`,
                    }}
                  />
                  <div className="deslizador-marcas" aria-hidden="true">
                    <span>{PAGINAS_MIN}</span>
                    <span>{PAGINAS_MAX}</span>
                  </div>
                  <p id="ayuda-paginas" className={errorEn("paginas") ? "texto-error" : "texto-suave"}>
                    {errorEn("paginas")
                      ? `Debe ser un número entero entre ${PAGINAS_MIN} y ${PAGINAS_MAX}.`
                      : `La primera página está incluida. Cada adicional, +${precio("paginaAdicional")}.`}
                  </p>
                </div>
              </div>

              {/* Paso 3: extras */}
              <fieldset className="paso">
                <legend className="paso-titulo">
                  Extras. <span className="gris">Dale un poco más.</span>
                </legend>
                <div className="opciones opciones-extras">
                  {EXTRAS.map((extra) => (
                    <label
                      key={extra.campo}
                      className={`opcion opcion-extra${errorEn(extra.campo) ? " con-error" : ""}`}
                      data-activo={extras[extra.campo] || undefined}
                    >
                      <input
                        type="checkbox"
                        checked={extras[extra.campo]}
                        onChange={(e) => cambiarExtra[extra.campo](e.target.checked)}
                        className="oculto"
                      />
                      <span className="opcion-cabecera">
                        <Icono nombre={extra.campo} className="opcion-icono" />
                        <span className="marca-check" aria-hidden="true">
                          <Icono nombre="check" />
                        </span>
                      </span>
                      <span className="opcion-titulo">{extra.titulo}</span>
                      <span className="opcion-texto">{extra.texto}</span>
                      <span className="opcion-precio-extra">+{precio(extra.campo)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="paso-final">
                <a href="#desglose" className="boton boton-grande">Ver mi presupuesto</a>
                <p className="texto-suave">El precio lo decide siempre el servidor, nunca el navegador.</p>
              </div>
            </form>
          </div>
        </section>

        {/* ---------------- Desglose ---------------- */}
        <section className="seccion seccion-blanca" id="desglose" ref={refDesglose} aria-live="polite">
          <Revelar className="seccion-cabecera">
            <h2 className="titular">Tu presupuesto.</h2>
            <p className="entradilla">
              {presupuesto ? resumenSolicitud(presupuesto.solicitud) : "Calculado por el servidor con sus propias tarifas."}
            </p>
          </Revelar>

          {hayError ? (
            <Revelar className="tarjeta-error" role="alert">
              <Icono nombre="alerta" className="tarjeta-error-icono" />
              <h3>Revisa tu configuración.</h3>
              <p className="texto-suave">
                {intercambio?.estado ? `El servidor respondió ${intercambio.estado} · Solicitud no válida` : "Sin respuesta del servidor"}
              </p>
              <ul>
                {errores.detalles.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <a href="#configurar" className="enlace">
                Volver a configurar <Icono nombre="flecha" className="icono-enlace" />
              </a>
            </Revelar>
          ) : (
            <Revelar className="desglose">
              <p className="total">
                <span className="degradado">{totalTexto}</span>
              </p>
              <p className="total-nota texto-suave">Sin impuestos · {presupuesto?.moneda ?? "EUR"}¹</p>

              <div className="barra-segmentada" aria-hidden="true">
                {presupuesto &&
                  CONCEPTOS.filter((c) => presupuesto[c.clave] > 0).map((c) => (
                    <span
                      key={c.clave}
                      className={`segmento segmento-${c.clave}`}
                      style={{ flexGrow: presupuesto[c.clave] }}
                    />
                  ))}
              </div>

              <dl className="lista-desglose">
                {CONCEPTOS.map((c) => (
                  <div key={c.clave} className="fila-desglose" data-cero={presupuesto?.[c.clave] === 0 || undefined}>
                    <dt>
                      <span className={`punto punto-${c.clave}`} aria-hidden="true" />
                      {c.etiqueta}
                      {presupuesto && c.clave === "base" && (
                        <span className="texto-suave"> · {presupuesto.solicitud.tipo}</span>
                      )}
                      {presupuesto && c.clave === "paginasAdicionales" && (
                        <span className="texto-suave">
                          {" "}· {presupuesto.solicitud.paginas - 1} × {precio("paginaAdicional")}
                        </span>
                      )}
                    </dt>
                    <dd>{presupuesto ? euros(presupuesto[c.clave]) : "—"}</dd>
                  </div>
                ))}
                <div className="fila-desglose fila-total">
                  <dt>Total</dt>
                  <dd>{presupuesto ? euros(presupuesto.total) : "—"}</dd>
                </div>
              </dl>
            </Revelar>
          )}
        </section>

        {/* ---------------- Tarifas (GET /api/tarifas) ---------------- */}
        <section className="seccion seccion-clara" id="tarifas">
          <Revelar className="seccion-cabecera">
            <h2 className="titular">
              Tarifas. <span className="gris">Claras desde el principio.</span>
            </h2>
            <p className="entradilla">
              Publicadas por el servidor en <code>GET /api/tarifas</code>. Sin letra pequeña.
            </p>
          </Revelar>

          <ul className="rejilla-tarifas">
            {(tarifas ?? Array.from({ length: 5 }, (_, i) => ({ concepto: `cargando-${i}` }))).map((t, i) => (
              <Revelar as="li" key={t.concepto} className="tarifa" retraso={i * 70} data-cargando={t.precio == null || undefined}>
                <Icono nombre={t.concepto} className="tarifa-icono" />
                <p className="tarifa-descripcion">{t.descripcion ?? "Cargando…"}</p>
                <p className="tarifa-precio">{t.precio == null ? "—" : euros(t.precio)}</p>
                <code className="tarifa-codigo">{t.precio == null ? " " : t.concepto}</code>
              </Revelar>
            ))}
          </ul>
        </section>

        {/* ---------------- Cómo funciona ---------------- */}
        <section className="seccion seccion-oscura" id="como-funciona">
          <Revelar className="seccion-cabecera">
            <p className="hero-eyebrow">Bajo el capó</p>
            <h2 className="titular">
              El navegador pregunta.
              <br />
              <span className="degradado">El servidor decide.</span>
            </h2>
          </Revelar>

          <ol className="pasos-funcionamiento">
            {PASOS.map((p, i) => (
              <Revelar as="li" key={p.numero} className="paso-funcionamiento" retraso={i * 100}>
                <span className="paso-numero">{p.numero}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </Revelar>
            ))}
          </ol>

          <Revelar className="consola">
            <div className="consola-panel">
              <p className="consola-cabecera">
                <span className="metodo">POST</span> /api/presupuesto
              </p>
              <pre>{JSON.stringify(intercambio?.solicitud ?? configuracion, null, 2)}</pre>
            </div>
            <div className="consola-panel">
              <p className="consola-cabecera">
                <span className={`codigo-estado${intercambio && intercambio.estado !== 200 ? " codigo-error" : ""}`}>
                  {intercambio?.estado ?? "···"}
                </span>{" "}
                Respuesta
              </p>
              <pre>{intercambio ? JSON.stringify(intercambio.datos, null, 2) : "Esperando respuesta…"}</pre>
            </div>
          </Revelar>
        </section>
      </main>

      {/* ---------------- Pie ---------------- */}
      <footer className="pie">
        <div className="pie-interior">
          <p>
            1. Precios sin impuestos, calculados por el servidor con tarifas ficticias de la actividad. No se
            aplican descuentos ni conceptos adicionales.
          </p>
          <p>Los presupuestos no se guardan: cada cálculo se hace al momento.</p>
          <div className="pie-linea">
            <span className="pie-marca">
              <LogoJM className="logo-jm logo-jm-pie" />
              Presupuesta mi web · 0613 · Desarrollo web en entorno servidor
            </span>
            <span>Node.js · Express · React</span>
          </div>
        </div>
      </footer>

      {/* Barra inferior fija con el total, como en una tienda online */}
      <div className={`barra-total${mostrarBarra ? " visible" : ""}`} aria-hidden={!mostrarBarra}>
        <div className="barra-total-interior">
          <div className="barra-total-texto">
            <span className="texto-suave">
              {presupuesto ? resumenSolicitud(presupuesto.solicitud) : hayError ? "Configuración no válida" : "Calculando…"}
            </span>
            <strong>{hayError ? "Revisa los datos" : totalTexto}</strong>
          </div>
          <a href="#desglose" className="boton" tabIndex={mostrarBarra ? undefined : -1}>
            Ver desglose
          </a>
        </div>
      </div>
    </>
  );
}
