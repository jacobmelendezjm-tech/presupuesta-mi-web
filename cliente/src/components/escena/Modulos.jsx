import md from "./Modulos.module.css";
import { Flotante, HERRAMIENTAS_CMS, Icono, icono } from "./piezas.jsx";

// Lo que rodea a la ventana: módulos flotantes (uno por opción), hojas apiladas
// por páginas, la gemela «EN», el anillo de mantenimiento y las estelas de «urgente».

export const NOMBRES_HOJA = ["Servicios", "Nosotros", "Proyectos", "Blog", "Equipo", "Precios", "Contacto"];
export const HOJAS_VISIBLES = 7;

/** Módulos flotantes según las opciones marcadas. `fases` = Map(id → fase). */
export function ModulosFlotantes({ tipo, fases, etiqueta }) {
  const fase = (id) => fases.get(id);
  const formularioFlotante = tipo === "ecommerce" || tipo === "saas";

  return (
    <>
      {fase("cms") && (
        <Flotante fase={fase("cms")} className={md.cms} tarjeta={`${md.tarjeta} ${md.barraCms}`} etiqueta={etiqueta("cms")}>
          <span className={md.herramientas} style={HERRAMIENTAS_CMS} />
          <span className={md.estadoCms}>Borrador guardado</span>
          <span className={md.botonPeq}>Editar</span>
        </Flotante>
      )}

      {fase("urgente") && (
        <Flotante fase={fase("urgente")} className={md.urgente} tarjeta={md.insignia} etiqueta={etiqueta("urgente")}>
          <Icono nombre="rayo" />
          Entrega prioritaria
        </Flotante>
      )}

      {fase("seo") && (
        <Flotante
          fase={fase("seo")}
          className={md.serp}
          tarjeta={md.tarjeta}
          etiqueta={etiqueta("seo")}
          extra={
            <span className={md.anilloSeo} data-valor="98">
              SEO
            </span>
          }
        >
          <span className={md.buscadorSerp} style={icono("lupa")}>
            tu negocio cerca de ti
          </span>
          <span className={md.serpUrl}>tuweb.es › servicios</span>
          <span className={md.serpTitulo}>Tu web · Servicios a medida</span>
          <span className={md.serpLineas} />
        </Flotante>
      )}

      {fase("crmPagos") && (
        <Flotante
          fase={fase("crmPagos")}
          className={md.pago}
          tarjeta={`${md.tarjeta} ${md.tarjetaPago}`}
          etiqueta={etiqueta("crmPagos")}
          extra={
            <>
              <span className={md.conector}>
                <i />
              </span>
              <span className={md.crm}>CRM</span>
            </>
          }
        >
          <span className={md.pagoCabeza} />
          <span className={md.numero}>•••• 4242</span>
          <span className={md.boton}>Pagar</span>
        </Flotante>
      )}

      {fase("autenticacion") && (
        <Flotante fase={fase("autenticacion")} className={md.login} tarjeta={md.tarjeta} etiqueta={etiqueta("autenticacion")}>
          <span className={md.loginAvatar} style={icono("usuario")} />
          <span className={md.titulo}>Accede a tu cuenta</span>
          <span className={md.campo}>tu@correo.es</span>
          <span className={md.campo}>••••••••</span>
          <span className={md.boton}>Entrar</span>
        </Flotante>
      )}

      {formularioFlotante && fase("formulario") && (
        <Flotante fase={fase("formulario")} className={md.formulario} tarjeta={md.tarjeta} etiqueta={etiqueta("formulario")}>
          <span className={md.titulo}>Contacto</span>
          <span className={md.campo}>Nombre</span>
          <span className={md.campo}>Correo</span>
          <span className={`${md.campo} ${md.area}`}>Mensaje…</span>
          <span className={md.boton}>Enviar</span>
        </Flotante>
      )}

      {fase("soporte") && (
        <Flotante
          fase={fase("soporte")}
          className={md.chat}
          tarjeta={`${md.tarjeta} ${md.burbuja}`}
          etiqueta={etiqueta("soporte")}
          extra={
            <span className={md.lanzador} style={icono("chat")} />
          }
        >
          <span className={md.chatAvatar} />
          <span className={md.chatTexto}>
            <b>Soporte</b>
            ¿En qué te ayudo?
          </span>
        </Flotante>
      )}
    </>
  );
}

/** Una hoja por página adicional, apiladas detrás de la ventana (máx. 7 + chapa «+N»). */
export function Hojas({ hojas, resto }) {
  return (
    <div className={md.hojas}>
      {hojas.map(({ clave, fase }) => {
        const k = Number(clave.slice(1));
        return <div key={clave} className={md.hoja} data-fase={fase} data-nombre={NOMBRES_HOJA[k - 1]} style={{ "--k": k }} />;
      })}
      {resto > 0 && (
        <span className={md.chapa} style={{ "--k": HOJAS_VISIBLES }}>
          +{resto}
        </span>
      )}
    </div>
  );
}

/** Hoja gemela en inglés, detrás y desplazada a la derecha (opción Multidioma). */
export function Gemela({ fase, etiqueta }) {
  return (
    <div className={md.gemela} data-fase={fase}>
      <span className={md.gemelaChip}>EN</span>
      {etiqueta}
    </div>
  );
}

const PUNTOS_PLAN = { basico: 1, profesional: 2, premium: 3 };

/** Anillo de protección que orbita la base: 1, 2 o 3 puntos de luz según el plan. */
export function Mantenimiento({ planes, etiqueta }) {
  return planes.map(({ clave, fase, plan }) => {
    const puntos = PUNTOS_PLAN[clave] ?? 1;
    return (
      <div key={clave} className={md.mantenimiento} data-fase={fase}>
        {/* Los puntos de luz son un ::after del anillo que gira (data-puntos = 1, 2 o 3) */}
        <div className={md.anillo} data-puntos={puntos} />
        <div className={md.escudo} style={icono("escudo")}>
          Plan <b>{plan?.nombre ?? clave}</b>
          {etiqueta(clave, false, fase)}
        </div>
      </div>
    );
  });
}

/** Estelas de velocidad detrás de la maqueta (Despliegue urgente). Capa 2D. */
export function Estelas({ fase }) {
  return (
    <div className={md.estelas} data-fase={fase}>
      <i />
      <i />
    </div>
  );
}
