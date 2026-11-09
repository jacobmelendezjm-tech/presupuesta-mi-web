const { TARIFAS, MONEDA, PAGINAS_MAX } = require("./tarifas");
const { validarSolicitud } = require("./validacion");
const { calcularPresupuesto } = require("./calculo");
const { PLANES_MANTENIMIENTO } = require("./mantenimiento");
const { LIMITES } = require("./propuesta");

// Catálogo de la calculadora por pasos. Landing, corporativa, páginas, formulario
// e idioma salen de TARIFAS; EL RESTO DE PRECIOS SON PROVISIONALES y se cambian aquí.
// POST /api/presupuesto y sus tarifas obligatorias no dependen de este archivo.
const TIPOS = Object.freeze([
  { id: "landing", nombre: "Landing Page", descripcion: "Una página orientada a un único objetivo.", precio: TARIFAS.landing },
  { id: "corporativa", nombre: "Web Corporativa", descripcion: "Varias secciones para presentar tu empresa.", precio: TARIFAS.corporativa },
  { id: "ecommerce", nombre: "E-commerce", descripcion: "Tienda online con catálogo y compra.", precio: 1800 },
  { id: "saas", nombre: "Aplicación Web / SaaS", descripcion: "Producto digital con lógica a medida.", precio: 3500 },
]);

const OPCIONES = Object.freeze([
  { id: "plantilla", grupo: "diseno", nombre: "Plantilla adaptada", descripcion: "Una base probada, ajustada a tu marca.", precio: 150 },
  { id: "uiCustom", grupo: "diseno", nombre: "UI Custom", descripcion: "Diseño de interfaz hecho a medida.", precio: 600 },
  { id: "inmersivo", grupo: "diseno", nombre: "Sistema de Diseño 3D / Inmersivo", descripcion: "Experiencia visual con elementos 3D.", precio: 1400 },
  { id: "redaccion", grupo: "contenido", nombre: "Redacción de contenidos", descripcion: "Textos profesionales para cada sección.", precio: 250 },
  { id: "formulario", grupo: "funcion", nombre: "Formulario de contacto", descripcion: "Tus clientes te escriben desde la web.", precio: TARIFAS.formulario },
  { id: "cms", grupo: "funcion", nombre: "CMS gestor de contenidos", descripcion: "Edita los contenidos sin depender de nadie.", precio: 350 },
  { id: "segundoIdioma", grupo: "funcion", nombre: "Multidioma", descripcion: "Toda la web en un segundo idioma.", precio: TARIFAS.segundoIdioma },
  { id: "crmPagos", grupo: "funcion", nombre: "Integración CRM / Pagos", descripcion: "Conexión con tu CRM o pasarela de pago.", precio: 500 },
  { id: "seo", grupo: "funcion", nombre: "SEO avanzado", descripcion: "Estructura y metadatos para posicionar mejor.", precio: 280 },
  { id: "autenticacion", grupo: "funcion", nombre: "Autenticación de usuarios", descripcion: "Registro, acceso y áreas privadas.", precio: 420 },
  { id: "urgente", grupo: "plazo", nombre: "Despliegue urgente", descripcion: "Prioridad en la planificación del proyecto.", precio: 400 },
  { id: "soporte", grupo: "plazo", nombre: "Soporte prioritario", descripcion: "Atención preferente tras la entrega.", precio: 49, periodo: "mes" },
]);

const buscarTipo = (id) => TIPOS.find((t) => t.id === id);
const buscarOpcion = (id) => OPCIONES.find((o) => o.id === id);
const esTexto = (v) => typeof v === "string" && v.trim() !== "";
const esObjeto = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const errores = (campos, detalles) => ({ valido: false, campos: [...new Set(campos)], detalles });

function catalogoPublico() {
  return { moneda: MONEDA, paginasMax: PAGINAS_MAX, tipos: TIPOS, opciones: OPCIONES, planes: PLANES_MANTENIMIENTO };
}

