import m from "./Maquetas.module.css";
import { Bloque, Icono, Pieza, T } from "./piezas.jsx";

// Contenido de la página según el tipo de proyecto. Cada hijo directo es un
// bloque (hoja 3D) con su índice de entrada (i) y su profundidad (z).
// `ctx` trae la fase de cada opción (faseDe) y las etiquetas de precio.

const ENLACES_CORPORATIVA = ["Inicio", "Servicios", "Nosotros", "Proyectos", "Blog", "Contacto"];

const VENTAJAS = [
  { titulo: "Rápida", texto: "Carga en menos de un segundo." },
  { titulo: "Clara", texto: "Un objetivo por pantalla." },
  { titulo: "Segura", texto: "HTTPS y copias diarias." },
];

const SERVICIOS = [
  { titulo: "Consultoría", texto: "Analizamos tu negocio." },
  { titulo: "Diseño", texto: "Marca e interfaz a medida." },
  { titulo: "Desarrollo", texto: "Webs rápidas y accesibles." },
];

const PRODUCTOS = [
  { nombre: "Zapatilla Aire", precio: "89 €" },
  { nombre: "Mochila Urbana", precio: "54 €" },
  { nombre: "Gorra Clásica", precio: "19 €" },
  { nombre: "Sudadera Pro", precio: "62 €" },
];

const ALTURAS_GRAFICA = [38, 52, 44, 66, 58, 74, 63, 86, 78];

/** Está y no se está yendo */
const activa = (fase) => fase != null && fase !== "saliendo";

function Navegacion({ ctx, marca, enlaces, boton }) {
  const idioma = ctx.faseDe("segundoIdioma");
  const usuario = ctx.faseDe("autenticacion");
  return (
    <Bloque i={0} z={1} className={`${m.sup} ${m.nav}`}>
      <T className={m.logo}>{marca}</T>
      <span className={m.enlaces}>
        {enlaces.map((enlace) => (
          <T key={enlace} className={m.enlace}>
            {enlace}
          </T>
        ))}
      </span>
      {idioma && (
        <Pieza fase={idioma} className={m.idioma}>
          <b>ES</b> · EN
        </Pieza>
      )}
      {usuario && <Pieza fase={usuario} className={m.avatarNav} />}
      <span className={`${m.btn} ${m.btnNav}`}>
        <T>{boton}</T>
      </span>
    </Bloque>
  );
}

/** Formulario de contacto dentro de la página (landing y corporativa) */
function Contacto({ ctx, i, className }) {
  const fase = ctx.faseDe("formulario");
  if (!fase) return null;
  return (
    <Bloque i={i} z={2.2} fase={fase} className={`${m.sup} ${m.contacto} ${className}`} etiqueta={ctx.etiqueta("formulario", true)}>
      <span className={m.contactoCabeza}>
        <T className={m.tituloMed}>Contacto</T>
        <span className={m.parrafo}>
          <T>Te respondemos en 24 h.</T>
        </span>
      </span>
      <span className={m.campos}>
        <span className={m.campo}>
          <T>Nombre</T>
        </span>
        <span className={m.campo}>
          <T>Correo</T>
        </span>
        <span className={`${m.campo} ${m.area}`}>
          <T>Cuéntanos tu idea…</T>
        </span>
      </span>
      <span className={`${m.btn} ${m.enviar}`}>
        <T>Enviar</T>
      </span>
    </Bloque>
  );
}

