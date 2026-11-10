import { useEffect, useRef, useState } from "react";
import "./asistente-ia.css";

// Asistente con IA: el cliente describe su proyecto, revisa los servicios
// propuestos y descarga el presupuesto. Aquí nunca se calcula un importe:
// los precios del catálogo son informativos y el total siempre lo da el servidor.

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const euros = (cantidad) => formatoEuros.format(cantidad);

const DESCRIPCION_MAX = 2000;
const CANTIDAD_MAX = 19;

// Datos ficticios para probar los casos del enunciado.
const EJEMPLOS = [
  {
    etiqueta: "Encaja con el catálogo",
    cliente: "Restaurante La Bahía (ficticio)",
    descripcion:
      "Necesito una web para un restaurante. Quiero 4 páginas: inicio, carta, nosotros y contacto, un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.",
  },
  {
    etiqueta: "Ambigua",
    cliente: "Proyecto Ficticio S.L.",
    descripcion: "Quiero tener algo en internet para que la gente me conozca mejor. Todavía no sé muy bien qué poner.",
  },
  {
    etiqueta: "Fuera de catálogo",
    cliente: "Tienda Ficticia",
    descripcion:
      "Quiero una tienda online con pasarela de pago, área de clientes y una app móvil para vender mis productos.",
  },
];

const MENSAJES_CAMARON = {
  inicio: "Cuéntame qué web necesitas, que yo le pongo el compás.",
  cargando: "Afinando la propuesta… un momentito, compadre.",
  error: "Se ha roto una cuerda. Dale otra vez, que esto sale.",
  revision: "¡Olé! Revisa los servicios y quédate con lo que te cante.",
  vista: "Míralo bien antes de descargarlo, que queda por bulerías.",
};

const aLineas = (texto) =>
  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

async function enviar(ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw { campos: [], detalles: ["No se pudo conectar con el servidor."], reintentable: true };
  }
  return respuesta;
}

async function enviarJson(ruta, cuerpo) {
  const respuesta = await enviar(ruta, cuerpo);
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw {
      campos: datos?.campos ?? [],
      detalles: datos?.detalles ?? ["El servidor ha dado una respuesta inesperada."],
      reintentable: datos?.reintentable ?? respuesta.status >= 500,
    };
  }
  return datos;
}

async function pedirCatalogo() {
  const respuesta = await fetch("/api/catalogo");
  if (!respuesta.ok) throw new Error("catalogo");
  return (await respuesta.json()).servicios;
}

// Una entrada por cada servicio del catálogo: así, al eliminar uno y
// volver a añadirlo, conserva la explicación de la IA.
function crearLineas(catalogo, propuesta) {
  return Object.fromEntries(
    catalogo.map((s) => {
      const propuesto = propuesta.servicios.find((p) => p.id === s.id);
      return [
        s.id,
        {
          incluida: Boolean(propuesto),
          aceptada: false,
          justificacion: propuesto?.justificacion ?? "",
          cantidad: propuesto?.cantidad == null ? "" : String(propuesto.cantidad),
        },
      ];
    })
  );
}

// Iconos de trazo de los botones (decorativos: el texto del botón ya lo dice todo).
const TRAZOS = {
  flecha: "M5 12h14M13 6l6 6-6 6",
  atras: "M19 12H5M11 6l-6 6 6 6",
  mas: "M12 5v14M5 12h14",
  descarga: "M12 4v11M7 10l5 5 5-5M5 20h14",
};

