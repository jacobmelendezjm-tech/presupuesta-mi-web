import { useId, useState } from "react";
import { cuentaPaginas, dosCifras, euros, paginasEnTexto, precioDe } from "./formato.js";
import p from "./Pasos.module.css";

// Contenido de los cuatro pasos del configurador. Cada tarjeta es un radio o un
// checkbox real (dentro de su <fieldset>), así funcionan el teclado y los lectores
// de pantalla sin trucos. Los precios que se ven son los de catálogo del servidor.

/* --------------------------------------------------------------------------
   Miniaturas dibujadas con CSS: cada pieza es [x, y, ancho, alto, rol] en %
   de la miniatura (alto null = pieza cuadrada).
   -------------------------------------------------------------------------- */

const ESQUEMAS = {
  landing: [
    [5, 9, 6, 7, "acento"], [58, 11, 9, 3], [70, 11, 9, 3], [83, 8, 12, 9, "acento"],
    [5, 27, 42, 9, "fuerte"], [5, 40, 31, 9, "fuerte"], [5, 54, 36, 4], [5, 64, 15, 9, "acento"],
    [55, 25, 40, 50, "imagen"],
    [5, 84, 27, 10], [36.5, 84, 27, 10], [68, 84, 27, 10],
  ],
  corporativa: [
    [5, 9, 6, 7, "acento"], [45, 11, 7, 3], [54.5, 11, 7, 3], [64, 11, 7, 3], [73.5, 11, 7, 3], [83, 11, 7, 3],
    [5, 25, 42, 36, "imagen"], [53, 27, 38, 8, "fuerte"], [53, 40, 30, 4], [53, 48, 34, 4], [53, 56, 13, 6, "acento"],
    [5, 68, 27, 12], [36.5, 68, 27, 12], [68, 68, 27, 12],
    [5, 85, 4.5, null, "avatar"], [11, 85, 4.5, null, "avatar"], [17, 85, 4.5, null, "avatar"], [68, 88, 27, 3],
  ],
  ecommerce: [
    [5, 9, 6, 7, "acento"], [20, 8, 44, 9, "campo"], [80, 8, 6, 9], [89, 8, 6, 9, "acento"],
    [5, 24, 90, 20, "imagen"], [9, 29, 28, 4, "fuerte"], [9, 36, 18, 3],
    [5, 50, 20, 28, "imagen"], [28.3, 50, 20, 28, "imagen"], [51.6, 50, 20, 28, "imagen"], [75, 50, 20, 28, "imagen"],
    [5, 82, 14, 4], [28.3, 82, 14, 4], [51.6, 82, 14, 4], [75, 82, 14, 4],
    [5, 89, 8, 4, "acento"], [28.3, 89, 8, 4, "acento"], [51.6, 89, 8, 4, "acento"], [75, 89, 8, 4, "acento"],
  ],
  saas: [
    [0, 0, 11, 100, "lateral"], [3.5, 12, 4, null, "acento"], [3.5, 28, 4, null], [3.5, 44, 4, null], [3.5, 60, 4, null],
    [16, 8, 34, 8, "campo"], [88, 6, 6, null, "avatar"],
    [16, 24, 24, 17], [43, 24, 24, 17], [70, 24, 24, 17],
    [19, 30, 9, 5, "acento"], [46, 30, 9, 5, "fuerte"], [73, 30, 9, 5, "fuerte"],
    [16, 71, 5, 21, "barra"], [23, 61, 5, 31, "barra"], [30, 67, 5, 25, "barra"],
    [37, 53, 5, 39, "acento"], [44, 59, 5, 33, "barra"], [51, 47, 5, 45, "acento"],
    [62, 50, 32, 5], [62, 60, 32, 5], [62, 70, 32, 5], [62, 80, 32, 5],
  ],
};

// La misma página pequeña para comparar los enfoques de diseño.
const PIEZAS_DISENO = [
  [5, 9, 6, 7, "logo"], [60, 11, 9, 3, "texto"], [72, 11, 9, 3, "texto"], [84, 8, 11, 9, "boton"],
  [5, 28, 40, 9, "titulo"], [5, 41, 29, 9, "titulo"], [5, 55, 34, 4, "texto"], [5, 65, 15, 9, "boton"],
  [53, 24, 42, 54, "hero"],
  [5, 84, 27, 10, "tarjeta"], [36.5, 84, 27, 10, "tarjeta"], [68, 84, 27, 10, "tarjeta"],
];