/** Valida la selección. Solo se aceptan identificadores: nunca precios del cliente. */
function validarEstimacion(cuerpo) {
  if (!esObjeto(cuerpo)) return errores([], ["El cuerpo de la petición debe ser un objeto JSON."]);

  const campos = [];
  const detalles = [];
  const tipo = buscarTipo(cuerpo.tipo);
  if (!tipo) {
    campos.push("tipo");
    detalles.push("Elige un tipo de proyecto válido.");
  }

  const ids = cuerpo.opciones ?? [];
  if (!Array.isArray(ids)) {
    campos.push("opciones");
    detalles.push("Las opciones deben enviarse como una lista.");
  } else {
    ids.forEach((id) => {
      if (!buscarOpcion(id)) {
        campos.push("opciones");
        detalles.push(`La opción ${JSON.stringify(id)} no existe en el catálogo.`);
      }
    });
    if (new Set(ids).size !== ids.length) {
      campos.push("opciones");
      detalles.push("Hay opciones repetidas.");
    }
    if (ids.filter((id) => buscarOpcion(id)?.grupo === "diseno").length > 1) {
      campos.push("opciones");
      detalles.push("Elige un único enfoque de diseño.");
    }
  }

  const plan = cuerpo.plan == null ? null : PLANES_MANTENIMIENTO.find((p) => p.id === cuerpo.plan);
  if (plan === undefined) {
    campos.push("plan");
    detalles.push("El plan de mantenimiento no existe.");
  }

  if (campos.length > 0) return errores(campos, detalles);

  // Landing y corporativa reutilizan el contrato y el cálculo de POST /api/presupuesto.
  let solicitud = null;
  if (tipo.id === "landing" || tipo.id === "corporativa") {
    const contrato = validarSolicitud({
      tipo: tipo.id,
      paginas: cuerpo.paginas ?? 1,
      formulario: ids.includes("formulario"),
      segundoIdioma: ids.includes("segundoIdioma"),
    });
    if (!contrato.valido) return errores(contrato.campos, contrato.detalles);
    solicitud = contrato.datos;
  }

  return { valido: true, datos: { tipo, opciones: OPCIONES.filter((o) => ids.includes(o.id)), plan, solicitud } };
}

/** Valida también el nombre del cliente, necesario para emitir el PDF. */
function validarSolicitudPdf(cuerpo) {
  const resultado = validarEstimacion(cuerpo);
  if (!resultado.valido) return resultado;
  if (!esTexto(cuerpo.cliente)) return errores(["cliente"], ["Indica el nombre del cliente o empresa."]);
  if (cuerpo.cliente.trim().length > LIMITES.cliente) {
    return errores(["cliente"], [`El nombre no puede superar los ${LIMITES.cliente} caracteres.`]);
  }
  return { valido: true, datos: { ...resultado.datos, cliente: cuerpo.cliente.trim() } };
}

/** Calcula con datos ya validados. Lo mensual va aparte y nunca suma al total. */
function calcularEstimacion({ tipo, opciones, plan, solicitud }) {
  const lineas = [];
  const linea = (id, nombre, descripcion, importe, extra = {}) =>
    lineas.push({ id, nombre, descripcion, justificacion: null, cantidad: 1, unidad: null, precioUnitario: importe, importe, ...extra });

  const desglose = solicitud ? calcularPresupuesto(solicitud) : null;
  linea(tipo.id, tipo.nombre, tipo.descripcion, desglose ? desglose.base : tipo.precio);

  if (desglose?.paginasAdicionales > 0) {
    linea("paginaAdicional", "Páginas adicionales", "Cada página adicional a la primera.", desglose.paginasAdicionales, {
      cantidad: solicitud.paginas - 1,
      unidad: "página",
      precioUnitario: TARIFAS.paginaAdicional,
    });
  }

  opciones.filter((o) => !o.periodo).forEach((o) => linea(o.id, o.nombre, o.descripcion, o.precio));

  const mensual = opciones.filter((o) => o.periodo === "mes").map((o) => ({ id: o.id, nombre: o.nombre, importe: o.precio }));
  if (plan) mensual.push({ id: plan.id, nombre: `Mantenimiento ${plan.nombre}`, importe: plan.precioMensual });

  return {
    lineas,
    mensual,
    total: lineas.reduce((suma, l) => suma + l.importe, 0),
    totalMensual: mensual.reduce((suma, l) => suma + l.importe, 0),
    moneda: MONEDA,
  };
}

/** Convierte la estimación en el documento que recibe generarPdf(). */
function construirDocumentoEstimacion(datos, ahora = new Date()) {
  const calculo = calcularEstimacion(datos);
  const paginas = datos.solicitud ? `, ${datos.solicitud.paginas} ${datos.solicitud.paginas === 1 ? "página" : "páginas"}` : "";
  return {
    cliente: datos.cliente,
    fecha: new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(ahora),
    resumen: `Estimación para un proyecto de tipo ${datos.tipo.nombre}${paginas}, con ${calculo.lineas.length} conceptos seleccionados en la calculadora.`,
    lineas: calculo.lineas,
    total: calculo.total,
    moneda: calculo.moneda,
    dudas: [
      ...calculo.mensual.map((m) => `${m.nombre}: ${m.importe} €/mes. Servicio mensual, no incluido en el total.`),
      "Importe orientativo: se confirmará al definir el alcance definitivo del proyecto.",
    ],
    pendientes: [],
  };
}

module.exports = { catalogoPublico, validarEstimacion, validarSolicitudPdf, calcularEstimacion, construirDocumentoEstimacion };
