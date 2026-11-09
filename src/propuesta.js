const { MONEDA, PAGINAS_MAX } = require("./tarifas");
const { CATALOGO, IDS_TIPO, buscarServicio } = require("./catalogo");
const { validarSolicitud } = require("./validacion");
const { calcularPresupuesto } = require("./calculo");
const { ErrorIA } = require("./openai");

const LIMITES = Object.freeze({
  cliente: 120,
  descripcion: 2000,
  resumen: 1500,
  justificacion: 500,
  aclaracion: 500,
  aclaraciones: 30,
});

const CANTIDAD_MAX = PAGINAS_MAX - 1; // la primera página va incluida en el tipo de web

const esObjeto = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const esTexto = (v) => typeof v === "string" && v.trim() !== "";

function respuestaErrores(campos, detalles) {
  return { valido: false, campos, detalles };
}

function comprobarCliente(cuerpo, campos, detalles) {
  if (!esTexto(cuerpo.cliente)) {
    campos.push("cliente");
    detalles.push("Indica el nombre del cliente o empresa.");
  } else if (cuerpo.cliente.trim().length > LIMITES.cliente) {
    campos.push("cliente");
    detalles.push(`El nombre no puede superar los ${LIMITES.cliente} caracteres.`);
  }
}

/** Valida el formulario inicial antes de gastar una llamada a OpenAI. */
function validarDescripcion(cuerpo) {
  if (!esObjeto(cuerpo)) return respuestaErrores([], ["El cuerpo de la petición debe ser un objeto JSON."]);

  const campos = [];
  const detalles = [];
  comprobarCliente(cuerpo, campos, detalles);

  if (!esTexto(cuerpo.descripcion)) {
    campos.push("descripcion");
    detalles.push("Explica qué necesitas: la descripción no puede estar vacía.");
  } else if (cuerpo.descripcion.trim().length > LIMITES.descripcion) {
    campos.push("descripcion");
    detalles.push(`La descripción no puede superar los ${LIMITES.descripcion} caracteres.`);
  }

  if (campos.length > 0) return respuestaErrores(campos, detalles);
  return {
    valido: true,
    datos: { cliente: cuerpo.cliente.trim(), descripcion: cuerpo.descripcion.trim() },
  };
}

// Red de seguridad: aunque las instrucciones lo prohíben, un importe o un plazo
// inventado por el modelo nunca debe llegar al cliente.
const PATRON_COMPROMISO = new RegExp(
  [
    "\\d[\\d.,]*\\s*(€|euros?\\b|eur\\b)",
    "(€|eur\\b)\\s*\\d",
    "\\b(en|plazo de|antes de|menos de)\\s+(\\d+|un[ao]?|dos|tres|cuatro|cinco)\\s+(d[ií]as?|semanas?|mes(es)?|horas?)\\b",
    "\\b(entregar[eé]mos|entregamos|garantizamos|nos comprometemos)\\b",
  ].join("|"),
  "i"
);

function quitarCompromisos(texto) {
  return (texto.match(/[^.!?]+[.!?]*/g) ?? [])
    .filter((frase) => !PATRON_COMPROMISO.test(frase))
    .join("")
    .trim();
}

const textoSeguro = (valor, limite) =>
  typeof valor === "string" ? quitarCompromisos(valor.trim()).slice(0, limite) : "";

/**
 * Convierte la respuesta del modelo en una propuesta de confianza:
 * solo servicios del catálogo, sin repetidos, con un único tipo de web y
 * con cantidades coherentes. Lo que no encaja pasa a pendiente de valorar.
 */
function normalizarPropuesta(ia) {
  if (!esObjeto(ia) || !esTexto(ia.resumen) || !Array.isArray(ia.servicios)) {
    throw new ErrorIA("El asistente ha devuelto una respuesta con un formato inesperado.");
  }

  const dudas = (Array.isArray(ia.dudas) ? ia.dudas : [])
    .map((d) => textoSeguro(d, LIMITES.aclaracion))
    .filter(Boolean);

  const pendientes = (Array.isArray(ia.fueraDeCatalogo) ? ia.fueraDeCatalogo : [])
    .filter((p) => esObjeto(p) && esTexto(p.necesidad))
    .map((p) => {
      const necesidad = textoSeguro(p.necesidad, 200);
      const motivo = textoSeguro(p.motivo, 280);
      return necesidad && motivo ? `${necesidad}: ${motivo}` : necesidad;
    })
    .filter(Boolean);

  const vistos = new Set();
  const elegidos = [];

  for (const propuesto of ia.servicios) {
    const id = esObjeto(propuesto) ? propuesto.id : undefined;
    const servicio = typeof id === "string" ? buscarServicio(id) : undefined;

    if (!servicio) {
      if (esTexto(id)) pendientes.push(`${id.slice(0, 80)}: no figura en el catálogo, pendiente de valorar.`);
      continue;
    }
    if (vistos.has(id)) continue;

    if (servicio.grupo === "tipo" && elegidos.some((e) => e.grupo === "tipo")) {
      dudas.push("Confirma qué tipo de web prefieres: landing o web corporativa.");
      continue;
    }
    vistos.add(id);

    let cantidad = null;
    if (servicio.grupo === "unidad") {
      const valida =
        Number.isInteger(propuesto.cantidad) && propuesto.cantidad >= 1 && propuesto.cantidad <= CANTIDAD_MAX;
      cantidad = valida ? propuesto.cantidad : null;
    }

    elegidos.push({
      ...servicio,
      justificacion: textoSeguro(propuesto.justificacion, LIMITES.justificacion) || servicio.descripcion,
      cantidad,
    });
  }

  const resumen = textoSeguro(ia.resumen, LIMITES.resumen);
  if (!resumen) throw new ErrorIA("El asistente ha devuelto una respuesta con un formato inesperado.");

  return {
    resumen,
    servicios: elegidos.map(({ precio, ...resto }) => resto), // los precios los da el servidor al calcular
    dudas: [...new Set(dudas)],
    pendientes,
  };
}