function Esquema({ piezas, variante, diseno }) {
  return (
    <span className={p.esquema} data-variante={variante} data-diseno={diseno} aria-hidden="true">
      {piezas.map(([x, y, ancho, alto, rol], i) => (
        <span
          key={i}
          className={p.pieza}
          data-rol={rol}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${ancho}%`,
            ...(alto == null ? { aspectRatio: "1" } : { height: `${alto}%` }),
            "--i": i,
          }}
        />
      ))}
      {diseno === "inmersivo" && (
        <span className={p.cubo}>
          <i /><i /><i /><i /><i /><i />
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Iconos de línea (24 × 24) de las opciones
   -------------------------------------------------------------------------- */

const ICONOS = {
  redaccion: <path d="M4 6h16M4 11h16M4 16h8m4.5 4.5L21 16l-2.5-2.5L14 18v2.5Z" />,
  formulario: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  cms: (
    <>
      <path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  segundoIdioma: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  crmPagos: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </>
  ),
  seo: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.6-4.6M7.5 12l2-2 1.5 1.5 2.5-2.5" />
    </>
  ),
  autenticacion: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
    </>
  ),
  urgente: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />,
  soporte: <path d="M20.5 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5Z" />,
  plan: <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />,
  ninguno: <path d="M6 6l12 12M18 6 6 18" />,
};

function Icono({ id }) {
  return (
    <span className={p.icono} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {ICONOS[id]}
      </svg>
    </span>
  );
}

function Check({ salta }) {
  return (
    <svg className={p.check} data-salta={salta || undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Tarjeta seleccionable y grupo
   -------------------------------------------------------------------------- */

// `pendiente`: es la última que se ha tocado y el servidor aún está recalculando
// (su marca muestra un mini spinner). `salta`: al confirmarse, el check salta.
function Tarjeta({ tipo = "checkbox", nombre, activa, pendiente, salta, alCambiar, titulo, descripcion, precio, visual, icono, insignia, nivel, ancha }) {
  return (
    <label className={p.tarjeta} data-activa={activa || undefined} data-pendiente={pendiente || undefined} data-ancha={ancha || undefined}>
      <input className="oculto" type={tipo} name={nombre} checked={activa} onChange={alCambiar} />
      {visual}
      <span className={p.cabecera}>
        {icono && <Icono id={icono} />}
        <span className={p.titulo}>{titulo}</span>
        <span className={p.marca} data-radio={tipo === "radio" || undefined} aria-hidden="true">
          {pendiente ? <span className={`spinner ${p.spinnerMarca}`} /> : activa && <Check salta={salta} />}
        </span>
      </span>
      {descripcion && <span className={p.texto}>{descripcion}</span>}
      <span className={p.pie}>
        {precio && <span className={p.precio}>{precio}</span>}
        {nivel != null && (
          <span className={p.nivel} aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <i key={n} data-encendido={n <= nivel || undefined} />
            ))}
          </span>
        )}
        {insignia && <span className={p.insignia}>{insignia}</span>}
      </span>
    </label>
  );
}

function Grupo({ leyenda, legendaOculta, nota, orden, children }) {
  return (
    <fieldset className={p.grupo} data-anima style={{ "--orden": orden }}>
      <legend className={legendaOculta ? "oculto" : p.leyenda}>
        <span>{leyenda}</span>
      </legend>
      {nota && <p className={p.nota}>{nota}</p>}
      <div className={p.rejilla}>{children}</div>
    </fieldset>
  );
}

// ¿Es esta tarjeta la que acaba de cambiar? (`ultimoCambio` viene de useCalculator)
const esUltima = (u, grupo, id) => Boolean(u) && u.grupo === grupo && u.id === id && u.accion !== "quitar";
const esUltimaQuitada = (u, grupo) => Boolean(u) && u.grupo === grupo && u.accion === "quitar";

/* --------------------------------------------------------------------------
   Pasos
   -------------------------------------------------------------------------- */

function PasoTipo({ c, ocupado }) {
  const u = c.ultimoCambio;
  return (
    <Grupo leyenda="Tipo de proyecto" legendaOculta orden={3}>
      {c.catalogo.tipos.map((t) => (
        <Tarjeta
          key={t.id}
          tipo="radio"
          nombre="tipo-proyecto"
          activa={c.tipo === t.id}
          pendiente={ocupado && esUltima(u, "tipo", t.id)}
          salta={esUltima(u, "tipo", t.id)}
          alCambiar={() => c.setTipo(t.id)}
          titulo={t.nombre}
          descripcion={t.descripcion}
          precio={`Desde ${euros.format(t.precio)}`}
          visual={<Esquema piezas={ESQUEMAS[t.id] ?? ESQUEMAS.landing} variante={t.id} />}
        />
      ))}
    </Grupo>
  );
}

function SelectorPaginas({ c, ocupado, orden }) {
  const id = useId();
  const max = c.catalogo.paginasMax;
  const { paginas } = c;
  // Dirección del último cambio, para que el número suba o baje al animarse.
  const [previo, setPrevio] = useState(paginas);
  const [direccion, setDireccion] = useState("sube");
  if (previo !== paginas) {
    setPrevio(paginas);
    setDireccion(paginas > previo ? "sube" : "baja");
  }

  const cambiar = (n) => c.setPaginas(Math.min(max, Math.max(1, n)));
  const linea = c.estimacion?.lineas.find((l) => l.id === "paginaAdicional");
  const pendiente = ocupado && c.ultimoCambio?.grupo === "paginas";
  const enMinimo = paginas <= 1;
  const enMaximo = paginas >= max;

  return (
    <div className={p.paginas} role="group" aria-labelledby={`${id}-titulo`} data-anima style={{ "--orden": orden }}>
      <p className={p.leyenda} id={`${id}-titulo`}>
        <span>Número de páginas</span>
      </p>

      <div className={p.paginasFila}>
        <button
          type="button"
          className={p.circulo}
          aria-label="Quitar una página"
          aria-disabled={enMinimo || undefined}
          onClick={() => !enMinimo && cambiar(paginas - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
        </button>

        <div className={p.paginasValor}>
          <span className={p.paginasVentana} aria-hidden="true">
            <span key={paginas} className={p.paginasNumero} data-direccion={direccion}>
              {dosCifras(paginas)}
            </span>
          </span>
          <span className={p.paginasEtiqueta}>
            {paginas === 1 ? "Página" : "Páginas"}
            {pendiente && <span className="spinner" style={{ "--tam": "11px" }} aria-hidden="true" />}
          </span>
        </div>

        <button
          type="button"
          className={p.circulo}
          aria-label="Añadir una página"
          aria-disabled={enMaximo || undefined}
          onClick={() => !enMaximo && cambiar(paginas + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
        </button>
      </div>

      <div className={p.regla} style={{ "--avance": `${((paginas - 1) / (max - 1)) * 100}%` }}>
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={paginas}
          onChange={(e) => cambiar(Number(e.target.value))}
          aria-label="Número de páginas"
          aria-valuetext={paginasEnTexto(paginas)}
        />
        <span className={p.reglaMarcas} aria-hidden="true">
          <span>01</span>
          <span>{dosCifras(Math.round((max + 1) / 2))}</span>
          <span>{dosCifras(max)}</span>
        </span>
      </div>

      <p className={p.nota}>
        La primera página va incluida en el tipo de proyecto.
        {linea && (
          <>
            {" "}
            <strong className={p.notaFuerte}>
              {linea.cantidad} {linea.cantidad === 1 ? "adicional" : "adicionales"} × {euros.format(linea.precioUnitario)}
            </strong>
          </>
        )}
      </p>
      <p className="oculto" aria-live="polite">
        {paginasEnTexto(paginas)}
      </p>
    </div>
  );
}

function PasoAlcance({ c, ocupado }) {
  const u = c.ultimoCambio;
  const disenos = c.catalogo.opciones.filter((o) => o.grupo === "diseno");
  const contenidos = c.catalogo.opciones.filter((o) => o.grupo === "contenido");
  const actual = disenos.find((o) => c.opciones.includes(o.id))?.id ?? null;
  const nombreTipo = c.catalogo.tipos.find((t) => t.id === c.tipo)?.nombre ?? "este tipo de proyecto";

  return (
    <>
      <Grupo leyenda="Enfoque de diseño" orden={3}>
        {disenos.map((o) => (
          <Tarjeta
            key={o.id}
            tipo="radio"
            nombre="enfoque-diseno"
            activa={actual === o.id}
            pendiente={ocupado && esUltima(u, "diseno", o.id)}
            salta={esUltima(u, "diseno", o.id)}
            alCambiar={() => c.alternarOpcion(o.id)}
            titulo={o.nombre}
            descripcion={o.descripcion}
            precio={precioDe(o)}
            visual={<Esquema piezas={PIEZAS_DISENO} diseno={o.id} />}
          />
        ))}
        <Tarjeta
          tipo="radio"
          nombre="enfoque-diseno"
          activa={actual === null}
          pendiente={ocupado && esUltimaQuitada(u, "diseno")}
          salta={esUltimaQuitada(u, "diseno")}
          alCambiar={() => actual && c.alternarOpcion(actual)}
          titulo="Sin definir"
          descripcion="Lo decidimos más adelante: la maqueta queda en alambre."
          precio="+0 €"
          visual={<Esquema piezas={PIEZAS_DISENO} diseno="ninguno" />}
        />
      </Grupo>

      <Grupo leyenda="Contenidos" orden={4}>
        {contenidos.map((o) => (
          <Tarjeta
            key={o.id}
            ancha
            icono={o.id}
            activa={c.opciones.includes(o.id)}
            pendiente={ocupado && u?.id === o.id}
            salta={esUltima(u, o.grupo, o.id)}
            alCambiar={() => c.alternarOpcion(o.id)}
            titulo={o.nombre}
            descripcion={o.descripcion}
            precio={precioDe(o)}
          />
        ))}
      </Grupo>

      {cuentaPaginas(c.tipo) ? (
        <SelectorPaginas c={c} ocupado={ocupado} orden={5} />
      ) : (
        <p className={p.aviso} data-anima style={{ "--orden": 5 }}>
          En {nombreTipo} el precio no depende del número de páginas: lo marcan el diseño y los módulos.
        </p>
      )}
    </>
  );
}

function PasoFunciones({ c, ocupado }) {
  const u = c.ultimoCambio;
  return (
    <Grupo leyenda="Módulos funcionales" orden={3}>
      {c.catalogo.opciones
        .filter((o) => o.grupo === "funcion")
        .map((o) => (
          <Tarjeta
            key={o.id}
            icono={o.id}
            activa={c.opciones.includes(o.id)}
            pendiente={ocupado && u?.id === o.id}
            salta={esUltima(u, o.grupo, o.id)}
            alCambiar={() => c.alternarOpcion(o.id)}
            titulo={o.nombre}
            descripcion={o.descripcion}
            precio={precioDe(o)}
          />
        ))}
    </Grupo>
  );
}

function PasoPlazos({ c, ocupado }) {
  const u = c.ultimoCambio;
  return (
    <>
      <Grupo leyenda="Plazos y soporte" orden={3}>
        {c.catalogo.opciones
          .filter((o) => o.grupo === "plazo")
          .map((o) => (
            <Tarjeta
              key={o.id}
              icono={o.id}
              activa={c.opciones.includes(o.id)}
              pendiente={ocupado && u?.id === o.id}
              salta={esUltima(u, o.grupo, o.id)}
              alCambiar={() => c.alternarOpcion(o.id)}
              titulo={o.nombre}
              descripcion={o.descripcion}
              precio={precioDe(o)}
            />
          ))}
      </Grupo>

      <Grupo leyenda="Mantenimiento mensual" nota="Servicio opcional tras la entrega: aparece aparte y nunca se suma al total." orden={4}>
        <Tarjeta
          tipo="radio"
          nombre="plan-mantenimiento"
          icono="ninguno"
          activa={c.planId === null}
          pendiente={ocupado && esUltimaQuitada(u, "plan")}
          salta={esUltimaQuitada(u, "plan")}
          alCambiar={() => c.setPlanId(null)}
          titulo="Sin mantenimiento"
          descripcion="Podrás contratarlo más adelante."
          precio="0 €/mes"
          nivel={0}
        />
        {c.catalogo.planes.map((plan, i) => (
          <Tarjeta
            key={plan.id}
            tipo="radio"
            nombre="plan-mantenimiento"
            icono="plan"
            activa={c.planId === plan.id}
            pendiente={ocupado && esUltima(u, "plan", plan.id)}
            salta={esUltima(u, "plan", plan.id)}
            alCambiar={() => c.setPlanId(plan.id)}
            titulo={plan.nombre}
            descripcion={plan.descripcion}
            precio={`${euros.format(plan.precioMensual)}/mes`}
            nivel={i + 1}
            insignia={plan.recomendado ? "Recomendado" : null}
          />
        ))}
      </Grupo>
    </>
  );
}

export const CONTENIDO_PASOS = [PasoTipo, PasoAlcance, PasoFunciones, PasoPlazos];

/** Tarjetas de carga mientras llega el catálogo. */
export function EsqueletoPaso() {
  return (
    <div className={p.rejilla} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`skeleton ${p.tarjetaEsqueleto}`} />
      ))}
    </div>
  );
}
