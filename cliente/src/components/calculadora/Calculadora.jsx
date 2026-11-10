import { useEffect, useId, useRef, useState } from "react";
import { VistaWeb3D } from "../escena/VistaWeb3D.jsx";
import { NumeroAnimado } from "../ui/numero-animado.jsx";
import { useEstadoMinimo } from "../ui/use-estado-minimo.js";
import { CONTENIDO_PASOS, EsqueletoPaso } from "./Pasos.jsx";
import { Resumen } from "./Resumen.jsx";
import { cuentaPaginas, dosCifras, euros, paginasEnTexto } from "./formato.js";
import { useReducirMovimiento } from "../ui/use-reducir-movimiento.js";
import s from "./Calculadora.module.css";

// Configurador por pasos con la distribución de la referencia: a la izquierda,
// la escena 3D con la web del cliente (fija mientras se desplaza el panel), la
// paginación de puntos y la fila de specs; a la derecha, el panel del paso y el
// resumen. El importe SIEMPRE llega del servidor (useCalculator).

const PASOS = [
  {
    corto: "Tipo",
    nombre: "Tipo de proyecto",
    clave: "Tipo",
    resto: "de proyecto",
    texto: "Elige la base de tu web. La vista previa se monta al instante y el servidor calcula el precio con sus propias tarifas.",
  },
  {
    corto: "Alcance",
    nombre: "Alcance y diseño",
    clave: "Alcance",
    resto: "y diseño",
    texto: "Decide cómo se verá y cuántas páginas tendrá. Cada elección se construye en la maqueta antes de llegar a tu presupuesto.",
  },
  {
    corto: "Funciones",
    nombre: "Funcionalidades",
    clave: "Funciones",
    resto: "a medida",
    texto: "Añade solo lo que necesitas: cada módulo aparece en la vista previa con su precio de catálogo.",
  },
  {
    corto: "Plazos",
    nombre: "Plazos y mantenimiento",
    clave: "Plazos",
    resto: "y mantenimiento",
    texto: "Ajusta la entrega y, si quieres, un plan mensual. Lo mensual va aparte y nunca se suma al total.",
  },
];
const TOTAL_PASOS = PASOS.length;

// Lo que tarda en desvanecerse el paso anterior antes de entrar el nuevo.
const SALIDA_MS = 220;

const NOMBRE_DISENO = { plantilla: "Plantilla", uiCustom: "UI Custom", inmersivo: "3D inmersivo" };

// Paso que se ve en el panel. Va un poco por detrás de `paso` para que el
// anterior pueda salir con un fundido antes de que entre el nuevo.
function useTransicionPaso(paso, reducido) {
  const [vista, setVista] = useState({ paso, fase: "quieto", direccion: "adelante" });

  useEffect(() => {
    if (paso === vista.paso) return undefined;
    const direccion = paso > vista.paso ? "adelante" : "atras";
    if (reducido) {
      setVista({ paso, fase: "quieto", direccion });
      return undefined;
    }
    setVista((v) => ({ ...v, fase: "saliendo", direccion }));
    const espera = setTimeout(() => setVista({ paso, fase: "entrando", direccion }), SALIDA_MS);
    return () => clearTimeout(espera);
  }, [paso, vista.paso, reducido]);

  return vista;
}

// Desplaza hasta un elemento solo si ha quedado por encima de la zona visible:
// la cabecera (scroll-padding-top de html) y, en móvil, la escena fija
// (scroll-margin-top del elemento).
function traerAVista(elemento, reducido) {
  if (!elemento) return;
  const cabecera = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margen = parseFloat(getComputedStyle(elemento).scrollMarginTop) || 0;
  if (elemento.getBoundingClientRect().top < cabecera + margen - 2) {
    elemento.scrollIntoView({ block: "start", behavior: reducido ? "auto" : "smooth" });
  }
}

function Flecha({ direccion = "derecha" }) {
  const trazo = { derecha: "M5 12h14m0 0-5-5m5 5-5 5", izquierda: "M19 12H5m0 0 5-5m-5 5 5 5", abajo: "M12 5v14m0 0-5-5m5 5 5-5" }[direccion];
  return (
    <svg className={s.flecha} data-direccion={direccion} viewBox="0 0 24 24" aria-hidden="true">
      <path d={trazo} />
    </svg>
  );
}

