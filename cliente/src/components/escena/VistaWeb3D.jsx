import { useEffect, useRef } from "react";
import s from "./VistaWeb3D.module.css";
import { TIEMPOS, usePresencia } from "./usePresencia.js";
import { useInclinacion, useReducirMovimiento, useVisibilidad } from "./useEscena.js";
import { useDemo } from "./useDemo.js";
import { Maqueta, URLS } from "./Maquetas.jsx";
import { Estelas, Gemela, Hojas, HOJAS_VISIBLES, Mantenimiento, ModulosFlotantes } from "./Modulos.jsx";
import { useEstadoMinimo } from "../ui/use-estado-minimo.js";

// Vista previa 3D de la web del cliente. Es un «render de producto» en CSS 3D:
// cada elección del configurador aparece en la maqueta como skeleton + spinner,
// se materializa con un destello verde y la cámara cambia de ángulo en cada paso.
// Solo muestra: el precio de catálogo de una opción lo publica el servidor.

export const NOMBRES_TIPO = { landing: "LANDING", corporativa: "CORPORATIVA", ecommerce: "E-COMMERCE", saas: "SAAS" };

const NOMBRES_LARGOS = { landing: "Landing page", corporativa: "Web corporativa", ecommerce: "E-commerce", saas: "Aplicación web / SaaS" };
const NOMBRES_PLAN = { basico: "Básico", profesional: "Profesional", premium: "Premium" };

const DISENOS = new Set(["plantilla", "uiCustom", "inmersivo"]);
// Orden fijo: así la presencia no cambia si el padre reordena la lista
const FUNCIONES = ["redaccion", "formulario", "cms", "segundoIdioma", "crmPagos", "seo", "autenticacion", "urgente", "soporte"];

// Nombre corto de cada pieza para el HUD («CONSTRUYENDO FORMULARIO…»)
const NOMBRES_HUD = {
  plantilla: "plantilla",
  uiCustom: "UI custom",
  inmersivo: "diseño 3D",
  ninguno: "estructura",
  redaccion: "contenidos",
  formulario: "formulario",
  cms: "CMS",
  segundoIdioma: "multidioma",
  crmPagos: "pagos y CRM",
  seo: "SEO",
  autenticacion: "acceso",
  urgente: "prioridad",
  soporte: "soporte",
};

// Duraciones de cada fase en ms (constantes: usePresencia las usa como dependencia)
const TIEMPOS_MAQUETA = { inicial: 500, construyendo: 420, marcado: 1100, saliendo: 260 };
const TIEMPOS_HOJA = { inicial: 500, construyendo: 280, marcado: 900, saliendo: 260 };
const TIEMPOS_FANTASMA = { inicial: 600, construyendo: 500, marcado: 0, saliendo: 400 };

const formatoEuros = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: "always" });
const enObra = (fase) => fase === "construyendo" || fase === "marcado";
const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));

/** Texto de la etiqueta de precio («+80 €», «+49 €/mes», «Base 600 €») con los datos del catálogo. */
function precioDe(catalogo, clave) {
  const opcion = catalogo.opciones?.find((o) => o.id === clave);
  if (opcion) return `+${formatoEuros.format(opcion.precio)} €${opcion.periodo === "mes" ? "/mes" : ""}`;
  const plan = catalogo.planes?.find((p) => p.id === clave);
  if (plan) return `+${formatoEuros.format(plan.precioMensual)} €/mes`;
  const tipo = catalogo.tipos?.find((t) => t.id === clave);
  if (tipo) return `Base ${formatoEuros.format(tipo.precio)} €`;
  return null;
}