function comprobarListaTextos(valor, campo, etiqueta, campos, detalles) {
  if (valor === undefined) return [];
  if (
    !Array.isArray(valor) ||
    valor.length > LIMITES.aclaraciones ||
    valor.some((t) => typeof t !== "string" || t.length > LIMITES.aclaracion)
  ) {
    campos.push(campo);
    detalles.push(
      `"${etiqueta}" admite hasta ${LIMITES.aclaraciones} líneas de ${LIMITES.aclaracion} caracteres como máximo.`
    );
    return [];
  }
  return valor.map((t) => t.trim()).filter(Boolean);
}

/** Valida la selección final del usuario. Cualquier precio que venga en el cuerpo se ignora. */
function validarSeleccion(cuerpo) {
  if (!esObjeto(cuerpo)) return respuestaErrores([], ["El cuerpo de la petición debe ser un objeto JSON."]);

  const campos = [];
  const detalles = [];
  comprobarCliente(cuerpo, campos, detalles);

  if (!esTexto(cuerpo.resumen)) {
    campos.push("resumen");
    detalles.push("El resumen del proyecto no puede estar vacío.");
  } else if (cuerpo.resumen.trim().length > LIMITES.resumen) {
    campos.push("resumen");
    detalles.push(`El resumen no puede superar los ${LIMITES.resumen} caracteres.`);
  }

  const dudas = comprobarListaTextos(cuerpo.dudas, "dudas", "Dudas", campos, detalles);
  const pendientes = comprobarListaTextos(cuerpo.pendientes, "pendientes", "Pendientes", campos, detalles);

  if (!Array.isArray(cuerpo.servicios)) {
    campos.push("servicios");
    detalles.push("Selecciona los servicios del presupuesto.");
    return respuestaErrores(campos, detalles);
  }

  const seleccion = new Map();
  for (const linea of cuerpo.servicios) {
    const servicio = esObjeto(linea) && typeof linea.id === "string" ? buscarServicio(linea.id) : undefined;
    if (!servicio) {
      campos.push("servicios");
      detalles.push(`El servicio ${JSON.stringify(linea?.id ?? null)} no existe en el catálogo.`);
    } else if (seleccion.has(linea.id)) {
      campos.push("servicios");
      detalles.push(`El servicio "${servicio.nombre}" está repetido.`);
    } else {
      seleccion.set(linea.id, linea);
    }
  }

  const tipos = IDS_TIPO.filter((id) => seleccion.has(id));
  if (tipos.length !== 1) {
    campos.push("tipo");
    detalles.push("Elige exactamente un tipo de web: landing o web corporativa.");
  }

  const adicionales = seleccion.get("paginaAdicional");
  if (
    adicionales &&
    !(Number.isInteger(adicionales.cantidad) && adicionales.cantidad >= 1 && adicionales.cantidad <= CANTIDAD_MAX)
  ) {
    campos.push("cantidad");
    detalles.push(`Indica cuántas páginas adicionales necesitas: un número entero entre 1 y ${CANTIDAD_MAX}.`);
  }

  for (const linea of seleccion.values()) {
    if (
      linea.justificacion !== undefined &&
      (typeof linea.justificacion !== "string" || linea.justificacion.length > LIMITES.justificacion)
    ) {
      campos.push("servicios");
      detalles.push(`La explicación de "${buscarServicio(linea.id).nombre}" no es válida.`);
    }
  }

  if (campos.length > 0) return respuestaErrores([...new Set(campos)], detalles);

  // Se reutiliza el contrato y el cálculo de POST /api/presupuesto.
  const contrato = validarSolicitud({
    tipo: tipos[0],
    paginas: adicionales ? adicionales.cantidad + 1 : 1,
    formulario: seleccion.has("formulario"),
    segundoIdioma: seleccion.has("segundoIdioma"),
  });
  if (!contrato.valido) return respuestaErrores(contrato.campos, contrato.detalles);

  return {
    valido: true,
    datos: {
      cliente: cuerpo.cliente.trim(),
      resumen: cuerpo.resumen.trim(),
      seleccion,
      dudas,
      pendientes,
      solicitud: contrato.datos,
    },
  };
}

/** Construye el documento final (vista previa y PDF salen de este mismo objeto). */
function construirDocumento({ cliente, resumen, seleccion, dudas, pendientes, solicitud }, ahora = new Date()) {
  const desglose = calcularPresupuesto(solicitud);

  const importes = {
    [solicitud.tipo]: desglose.base,
    paginaAdicional: desglose.paginasAdicionales,
    formulario: desglose.formulario,
    segundoIdioma: desglose.segundoIdioma,
  };

  const lineas = CATALOGO.filter((s) => seleccion.has(s.id)).map((s) => {
    const cantidad = s.grupo === "unidad" ? seleccion.get(s.id).cantidad : 1;
    return {
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      justificacion: seleccion.get(s.id).justificacion?.trim() || null,
      cantidad,
      unidad: s.unidad ?? null,
      precioUnitario: s.precio,
      importe: importes[s.id],
    };
  });

  return {
    cliente,
    fecha: new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(ahora),
    resumen,
    lineas,
    total: desglose.total,
    moneda: MONEDA,
    dudas,
    pendientes,
  };
}

module.exports = { LIMITES, validarDescripcion, normalizarPropuesta, validarSeleccion, construirDocumento };