// Una spec de la fila inferior («05 PÁG / PÁGINAS»). El valor se remonta al
// cambiar (key) y hace un destello verde. `lector` es el texto para lectores.
function Spec({ etiqueta, valor, lector }) {
  return (
    <div className="spec">
      <dt className="spec-etiqueta">{etiqueta}</dt>
      <dd className="spec-valor">
        <span key={valor} className={s.specCambio} aria-hidden={lector ? "true" : undefined}>
          {valor}
        </span>
        {lector && <span className="oculto">{lector}</span>}
      </dd>
    </div>
  );
}

export function Calculadora({ c }) {
  const reducido = useReducirMovimiento();
  // Spinner visible al menos 450 ms para que no parpadee con respuestas rápidas.
  const ocupado = useEstadoMinimo(c.calculando, 450);
  const vista = useTransicionPaso(c.paso, reducido);
  const idPista = useId();

  const pestanasRef = useRef(null);
  const tituloRef = useRef(null);
  const resumenRef = useRef(null);
  const enfocarAlEntrar = useRef(false);

  // Tras un cambio de paso pedido por el usuario, el foco pasa al titular nuevo
  // (así el lector de pantalla lee el paso; con el ratón no se ve el anillo).
  useEffect(() => {
    if (!enfocarAlEntrar.current || vista.fase === "saliendo" || vista.paso !== c.paso) return;
    enfocarAlEntrar.current = false;
    tituloRef.current?.focus({ preventScroll: true });
  }, [vista, c.paso]);

  const bloqueado = (n) => n > 1 && !c.tipo;

  const irAPaso = (n) => {
    if (n === c.paso || n < 1 || n > TOTAL_PASOS || bloqueado(n)) return;
    enfocarAlEntrar.current = true;
    c.setPaso(n);
    traerAVista(pestanasRef.current, reducido);
  };

  const verResumen = (evento) => {
    evento.preventDefault();
    document.getElementById("desglose")?.scrollIntoView({ block: "start", behavior: reducido ? "auto" : "smooth" });
    resumenRef.current?.focus({ preventScroll: true });
  };

  // Datos de la fila de specs (solo nombres y recuentos: el importe es del servidor).
  const grupoDe = (id) => c.catalogo?.opciones.find((o) => o.id === id)?.grupo;
  const disenoId = c.opciones.find((id) => grupoDe(id) === "diseno") ?? null;
  const modulos = c.opciones.filter((id) => grupoDe(id) === "funcion").length;
  const porPaginas = cuentaPaginas(c.tipo);

  const datos = PASOS[vista.paso - 1];
  const Contenido = CONTENIDO_PASOS[vista.paso - 1];
  const puedeAvanzar = c.paso > 1 || Boolean(c.tipo);

  let contenido;
  if (c.catalogo) {
    contenido = <Contenido c={c} ocupado={ocupado} />;
  } else if (c.error) {
    contenido = (
      <div className={s.errorCatalogo} role="alert">
        <p>{c.error}</p>
        <button type="button" className="boton-contorno" onClick={c.recargarCatalogo}>
          Reintentar
        </button>
      </div>
    );
  } else {
    contenido = (
      <>
        <p className="oculto" role="status">
          Cargando el catálogo…
        </p>
        <EsqueletoPaso />
      </>
    );
  }

  return (
    <div className={s.configurador}>
      <h2 className="oculto">Configurador de tu presupuesto</h2>

      {/* Escena: la web del cliente en 3D, fija mientras se desplaza el panel */}
      <div className={s.escena}>
        <div className={s.lienzo}>
          <VistaWeb3D
            tipo={c.tipo}
            paginas={c.paginas}
            opciones={c.opciones}
            plan={c.plan}
            paso={c.paso}
            calculando={c.calculando}
            catalogo={c.catalogo}
          />
        </div>

        <nav className={s.puntos} aria-label="Pasos (vista previa)">
          <ol>
            {PASOS.map((paso, i) => {
              const n = i + 1;
              return (
                <li key={paso.corto}>
                  <button
                    type="button"
                    className={s.punto}
                    aria-label={`Paso ${n}: ${paso.nombre}`}
                    aria-current={c.paso === n ? "step" : undefined}
                    disabled={bloqueado(n)}
                    onClick={() => irAPaso(n)}
                  >
                    <span className={s.puntoMarca} aria-hidden="true" />
                    <span className={s.puntoTexto} aria-hidden="true">
                      {dosCifras(n)} {paso.corto}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={s.pieEscena}>
          <dl className={`specs ${s.specs}`}>
            <Spec
              etiqueta="Páginas"
              valor={porPaginas ? `${dosCifras(c.paginas)} pág` : "—"}
              lector={porPaginas ? paginasEnTexto(c.paginas) : "No se cobran por páginas"}
            />
            <Spec etiqueta="Diseño" valor={NOMBRE_DISENO[disenoId] ?? "Sin definir"} />
            <Spec etiqueta="Funciones" valor={`${modulos} ${modulos === 1 ? "módulo" : "módulos"}`} />
            <div className="spec">
              <dt className="spec-etiqueta">Estimación</dt>
              <dd className={`spec-valor ${s.specTotal}`} data-apagado={c.error ? true : undefined}>
                <NumeroAnimado valor={c.estimacion?.total ?? null} formato={euros.format} />
                <span className={`spinner ${s.specSpinner}`} data-visible={ocupado || undefined} aria-hidden="true" />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Panel: pestañas, paso actual, navegación y resumen */}
      <div className={s.panel}>
        <nav className={s.pestanas} aria-label="Pasos del configurador" ref={pestanasRef}>
          <ol className={s.pestanasLista}>
            {PASOS.map((paso, i) => {
              const n = i + 1;
              return (
                <li key={paso.corto}>
                  <button
                    type="button"
                    className={s.pestana}
                    aria-current={c.paso === n ? "step" : undefined}
                    data-hecho={n < c.paso || undefined}
                    disabled={bloqueado(n)}
                    onClick={() => irAPaso(n)}
                  >
                    <span className={s.pestanaNumero}>{dosCifras(n)}</span>
                    <span className={s.pestanaNombre}>{paso.corto}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div key={vista.paso} className={s.bloque} data-fase={vista.fase} data-direccion={vista.direccion}>
          <header className={s.cabeceraPaso}>
            <span className={`fantasma ${s.numeroFantasma}`} aria-hidden="true">
              {dosCifras(vista.paso)}
            </span>
            <p className={`etiqueta ${s.etiquetaPaso}`} aria-hidden="true" data-anima style={{ "--orden": 0 }}>
              Paso {dosCifras(vista.paso)} / {dosCifras(TOTAL_PASOS)}
            </p>
            <h3
              className={`titular ${s.tituloPaso}`}
              ref={tituloRef}
              tabIndex={-1}
              data-anima
              style={{ "--orden": 1, "--largo": Math.max(datos.clave.length, datos.resto.length) }}
            >
              <span className="oculto">
                Paso {vista.paso} de {TOTAL_PASOS}:{" "}
              </span>
              <span className="verde">{datos.clave}</span> <span>{datos.resto}</span>
            </h3>
            <p className={`entradilla ${s.entradillaPaso}`} data-anima style={{ "--orden": 2 }}>
              {datos.texto}
            </p>
          </header>

          <div className={s.contenido}>{contenido}</div>
        </div>

        <div className={s.navegacion}>
          <button
            type="button"
            className="boton-texto"
            aria-disabled={c.paso === 1 || undefined}
            onClick={() => irAPaso(c.paso - 1)}
          >
            <Flecha direccion="izquierda" />
            Atrás
          </button>

          <span className={s.contador} aria-hidden="true">
            <strong>{dosCifras(c.paso)}</strong> / {dosCifras(TOTAL_PASOS)}
          </span>

          {c.paso < TOTAL_PASOS ? (
            <button
              type="button"
              className="boton"
              aria-disabled={!puedeAvanzar || undefined}
              aria-describedby={puedeAvanzar ? undefined : idPista}
              onClick={() => irAPaso(c.paso + 1)}
            >
              Continuar
              <Flecha />
            </button>
          ) : (
            <a href="#desglose" className="boton" onClick={verResumen}>
              Ver mi presupuesto
              <Flecha direccion="abajo" />
            </a>
          )}

          {!puedeAvanzar && (
            <p className={s.pista} id={idPista}>
              Elige un tipo de proyecto para continuar.
            </p>
          )}
        </div>

        <Resumen c={c} ocupado={ocupado} tituloRef={resumenRef} />
      </div>
    </div>
  );
}