/** Objeto 3D del diseño inmersivo: un cubo de aristas verdes que gira */
function Cubo({ className }) {
  return (
    <div className={`${m.cuboPosicion} ${className}`}>
      <div className={m.cubo}>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function Vacia() {
  return (
    <>
      <Bloque i={0} z={0.6} className={`${m.alambre} ${m.vNav}`} />
      <Bloque i={1} z={0.9} className={`${m.alambre} ${m.vHero}`} />
      <Bloque i={2} z={1.3} className={`${m.alambre} ${m.vImagen}`} />
      <Bloque i={3} z={0.7} className={`${m.alambre} ${m.vTarjeta}`} />
      <Bloque i={4} z={0.7} className={`${m.alambre} ${m.vTarjeta}`} />
      <Bloque i={5} z={0.7} className={`${m.alambre} ${m.vTarjeta}`} />
      <div className={m.aviso}>
        <span className={m.avisoMas} />
        <span className={m.avisoTexto}>Elige un tipo de proyecto</span>
      </div>
    </>
  );
}

function Landing({ ctx }) {
  const formulario = activa(ctx.faseDe("formulario"));
  return (
    <>
      <Navegacion ctx={ctx} marca="Tu web" enlaces={["Ventajas", "Precios"]} boton="Empezar" />
      <Bloque i={1} z={1.3} className={`${m.sup} ${m.hero} ${m.heroLanding}`}>
        <span className={m.chip}>
          <T>Nuevo · 2026</T>
        </span>
        <span className={`${m.titular} ${m.editable}`}>
          <T className={m.linea}>Tu proyecto,</T>
          <T className={m.linea}>a otro nivel</T>
        </span>
        <span className={m.parrafo}>
          <T>Una web rápida y clara que convierte visitas en clientes.</T>
        </span>
        <span className={m.acciones}>
          <span className={m.btn}>
            <T>Empezar</T>
          </span>
          <span className={m.btnSecundario}>
            <T>Saber más</T>
          </span>
        </span>
      </Bloque>
      <Bloque i={2} z={2.5} className={`${m.img} ${m.imagenLanding}`} />
      {ctx.inmersivo && <Cubo className={m.cuboLanding} />}
      {VENTAJAS.map((ventaja, k) => (
        <Bloque key={ventaja.titulo} i={3 + k} z={1.6} className={`${m.sup} ${m.tarjeta}`}>
          <span className={m.icono} />
          <T className={m.tituloPeq}>{ventaja.titulo}</T>
          <T className={`${m.parrafo} ${m.linea1}`}>{ventaja.texto}</T>
        </Bloque>
      ))}
      <Bloque i={6} z={1} className={`${m.sup} ${m.banda}`} data-tapada={formulario ? "" : undefined}>
        <span className={`${m.tituloMed} ${m.editable}`}>
          <T>¿Hablamos de tu idea?</T>
        </span>
        <span className={m.btn}>
          <T>Empezar ahora</T>
        </span>
      </Bloque>
      <Contacto ctx={ctx} i={6} className={m.contactoLanding} />
    </>
  );
}

function Corporativa({ ctx }) {
  const enlaces = ENLACES_CORPORATIVA.slice(0, Math.min(Math.max(ctx.paginas, 1), 6));
  const formulario = activa(ctx.faseDe("formulario"));
  return (
    <>
      <Navegacion ctx={ctx} marca="Tu empresa" enlaces={enlaces} boton="Contactar" />
      <Bloque i={1} z={0.8} className={`${m.img} ${m.imagenCorporativa}`} />
      <Bloque i={2} z={2} className={`${m.sup} ${m.hero} ${m.heroCorporativa}`}>
        <span className={`${m.titular} ${m.titularMedio} ${m.editable}`}>
          <T className={m.linea}>Tu proyecto,</T>
          <T className={m.linea}>a otro nivel</T>
        </span>
        <span className={m.parrafo}>
          <T>Estrategia, diseño y tecnología para empresas que quieren crecer.</T>
        </span>
        <span className={m.btn}>
          <T>Ver servicios</T>
        </span>
      </Bloque>
      {ctx.inmersivo && <Cubo className={m.cuboCorporativa} />}
      {SERVICIOS.map((servicio, k) => (
        <Bloque key={servicio.titulo} i={3 + k} z={1.5} className={`${m.sup} ${m.tarjeta} ${m.servicio}`}>
          <span className={m.icono} />
          <T className={`${m.tituloPeq} ${m.editable}`}>{servicio.titulo}</T>
          <T className={`${m.parrafo} ${m.linea1}`}>{servicio.texto}</T>
        </Bloque>
      ))}
      <Bloque i={6} z={1.1} className={`${m.sup} ${m.equipo}`}>
        <T className={m.tituloPeq}>Nuestro equipo</T>
        <span className={m.avatares}>
          <i />
          <i />
          <i />
          <i />
        </span>
      </Bloque>
      <Bloque i={7} z={1.2} className={`${m.sup} ${m.mapa}`} data-tapada={formulario ? "" : undefined}>
        <span className={m.pin} />
        <T className={m.tituloPeq}>Visítanos</T>
      </Bloque>
      <Contacto ctx={ctx} i={7} className={m.contactoCorporativa} />
      <Bloque i={8} z={0.6} className={`${m.sup} ${m.pie}`}>
        <span className={m.logoMarca} />
        <T>© 2026 Tu empresa</T>
        <span className={m.pieEnlaces}>
          <T>Aviso legal</T>
          <T>Privacidad</T>
        </span>
      </Bloque>
    </>
  );
}

function Ecommerce({ ctx }) {
  const idioma = ctx.faseDe("segundoIdioma");
  const usuario = ctx.faseDe("autenticacion");
  return (
    <>
      <Bloque i={0} z={1} className={`${m.sup} ${m.nav} ${m.navTienda}`}>
        <T className={m.logo}>Tu tienda</T>
        <span className={m.buscador}>
          <Icono nombre="lupa" />
          <T>Buscar productos</T>
        </span>
        {idioma && (
          <Pieza fase={idioma} className={m.idioma}>
            <b>ES</b> · EN
          </Pieza>
        )}
        {usuario && <Pieza fase={usuario} className={m.avatarNav} />}
        <span className={m.carritoIcono}>
          <Icono nombre="carrito" />
          <b className={m.insignia}>3</b>
        </span>
      </Bloque>
      <Bloque i={1} z={1.4} className={`${m.sup} ${m.hero} ${m.oferta}`}>
        <span className={m.ofertaTexto}>
          <span className={m.chip}>
            <T>Rebajas</T>
          </span>
          <span className={`${m.titular} ${m.titularMedio} ${m.editable}`}>
            <T>−20 % en toda la tienda</T>
          </span>
        </span>
        <span className={m.btn}>
          <T>Comprar</T>
        </span>
      </Bloque>
      {ctx.inmersivo && <Cubo className={m.cuboTienda} />}
      {PRODUCTOS.map((producto, k) => (
        <Bloque key={producto.nombre} i={2 + k} z={1.7} className={`${m.sup} ${m.producto}`}>
          <span className={`${m.img} ${m.productoImagen}`} />
          <T className={m.tituloPeq}>{producto.nombre}</T>
          <span className={m.productoPie}>
            <b className={m.productoPrecio}>{producto.precio}</b>
            <span className={m.mas} />
          </span>
        </Bloque>
      ))}
      <Bloque i={6} z={0.7} className={`${m.sup} ${m.categorias}`}>
        <T>Novedades</T>
        <T>Hombre</T>
        <T>Mujer</T>
        <T>Accesorios</T>
      </Bloque>
      <Bloque i={7} z={4.2} className={`${m.sup} ${m.carrito}`}>
        <span className={m.carritoCabeza}>
          <T className={m.tituloPeq}>Carrito</T>
          <b className={m.insignia}>3</b>
        </span>
        <span className={m.linea2}>
          <i className={m.miniatura} />
          <T>Zapatilla Aire</T>
          <b>89 €</b>
        </span>
        <span className={m.linea2}>
          <i className={m.miniatura} />
          <T>Gorra Clásica</T>
          <b>19 €</b>
        </span>
        <span className={m.carritoTotal}>
          <T>Total</T>
          <b>108 €</b>
        </span>
        <span className={`${m.btn} ${m.btnAncho}`}>
          <T>Pagar</T>
        </span>
      </Bloque>
    </>
  );
}

function Saas({ ctx }) {
  const idioma = ctx.faseDe("segundoIdioma");
  const usuario = ctx.faseDe("autenticacion");
  return (
    <>
      <Bloque i={0} z={0.8} className={`${m.sup} ${m.lateral}`}>
        <span className={m.logoMarca} />
        <i className={m.lateralActivo} />
        <i />
        <i />
        <i />
        <i />
      </Bloque>
      <Bloque i={1} z={1} className={`${m.sup} ${m.superior}`}>
        <T className={`${m.tituloPeq} ${m.editable}`}>Panel</T>
        <span className={m.buscador}>
          <Icono nombre="lupa" />
          <T>Buscar…</T>
        </span>
        {idioma && (
          <Pieza fase={idioma} className={m.idioma}>
            <b>ES</b> · EN
          </Pieza>
        )}
        <span className={m.avatarNav} data-sesion={activa(usuario) ? "" : undefined} />
      </Bloque>
      {[
        ["Usuarios", "12.480", "+8 %"],
        ["Activos", "98,2 %", "+1 %"],
        ["Ingresos", "3.210 €", "+12 %"],
      ].map(([etiqueta, valor, delta], k) => (
        <Bloque key={etiqueta} i={2 + k} z={1.8} className={`${m.sup} ${m.kpi}`}>
          <T>{etiqueta}</T>
          <b className={m.kpiValor}>{valor}</b>
          <span className={m.kpiDelta}>{delta}</span>
        </Bloque>
      ))}
      <Bloque i={5} z={1.3} className={`${m.sup} ${m.grafica}`}>
        <T className={`${m.tituloPeq} ${m.editable}`}>Actividad semanal</T>
        <span className={m.barras}>
          {ALTURAS_GRAFICA.map((altura, k) => (
            <i key={k} style={{ "--h": altura / 100, "--k": k }} />
          ))}
        </span>
      </Bloque>
      <Bloque i={6} z={2.1} className={`${m.sup} ${m.donut}`}>
        <span className={m.donutAnillo} />
        <T>Planes</T>
      </Bloque>
      {ctx.inmersivo && <Cubo className={m.cuboSaas} />}
      <Bloque i={7} z={1.1} className={`${m.sup} ${m.tabla}`}>
        <T className={m.tituloPeq}>Últimos clientes</T>
        <i className={m.fila} />
        <i className={m.fila} />
        <i className={m.fila} />
      </Bloque>
    </>
  );
}

const CONTENIDO = { vacio: Vacia, landing: Landing, corporativa: Corporativa, ecommerce: Ecommerce, saas: Saas };

export const URLS = {
  vacio: "tuweb.es",
  landing: "tuweb.es",
  corporativa: "tuempresa.es/servicios",
  ecommerce: "tutienda.es/catalogo",
  saas: "app.tuproducto.io/panel",
};

/** Una maqueta completa (la del tipo actual o la anterior mientras sale). */
export function Maqueta({ tipo, fase, obra, diseno, texto, cms, ctx, clase }) {
  const Contenido = CONTENIDO[tipo] ?? Vacia;
  return (
    <div
      className={`${clase} ${m.maqueta} ${m[tipo] ?? ""}`}
      data-fase={fase}
      data-obra={obra}
      data-entrada={fase === "construyendo" ? "" : undefined}
      data-diseno={tipo === "vacio" ? "ninguno" : diseno}
      data-texto={texto}
      data-cms={cms}
    >
      <Contenido ctx={ctx} />
    </div>
  );
}