function Icono({ nombre }) {
  return (
    <svg className="ia-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

function Avisos({ error, onReintentar }) {
  if (!error) return null;
  return (
    <div className="ia-error" role="alert">
      <span className="ia-error-icono" aria-hidden="true">!</span>
      <ul>
        {error.detalles.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      {error.reintentable && onReintentar && (
        <button type="button" className="boton-contorno ia-reintentar" onClick={onReintentar}>
          Volver a intentarlo
        </button>
      )}
    </div>
  );
}

// Filas skeleton mientras la IA prepara la propuesta. Es decorativo: el
// bocadillo de Camarón (aria-live) ya anuncia que se está preparando.
function Preparando() {
  return (
    <div className="ia-preparando" aria-hidden="true">
      <p className="ia-preparando-titulo">
        <span className="spinner" />
        Preparando tu propuesta
      </p>
      <ul className="ia-esqueleto">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <span className="skeleton ia-esqueleto-nombre" />
            <span className="skeleton ia-esqueleto-precio" />
            <span className="skeleton ia-esqueleto-texto" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Camaron({ estado }) {
  return (
    <aside className="ia-camaron" data-estado={estado}>
      <p className="ia-bocadillo" aria-live="polite">
        {MENSAJES_CAMARON[estado]}
      </p>
      <div className="ia-camaron-figura">
        <img src="/camaron.png" alt="Figura de Camarón sentado en una silla de enea" width="260" height="424" />
      </div>
    </aside>
  );
}

function VistaDocumento({ documento }) {
  return (
    <article className="ia-papel" aria-label="Vista previa del presupuesto">
      <header className="ia-papel-cabecera">
        <div>
          <p className="ia-papel-marca">Presupuesta mi web</p>
          <h3>Presupuesto</h3>
          <p className="ia-papel-cliente">{documento.cliente}</p>
          <p className="ia-papel-suave">{documento.fecha}</p>
        </div>
        <img src="/camaron.png" alt="" width="66" height="108" />
      </header>

      <h4>Resumen del proyecto</h4>
      <p>{documento.resumen}</p>

      <h4>Servicios y desglose</h4>
      <div className="ia-tabla">
        <table>
          <thead>
            <tr>
              <th scope="col">Servicio</th>
              <th scope="col" className="ia-num">Detalle</th>
              <th scope="col" className="ia-num">Importe</th>
            </tr>
          </thead>
          <tbody>
            {documento.lineas.map((l) => (
              <tr key={l.id}>
                <td>
                  <strong>{l.nombre}</strong>
                  <span className="ia-papel-suave">{l.descripcion}</span>
                  {l.justificacion && <em className="ia-papel-suave">{l.justificacion}</em>}
                </td>
                <td className="ia-num">{l.unidad ? `${l.cantidad} × ${euros(l.precioUnitario)}` : ""}</td>
                <td className="ia-num"><strong>{euros(l.importe)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan="2">Total</th>
              <td className="ia-num">{euros(documento.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="ia-papel-suave ia-num">Importes sin impuestos, en {documento.moneda}.</p>

      {(documento.dudas.length > 0 || documento.pendientes.length > 0) && (
        <>
          <h4>Aclaraciones y aspectos pendientes de concretar</h4>
          {documento.dudas.length > 0 && (
            <ul>
              {documento.dudas.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          {documento.pendientes.length > 0 && (
            <>
              <p><strong>Fuera de catálogo · pendiente de valorar (no incluido en el total)</strong></p>
              <ul>
                {documento.pendientes.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </article>
  );
}

export function AsistenteIA() {
  const raiz = useRef(null);
  const [paso, setPaso] = useState("descripcion"); // descripcion | revision | vista
  const [catalogo, setCatalogo] = useState(null);

  const [cliente, setCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [resumen, setResumen] = useState("");
  const [lineas, setLineas] = useState({});
  const [dudas, setDudas] = useState("");
  const [pendientes, setPendientes] = useState("");

  const [cuerpoDocumento, setCuerpoDocumento] = useState(null); // lo que se calculó: el PDF usa lo mismo
  const [documento, setDocumento] = useState(null);

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    pedirCatalogo().then(setCatalogo).catch(() => {});
  }, []);

  const irA = (siguiente) => {
    setError(null);
    setPaso(siguiente);
    raiz.current?.scrollIntoView({ block: "start" });
  };

  const proponer = async () => {
    setOcupado(true);
    setError(null);
    try {
      const servicios = catalogo ?? (await pedirCatalogo());
      setCatalogo(servicios);
      const propuesta = await enviarJson("/api/propuesta", { cliente, descripcion });
      setResumen(propuesta.resumen);
      setLineas(crearLineas(servicios, propuesta));
      setDudas(propuesta.dudas.join("\n"));
      setPendientes(propuesta.pendientes.join("\n"));
      irA("revision");
    } catch (e) {
      setError(e.detalles ? e : { campos: [], detalles: ["No se pudo cargar el catálogo."], reintentable: true });
    } finally {
      setOcupado(false);
    }
  };

  const cambiarLinea = (id, cambios) => setLineas((l) => ({ ...l, [id]: { ...l[id], ...cambios } }));

  const anadir = (servicio) =>
    setLineas((actuales) => {
      const nuevas = { ...actuales, [servicio.id]: { ...actuales[servicio.id], incluida: true, aceptada: true } };
      // Solo puede haber un tipo de web: elegir uno sustituye al otro.
      if (servicio.grupo === "tipo") {
        for (const otro of catalogo) {
          if (otro.grupo === "tipo" && otro.id !== servicio.id) {
            nuevas[otro.id] = { ...nuevas[otro.id], incluida: false, aceptada: false };
          }
        }
      }
      return nuevas;
    });

  const aceptarTodos = () =>
    setLineas((actuales) =>
      Object.fromEntries(Object.entries(actuales).map(([id, l]) => [id, { ...l, aceptada: l.incluida }]))
    );

  const incluidos = catalogo?.filter((s) => lineas[s.id]?.incluida) ?? [];
  const disponibles = catalogo?.filter((s) => lineas[s.id] && !lineas[s.id].incluida) ?? [];
  const hayTipo = incluidos.some((s) => s.grupo === "tipo");
  const sinAceptar = incluidos.filter((s) => !lineas[s.id].aceptada).length;

  const cantidadValida = (valor) => {
    const n = Number(valor);
    return valor !== "" && Number.isInteger(n) && n >= 1 && n <= CANTIDAD_MAX;
  };
  const faltaCantidad = incluidos.some((s) => s.grupo === "unidad" && !cantidadValida(lineas[s.id].cantidad));

  const faltan = [
    !hayTipo && "Añade un tipo de web: landing o web corporativa.",
    faltaCantidad && `Indica cuántas páginas adicionales necesitas (de 1 a ${CANTIDAD_MAX}).`,
    sinAceptar > 0 && `Acepta o elimina ${sinAceptar === 1 ? "el servicio pendiente" : `los ${sinAceptar} servicios pendientes`}.`,
    resumen.trim() === "" && "Escribe un resumen del proyecto.",
  ].filter(Boolean);

  const calcular = async () => {
    const cuerpo = {
      cliente,
      resumen,
      servicios: incluidos.map((s) => ({
        id: s.id,
        ...(s.grupo === "unidad" && { cantidad: Number(lineas[s.id].cantidad) }),
        ...(lineas[s.id].justificacion && { justificacion: lineas[s.id].justificacion }),
      })),
      dudas: aLineas(dudas),
      pendientes: aLineas(pendientes),
    };
    setOcupado(true);
    setError(null);
    try {
      const calculado = await enviarJson("/api/propuesta/documento", cuerpo);
      setCuerpoDocumento(cuerpo);
      setDocumento(calculado);
      irA("vista");
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async () => {
    setOcupado(true);
    setError(null);
    try {
      const respuesta = await enviar("/api/propuesta/pdf", cuerpoDocumento);
      if (!respuesta.ok) {
        throw { campos: [], detalles: ["No se pudo generar el PDF."], reintentable: true };
      }
      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "presupuesto.pdf";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const reiniciar = () => {
    setDescripcion("");
    setDocumento(null);
    setCuerpoDocumento(null);
    irA("descripcion");
  };

  const errorEn = (campo) => error?.campos?.includes(campo);

  let estadoCamaron = paso === "descripcion" ? "inicio" : paso;
  if (error) estadoCamaron = "error";
  else if (ocupado && paso === "descripcion") estadoCamaron = "cargando";

  const precioDe = (s) => (s.unidad ? `${euros(s.precio)} / ${s.unidad}` : euros(s.precio));

  return (
    <div className="ia" ref={raiz}>
      <header className="seccion-cabecera">
        <span className="fantasma seccion-fantasma" aria-hidden="true">IA</span>
        <p className="etiqueta revelar">02 — Asistente IA</p>
        <h2 className="titular revelar" id="titulo-asistente">
          Cuéntanos tu <span className="verde">proyecto</span>
        </h2>
        <p className="entradilla revelar">
          Descríbelo con tus palabras: la IA te propone servicios del catálogo y tú decides cuáles se quedan. Los
          importes los calcula siempre el servidor con sus tarifas.
        </p>
        <ol className="ia-pasos revelar" aria-label="Pasos del asistente">
          <li data-activo={paso === "descripcion" || undefined} data-hecho={paso !== "descripcion" || undefined} aria-current={paso === "descripcion" ? "step" : undefined}>
            <span className="ia-paso-num" aria-hidden="true">01</span> Describe
          </li>
          <li data-activo={paso === "revision" || undefined} data-hecho={paso === "vista" || undefined} aria-current={paso === "revision" ? "step" : undefined}>
            <span className="ia-paso-num" aria-hidden="true">02</span> Revisa
          </li>
          <li data-activo={paso === "vista" || undefined} aria-current={paso === "vista" ? "step" : undefined}>
            <span className="ia-paso-num" aria-hidden="true">03</span> Descarga
          </li>
        </ol>
      </header>

      <div className="ia-rejilla">
        <div className="ia-principal">
          {paso === "descripcion" && (
            <form
              className="ia-tarjeta ia-formulario"
              onSubmit={(e) => {
                e.preventDefault();
                proponer();
              }}
              noValidate
              aria-busy={ocupado || undefined}
            >
              <label className="ia-campo">
                <span className="ia-campo-titulo">Nombre del cliente o empresa</span>
                <input
                  type="text"
                  className="ia-entrada"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  aria-invalid={errorEn("cliente") || undefined}
                  autoComplete="organization"
                  placeholder="Tu nombre o el de tu empresa"
                />
              </label>
              <label className="ia-campo">
                <span className="ia-campo-titulo">¿Qué necesitas?</span>
                <textarea
                  rows="7"
                  className="ia-entrada"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  aria-invalid={errorEn("descripcion") || undefined}
                  placeholder="Necesito una web para un restaurante. Quiero mostrar la carta…"
                />
                <small className={`ia-contador ${descripcion.length > DESCRIPCION_MAX ? "texto-error" : "texto-suave"}`}>
                  {descripcion.length} / {DESCRIPCION_MAX}
                </small>
              </label>

              <div className="ia-ejemplos">
                <span className="ia-ejemplos-titulo">Datos de ejemplo:</span>
                {EJEMPLOS.map((ej) => (
                  <button
                    key={ej.etiqueta}
                    type="button"
                    className="ia-chip"
                    onClick={() => {
                      setCliente(ej.cliente);
                      setDescripcion(ej.descripcion);
                      setError(null);
                    }}
                  >
                    {ej.etiqueta}
                  </button>
                ))}
              </div>

              <Avisos error={error} onReintentar={proponer} />

              <button type="submit" className="boton boton-grande ia-enviar" disabled={ocupado} aria-busy={ocupado || undefined}>
                {ocupado ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Preparando la propuesta…
                  </>
                ) : (
                  <>
                    Preparar propuesta
                    <Icono nombre="flecha" />
                  </>
                )}
              </button>

              {ocupado && <Preparando />}
            </form>
          )}

          {paso === "revision" && (
            <div className="ia-bloques">
              <div className="ia-tarjeta">
                <label className="ia-campo">
                  <span className="ia-campo-titulo">Resumen del proyecto</span>
                  <textarea rows="4" className="ia-entrada" value={resumen} onChange={(e) => setResumen(e.target.value)} />
                  <small className="texto-suave">Si cambias los servicios, ajusta también este texto: aparecerá en el PDF.</small>
                </label>
              </div>

              <div className="ia-tarjeta">
                <div className="ia-titulo-fila">
                  <h3>Servicios propuestos</h3>
                  {sinAceptar > 0 && (
                    <button type="button" className="ia-chip" onClick={aceptarTodos}>
                      Aceptar todos
                    </button>
                  )}
                </div>

                {incluidos.length === 0 && <p className="texto-suave">No hay servicios seleccionados. Añade alguno del catálogo.</p>}

                <ul className="ia-lista">
                  {incluidos.map((s) => {
                    const linea = lineas[s.id];
                    const cantidadMal = s.grupo === "unidad" && !cantidadValida(linea.cantidad);
                    return (
                      <li key={s.id} className="ia-servicio" data-aceptada={linea.aceptada || undefined}>
                        <div className="ia-servicio-cabecera">
                          <strong>{s.nombre}</strong>
                          <span className="ia-precio">{precioDe(s)}</span>
                        </div>
                        <p className="texto-suave">{s.descripcion}</p>
                        {linea.justificacion && <p className="ia-justificacion">{linea.justificacion}</p>}

                        {s.grupo === "unidad" && (
                          <label className="ia-cantidad">
                            <span>Páginas adicionales (sin contar la primera)</span>
                            <input
                              type="number"
                              className="ia-entrada ia-entrada-numero"
                              min="1"
                              max={CANTIDAD_MAX}
                              value={linea.cantidad}
                              // La explicación de la IA citaba la cantidad anterior: ya no sería cierta.
                              onChange={(e) => cambiarLinea(s.id, { cantidad: e.target.value, justificacion: "" })}
                              aria-invalid={cantidadMal || undefined}
                            />
                            {cantidadMal && <small className="texto-error">Dato necesario para calcular esta partida.</small>}
                          </label>
                        )}

                        <div className="ia-acciones">
                          <button
                            type="button"
                            className="ia-chip"
                            data-activo={linea.aceptada || undefined}
                            aria-pressed={linea.aceptada}
                            onClick={() => cambiarLinea(s.id, { aceptada: !linea.aceptada })}
                          >
                            {linea.aceptada ? "Aceptado ✓" : "Aceptar"}
                          </button>
                          <button
                            type="button"
                            className="ia-chip ia-chip-peligro"
                            onClick={() => cambiarLinea(s.id, { incluida: false, aceptada: false })}
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {disponibles.length > 0 && (
                <div className="ia-tarjeta">
                  <h3>Añadir del catálogo</h3>
                  <ul className="ia-lista ia-lista-compacta">
                    {disponibles.map((s) => (
                      <li key={s.id} className="ia-disponible">
                        <div className="ia-disponible-texto">
                          <strong>{s.nombre}</strong>
                          <span className="ia-precio">{precioDe(s)}</span>
                          <p className="texto-suave">
                            {s.grupo === "tipo" && hayTipo ? "Sustituye al tipo de web actual. " : ""}
                            {s.descripcion}
                          </p>
                        </div>
                        <button type="button" className="ia-chip" onClick={() => anadir(s)}>
                          <Icono nombre="mas" />
                          Añadir
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="ia-tarjeta ia-formulario">
                <label className="ia-campo">
                  <span className="ia-campo-titulo">Dudas por aclarar (una por línea)</span>
                  <textarea rows="4" className="ia-entrada" value={dudas} onChange={(e) => setDudas(e.target.value)} />
                </label>
                <label className="ia-campo">
                  <span className="ia-campo-titulo">Fuera de catálogo · pendiente de valorar (una por línea, no suma al total)</span>
                  <textarea rows="4" className="ia-entrada" value={pendientes} onChange={(e) => setPendientes(e.target.value)} />
                </label>
              </div>

              {faltan.length > 0 && (
                <ul className="ia-faltan">
                  {faltan.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <Avisos error={error} onReintentar={calcular} />

              <div className="ia-barra">
                <button type="button" className="boton-texto" onClick={() => irA("descripcion")}>
                  <Icono nombre="atras" />
                  Cambiar la descripción
                </button>
                <button
                  type="button"
                  className="boton boton-grande"
                  disabled={ocupado || faltan.length > 0}
                  aria-busy={ocupado || undefined}
                  onClick={calcular}
                >
                  {ocupado ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Calculando…
                    </>
                  ) : (
                    <>
                      Calcular y ver presupuesto
                      <Icono nombre="flecha" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {paso === "vista" && documento && (
            <div className="ia-bloques">
              <VistaDocumento documento={documento} />
              <Avisos error={error} onReintentar={descargar} />
              <div className="ia-barra">
                <button type="button" className="boton-texto" onClick={() => irA("revision")}>
                  <Icono nombre="atras" />
                  Volver a editar
                </button>
                <button type="button" className="boton-texto" onClick={reiniciar}>
                  Empezar de nuevo
                </button>
                <button type="button" className="boton boton-grande" disabled={ocupado} aria-busy={ocupado || undefined} onClick={descargar}>
                  {ocupado ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Generando…
                    </>
                  ) : (
                    <>
                      Aceptar y descargar PDF
                      <Icono nombre="descarga" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <Camaron estado={estadoCamaron} />
      </div>
    </div>
  );
}