/** Resumen para lectores de pantalla (la escena es decorativa). */
function resumir({ demo, tipo, paginas, diseno, funciones, plan, catalogo }) {
  if (demo) return "Vista previa 3D animada: una web de ejemplo que se configura sola.";
  if (!tipo) return "Vista previa 3D de tu web: todavía no has elegido el tipo de proyecto.";
  const nombre = (id) => catalogo?.opciones?.find((o) => o.id === id)?.nombre ?? NOMBRES_HUD[id] ?? id;
  const tipoNombre = catalogo?.tipos?.find((t) => t.id === tipo)?.nombre ?? NOMBRES_LARGOS[tipo];
  const conPaginas = tipo === "landing" || tipo === "corporativa";
  const partes = [`${tipoNombre}${conPaginas ? ` de ${paginas} ${paginas === 1 ? "página" : "páginas"}` : ""}`];
  partes.push(diseno === "ninguno" ? "sin diseño definido" : `diseño ${nombre(diseno)}`);
  if (funciones.length) partes.push(`con ${funciones.map(nombre).join(", ")}`);
  if (plan) partes.push(`mantenimiento ${plan.nombre}`);
  return `Vista previa 3D de tu web: ${partes.join(", ")}.`;
}

/** La fase que manda en la maqueta: la del tipo o la del diseño, la más «activa». */
const PRIORIDAD = { listo: 0, inicial: 1, marcado: 2, construyendo: 3 };
function faseObra(faseMaqueta, faseDiseno) {
  const diseno = faseDiseno === "inicial" ? "listo" : faseDiseno ?? "listo";
  return (PRIORIDAD[diseno] ?? 0) > (PRIORIDAD[faseMaqueta] ?? 0) ? diseno : faseMaqueta;
}

/** data-texto de la maqueta según la fase de «Redacción de contenidos». */
function estadoTexto(fase) {
  if (!fase) return "barras";
  if (fase === "listo" || fase === "inicial") return "texto";
  return fase; // construyendo · marcado · saliendo
}

export function VistaWeb3D(props) {
  const { demo = false, className = "" } = props;
  const raiz = useRef(null);
  const fantasmasRef = useRef(null);
  const focoRef = useRef(null);
  const camaraRef = useRef(null);

  const reducido = useReducirMovimiento();
  const visible = useVisibilidad(raiz);
  const guion = useDemo(demo, visible, reducido);
  useInclinacion(raiz, !reducido && visible);

  // En la demo manda el guion y se ignoran el resto de props
  const fuente = demo ? guion : props;
  const tipo = NOMBRES_TIPO[fuente.tipo] ? fuente.tipo : null;
  const paginas = limitar(Math.round(Number(fuente.paginas) || 1), 1, 20);
  const opciones = Array.isArray(fuente.opciones) ? fuente.opciones : [];
  const plan = fuente.plan?.id ? fuente.plan : null;
  const paso = demo ? 1 : limitar(Math.round(Number(props.paso) || 1), 1, 4);
  const catalogo = demo ? null : props.catalogo ?? null;
  const calculando = useEstadoMinimo(!demo && Boolean(props.calculando) && Boolean(tipo), 200);

  const diseno = opciones.find((id) => DISENOS.has(id)) ?? "ninguno";
  const funciones = FUNCIONES.filter((id) => opciones.includes(id));
  const conHojas = tipo === "landing" || tipo === "corporativa";
  const hojasExtra = conHojas ? paginas - 1 : 0;
  const hojasVisibles = Math.min(hojasExtra, HOJAS_VISIBLES);

  // Presencia animada de cada cosa que puede aparecer o irse
  const maquetas = usePresencia([tipo ?? "vacio"], TIEMPOS_MAQUETA);
  const disenos = usePresencia([tipo ? diseno : "-"], TIEMPOS);
  const modulos = usePresencia(funciones, TIEMPOS);
  const hojas = usePresencia(
    Array.from({ length: hojasVisibles }, (_, k) => `h${k + 1}`),
    TIEMPOS_HOJA
  );
  const planes = usePresencia(plan ? [plan.id] : [], TIEMPOS);
  const fantasmas = usePresencia([tipo ? NOMBRES_TIPO[tipo] : "TU WEB"], TIEMPOS_FANTASMA);

  const fases = new Map(modulos.map((item) => [item.clave, item.fase]));
  const faseMaqueta = maquetas.find((item) => item.clave === (tipo ?? "vacio"))?.fase ?? "listo";
  const faseDiseno = disenos.find((item) => item.clave === (tipo ? diseno : "-"))?.fase;
  const urgente = fases.has("urgente") && fases.get("urgente") !== "saliendo";

  // Lo último que se ha añadido lleva el spinner en su etiqueta mientras se calcula
  const recientes = [
    ...modulos.map((item) => ({ ...item, nombre: NOMBRES_HUD[item.clave] })),
    ...planes.map((item) => ({ ...item, nombre: "mantenimiento" })),
    ...hojas.map((item) => ({ ...item, nombre: "páginas" })),
    ...disenos.filter((item) => item.clave !== "-").map((item) => ({ ...item, nombre: NOMBRES_HUD[item.clave] })),
    ...maquetas.filter((item) => item.clave !== "vacio").map((item) => ({ ...item, nombre: NOMBRES_TIPO[item.clave] })),
  ]
    .filter((item) => enObra(item.fase))
    .sort((a, b) => b.desde - a.desde);
  const ultimo = recientes[0]?.clave;
  // Al cambiar de tipo, el HUD nombra el tipo (no la «estructura» que llega a la vez)
  const construyendo =
    faseMaqueta === "construyendo" && tipo
      ? { nombre: NOMBRES_TIPO[tipo] }
      : recientes.find((item) => item.fase === "construyendo" && item.clave !== "ninguno");

  const etiqueta = (clave, dentro = false, faseForzada) => {
    if (!catalogo) return null;
    const fase = faseForzada ?? fases.get(clave);
    if (!enObra(fase)) return null;
    const texto = precioDe(catalogo, clave);
    if (!texto) return null;
    return (
      <span className={`${s.precio} ${dentro ? s.precioDentro : ""}`}>
        {calculando && ultimo === clave && <span className="spinner" />}
        {texto}
      </span>
    );
  };

  // Etiqueta de la ventana: precio base del tipo nuevo, del diseño recién elegido
  // o de la redacción (que no tiene un módulo propio donde colgarla)
  const etiquetaVentana =
    (tipo && enObra(faseMaqueta) && etiqueta(tipo, false, faseMaqueta)) ||
    (tipo && diseno !== "ninguno" && enObra(faseDiseno) && etiqueta(diseno, false, faseDiseno)) ||
    (tipo && etiqueta("redaccion")) ||
    null;

  const ctx = {
    paginas,
    inmersivo: diseno === "inmersivo",
    faseDe: (id) => fases.get(id) ?? null,
    etiqueta,
  };

  // Al cambiar de paso: un ligero «dolly» de cámara y un parpadeo de opacidad en
  // las capas 2D. Sin filter: blur, que obliga a repintar capas enteras en cada fotograma.
  const pasoPrevio = useRef(paso);
  useEffect(() => {
    if (pasoPrevio.current === paso) return undefined;
    pasoPrevio.current = paso;
    if (reducido) return undefined;
    const parpadeo = [{ opacity: 1 }, { opacity: 0.55, offset: 0.4 }, { opacity: 1 }];
    const animaciones = [
      fantasmasRef.current?.animate(parpadeo, { duration: 420, easing: "ease-in-out" }),
      focoRef.current?.animate(parpadeo, { duration: 420, easing: "ease-in-out" }),
      camaraRef.current?.animate([{ scale: 1 }, { scale: 0.97, offset: 0.45 }, { scale: 1 }], {
        duration: 650,
        easing: "cubic-bezier(0.65, 0, 0.2, 1)",
      }),
    ];
    return () => animaciones.forEach((animacion) => animacion?.cancel());
  }, [paso, reducido]);

  // HUD: construyendo › calculando › esperando › sincronizado
  let estado = { clase: "listo", texto: "Sincronizado" };
  if (construyendo) estado = { clase: "obra", texto: `Construyendo ${construyendo.nombre}…` };
  else if (calculando) estado = { clase: "calculo", texto: "Calculando…" };
  else if (!tipo) estado = { clase: "espera", texto: "Esperando selección" };
  const obrando = Boolean(construyendo) || faseMaqueta === "construyendo" || faseDiseno === "construyendo";

  const resumen = resumir({ demo, tipo, paginas, diseno, funciones, plan, catalogo });
  const planesConNombre = planes.map((item) => ({
    ...item,
    plan: item.clave === plan?.id ? plan : { nombre: catalogo?.planes?.find((p) => p.id === item.clave)?.nombre ?? NOMBRES_PLAN[item.clave] },
  }));

  return (
    <div
      ref={raiz}
      className={`${s.escena} ${className}`}
      role="img"
      aria-label={resumen}
      data-paso={paso}
      data-tipo={tipo ?? "vacio"}
      data-demo={demo ? "" : undefined}
      data-urgente={urgente ? "" : undefined}
      data-pausa={visible ? undefined : ""}
    >
      <div className={s.interior} aria-hidden="true">
        <div className={s.fantasmas} ref={fantasmasRef}>
          {fantasmas.map((item) => (
            <span key={item.clave} className={`fantasma ${s.fantasma}`} data-fase={item.fase}>
              {item.clave}
            </span>
          ))}
        </div>
        <div className={s.foco} ref={focoRef} />
        {fases.has("urgente") && <Estelas fase={fases.get("urgente")} />}
        <div className={s.suelo} />

        <div className={s.camara} ref={camaraRef}>
          <div className={s.plano}>
            <div className={s.inclinacion}>
              <div className={s.modelo}>
                <Hojas hojas={hojas} resto={hojasExtra - hojasVisibles} />
                {fases.has("segundoIdioma") && <Gemela fase={fases.get("segundoIdioma")} etiqueta={etiqueta("segundoIdioma")} />}

                <div className={s.derrame} />
                <div className={s.sombra} />
                <Mantenimiento planes={planesConNombre} etiqueta={etiqueta} />

                <div className={s.ventana} data-diseno={diseno} data-obrando={obrando ? "" : undefined}>
                  <div className={s.trasera} />
                  <div className={s.cuerpo}>
                    <div className={s.barra}>
                      <span className={s.puntos} />
                      <span className={s.url}>
                        {obrando ? <span className="spinner" /> : <span className={s.candado} />}
                        <span className={s.urlTexto}>{URLS[tipo ?? "vacio"]}</span>
                      </span>
                      <span className={s.barraAcciones} />
                    </div>
                  </div>
                  <div className={s.pagina}>
                    {maquetas.map((item) => (
                      <Maqueta
                        key={item.clave}
                        clase={s.maqueta}
                        tipo={item.clave}
                        fase={item.fase}
                        obra={item.fase === "saliendo" ? "listo" : faseObra(item.fase, faseDiseno)}
                        diseno={diseno}
                        texto={estadoTexto(fases.get("redaccion"))}
                        cms={fases.get("cms")}
                        ctx={ctx}
                      />
                    ))}
                  </div>
                  {etiquetaVentana && <span className={s.anclaVentana}>{etiquetaVentana}</span>}
                </div>

                <ModulosFlotantes tipo={tipo} fases={fases} etiqueta={etiqueta} />
              </div>
            </div>
          </div>
        </div>

        <div className={s.hud}>
          <span className={s.hudVivo}>
            <span className="punto-vivo" />
            <span className={s.hudVivoTexto}>{demo ? "Demo en vivo" : "Vista previa en vivo"}</span>
          </span>
          <span className={s.hudEstado} data-estado={estado.clase}>
            {(estado.clase === "obra" || estado.clase === "calculo") && <span className="spinner" />}
            {estado.clase === "listo" && (
              <svg className={s.hudCheck} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6.4l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span key={estado.texto} className={s.hudTexto}>
              {estado.texto}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
