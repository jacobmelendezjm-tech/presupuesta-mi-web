const path = require("node:path");
const PDFDocument = require("pdfkit");

// Rutas escritas una a una: Vercel solo empaqueta los archivos que ve citados así.
const RUTA_CAMARON = path.join(__dirname, "assets", "camaron.png");
const RUTA_INTER = path.join(__dirname, "assets", "fuentes", "inter-latin-400-normal.woff");
const RUTA_INTER_SEMI = path.join(__dirname, "assets", "fuentes", "inter-latin-600-normal.woff");
const RUTA_INTER_BOLD = path.join(__dirname, "assets", "fuentes", "inter-latin-700-normal.woff");
const RUTA_INTER_CURSIVA = path.join(__dirname, "assets", "fuentes", "inter-latin-400-italic.woff");

const URL_WEB = "https://presupuesta-mi-web.vercel.app";

// Misma identidad que la web (tokens de cliente/src/index.css).
const COLOR = {
  noche: "#0f172a",
  texto: "#0f172a",
  suave: "#64748b",
  gris: "#94a3b8",
  grisClaro: "#cbd5e1",
  linea: "#e2e8f0",
  fondo: "#f4f5f7",
  azul: "#2563eb",
  azulClaro: "#60a5fa",
};
// Escala sobria para el desglose: cada concepto toma un tono por orden.
const TONOS = ["#0f172a", "#2563eb", "#60a5fa", "#94a3b8", "#cbd5e1"];
const tonoLinea = (indice) => TONOS[indice % TONOS.length];

const ANCHO_PAGINA = 595.28;
const MARGEN = 50;
const ANCHO = ANCHO_PAGINA - MARGEN * 2;
const ALTO_UTIL = 788;
const ALTO_CABECERA = 176;
const COL_DETALLE = 90;
const COL_IMPORTE = 80;
const SANGRIA = 16;
const ANCHO_CONCEPTO = ANCHO - COL_DETALLE - COL_IMPORTE - SANGRIA - 8;

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const euros = (cantidad) => formatoEuros.format(cantidad);

// La fuente incluida solo tiene alfabeto latino. El resto (emojis, otros
// alfabetos) se sustituye para que no salgan símbolos rotos.
function limpiar(texto) {
  return String(texto)
    .replace(/[  ]/g, " ")
    .replace(/[→⇒]/g, "->")
    .replace(/[^\n\x20-\x7E\xA1-\xFFŒœ‐-‧‰-⁞€™]/gu, "?");
}

const detalleLinea = (l) => (l.unidad ? `${l.cantidad} × ${euros(l.precioUnitario)}` : "");

/** Logo JM: mismos trazos que `LogoJM` en App.jsx (caja de 46 × 26). */
function dibujarLogo(doc, x, y, ancho, colorLetras) {
  const escala = ancho / 46;
  doc.save().translate(x, y).scale(escala);
  doc.path("M3 18a5 5 0 0 0 10 0V3M19 23V3l8 11 8-11v20").lineWidth(2.6).lineCap("round").lineJoin("round").stroke(colorLetras);
  doc.circle(42, 21, 2.4).fill(COLOR.azulClaro);
  doc.restore();
}

function dibujarCabecera(doc, documento) {
  doc.rect(0, 0, ANCHO_PAGINA, ALTO_CABECERA).fill(COLOR.noche);

  doc.rect(0, ALTO_CABECERA, ANCHO_PAGINA, 4).fill(COLOR.azul);

  // Camarón apoyado sobre la franja de color
  const camaron = doc.openImage(RUTA_CAMARON);
  const anchoCamaron = 104;
  const altoCamaron = (camaron.height / camaron.width) * anchoCamaron;
  doc.image(camaron, ANCHO_PAGINA - MARGEN - anchoCamaron + 10, ALTO_CABECERA - altoCamaron + 2, { width: anchoCamaron });

  dibujarLogo(doc, MARGEN, 30, 34, "#f5f5f7");
  doc.moveTo(MARGEN + 42, 31).lineTo(MARGEN + 42, 49).lineWidth(0.75).stroke("#475569");
  doc.font("InterSemi").fontSize(14).fillColor("#f5f5f7").text("Presupuesta", MARGEN + 50, 33, { lineBreak: false });

  const anchoTexto = ANCHO - 130;
  doc.font("InterBold").fontSize(32).fillColor("#f5f5f7").text("Tu presupuesto.", MARGEN, 66, { width: anchoTexto, lineBreak: false });
  doc.font("InterSemi").fontSize(12).fillColor("#f5f5f7").text(limpiar(documento.cliente), MARGEN, 114, {
    width: anchoTexto,
    height: 32,
    ellipsis: true,
  });
  doc.font("Inter").fontSize(10).fillColor(COLOR.grisClaro).text(limpiar(documento.fecha), MARGEN, 150, { width: anchoTexto });
}

/** Total grande y barra de conceptos. */
function dibujarTotal(doc, documento, y) {
  const total = limpiar(euros(documento.total));
  doc.font("InterBold").fontSize(50).fillColor(COLOR.noche).text(total, MARGEN, y, { lineBreak: false });
  doc.font("Inter").fontSize(9.5).fillColor(COLOR.suave).text(`Sin impuestos · ${documento.moneda}`, MARGEN, y + 62, { lineBreak: false });

  const conImporte = documento.lineas.filter((l) => l.importe > 0);
  const yBarra = y + 82;
  const hueco = 3;
  const disponible = ANCHO - hueco * (conImporte.length - 1);
  doc.save().roundedRect(MARGEN, yBarra, ANCHO, 10, 5).clip();
  let x = MARGEN;
  for (const linea of conImporte) {
    const ancho = (linea.importe / documento.total) * disponible;
    doc.rect(x, yBarra, ancho, 10).fill(tonoLinea(documento.lineas.indexOf(linea)));
    x += ancho + hueco;
  }
  doc.restore();
  doc.y = yBarra + 10;
}

/** Genera el PDF a partir del documento calculado por el servidor y devuelve un Buffer. */
function generarPdf(documento) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      font: RUTA_INTER,
      margins: { top: MARGEN, bottom: 30, left: MARGEN, right: MARGEN },
      bufferPages: true,
      info: { Title: limpiar(`Presupuesto - ${documento.cliente}`), Author: "Presupuesta mi web" },
    });

    doc.registerFont("Inter", RUTA_INTER);
    doc.registerFont("InterSemi", RUTA_INTER_SEMI);
    doc.registerFont("InterBold", RUTA_INTER_BOLD);
    doc.registerFont("InterCursiva", RUTA_INTER_CURSIVA);

    const partes = [];
    doc.on("data", (p) => partes.push(p));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    const asegurarEspacio = (alto) => {
      if (doc.y + alto > ALTO_UTIL) doc.addPage();
    };

    // Titulares como los de la web: «Tarifas. Claras desde el principio.»
    // Reservan sitio para lo que sigue, para no quedarse solos al final de una página.
    const titulo = (principal, secundario, altoSiguiente = 0) => {
      asegurarEspacio(62 + altoSiguiente);
      doc.moveDown(1.5);
      doc.font("InterBold").fontSize(17).fillColor(COLOR.texto).text(`${principal} `, MARGEN, doc.y, { continued: true });
      doc.fillColor(COLOR.gris).text(secundario);
      doc.moveDown(0.55);
    };

    const altoElemento = (texto) =>
      doc.font("Inter").fontSize(10).heightOfString(limpiar(texto), { width: ANCHO - SANGRIA, lineGap: 1.5 }) + 8;

    const lista = (elementos) => {
      for (const elemento of elementos) {
        const texto = limpiar(elemento);
        asegurarEspacio(altoElemento(texto));
        doc.font("Inter").fontSize(10);
        const y = doc.y;
        doc.circle(MARGEN + 3, y + 5.5, 2.25).fill(COLOR.azul);
        doc.fillColor(COLOR.texto).text(texto, MARGEN + SANGRIA, y, { width: ANCHO - SANGRIA, lineGap: 1.5 });
        doc.moveDown(0.4);
      }
    };

    dibujarCabecera(doc, documento);
    dibujarTotal(doc, documento, ALTO_CABECERA + 26);

    titulo("Tu proyecto.", "En pocas palabras.");
    const resumen = limpiar(documento.resumen);
    doc.font("Inter").fontSize(10.5);
    const altoResumen = doc.heightOfString(resumen, { width: ANCHO - 36, lineGap: 3 });
    asegurarEspacio(altoResumen + 36);
    const yResumen = doc.y;
    doc.roundedRect(MARGEN, yResumen, ANCHO, altoResumen + 36, 14).fill(COLOR.fondo);
    doc.fillColor(COLOR.texto).text(resumen, MARGEN + 18, yResumen + 18, { width: ANCHO - 36, lineGap: 3 });
    doc.y = yResumen + altoResumen + 36;

    const altoLinea = (linea) => {
      doc.font("InterSemi").fontSize(11);
      let alto = doc.heightOfString(limpiar(linea.nombre), { width: ANCHO_CONCEPTO }) + 3;
      doc.font("Inter").fontSize(9.5);
      alto += doc.heightOfString(limpiar(linea.descripcion), { width: ANCHO_CONCEPTO }) + 2;
      if (linea.justificacion) {
        doc.font("InterCursiva");
        alto += doc.heightOfString(limpiar(linea.justificacion), { width: ANCHO_CONCEPTO }) + 4;
      }
      return alto + 22;
    };
    const ALTO_FILA_TOTAL = 36;

    titulo("Servicios.", "Uno a uno.", altoLinea(documento.lineas[0]));

    documento.lineas.forEach((linea, indice) => {
      const nombre = limpiar(linea.nombre);
      const descripcion = limpiar(linea.descripcion);
      const justificacion = linea.justificacion ? limpiar(linea.justificacion) : null;

      // La última línea reserva sitio para que el total no se quede solo en otra página.
      const esUltima = indice === documento.lineas.length - 1;
      asegurarEspacio(altoLinea(linea) + (esUltima ? ALTO_FILA_TOTAL : 0));

      doc.font("InterSemi").fontSize(11);
      const altoNombre = doc.heightOfString(nombre, { width: ANCHO_CONCEPTO }) + 3;

      const y = doc.y + 8;
      const xTexto = MARGEN + SANGRIA;
      doc.circle(MARGEN + 4, y + 6.5, 4).fill(tonoLinea(indice));
      doc.font("InterSemi").fontSize(11).fillColor(COLOR.texto).text(nombre, xTexto, y, { width: ANCHO_CONCEPTO });
      doc.text(limpiar(euros(linea.importe)), MARGEN + ANCHO - COL_IMPORTE, y, { width: COL_IMPORTE, align: "right" });
      doc.font("Inter").fontSize(9.5).fillColor(COLOR.suave);
      doc.text(limpiar(detalleLinea(linea)), MARGEN + ANCHO - COL_IMPORTE - COL_DETALLE, y + 1, { width: COL_DETALLE - 8, align: "right" });

      doc.y = y + altoNombre;
      doc.text(descripcion, xTexto, doc.y, { width: ANCHO_CONCEPTO });
      if (justificacion) {
        doc.font("InterCursiva").text(justificacion, xTexto, doc.y + 4, { width: ANCHO_CONCEPTO });
      }

      const yLinea = doc.y + 9;
      doc.moveTo(MARGEN, yLinea).lineTo(MARGEN + ANCHO, yLinea).lineWidth(0.5).stroke(COLOR.linea);
      doc.y = yLinea;
    });

    asegurarEspacio(ALTO_FILA_TOTAL);
    const yTotal = doc.y + 12;
    doc.font("InterBold").fontSize(16).fillColor(COLOR.texto).text("Total", MARGEN, yTotal, { lineBreak: false });
    doc.text(limpiar(euros(documento.total)), MARGEN, yTotal, { width: ANCHO, align: "right" });
    doc.y = yTotal + 22;

    if (documento.dudas.length > 0 || documento.pendientes.length > 0) {
      titulo("Antes de empezar.", "Aclaraciones y pendientes.", documento.dudas.length > 0 ? altoElemento(documento.dudas[0]) : 50);
      lista(documento.dudas);
      if (documento.pendientes.length > 0) {
        asegurarEspacio(50);
        doc.moveDown(0.4).font("InterSemi").fontSize(10.5).fillColor(COLOR.texto);
        doc.text("Fuera de catálogo · pendiente de valorar (no incluido en el total)", MARGEN, doc.y, { width: ANCHO });
        doc.moveDown(0.45);
        lista(documento.pendientes);
      }
    }

    // Pie de cada página. Sin margen inferior para que no cree páginas nuevas.
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i += 1) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;

      if (i > 0) doc.rect(0, 0, ANCHO_PAGINA, 4).fill(COLOR.azul);

      doc.moveTo(MARGEN, 794).lineTo(MARGEN + ANCHO, 794).lineWidth(0.5).stroke(COLOR.linea);
      dibujarLogo(doc, MARGEN, 802, 19, COLOR.texto);
      doc.font("InterSemi").fontSize(8).fillColor(COLOR.texto).text("Presupuesta mi web", MARGEN + 25, 800, { lineBreak: false });
      doc.font("Inter").fontSize(7.5).fillColor(COLOR.suave);
      doc.text("Tu web, al precio exacto.", MARGEN + 25, 811, { lineBreak: false });
      doc.text(`Página ${i + 1} de ${rango.count}`, MARGEN, 800, { width: ANCHO, align: "right", lineBreak: false });
      doc.fillColor(COLOR.azul).text("presupuesta-mi-web.vercel.app", MARGEN, 811, { width: ANCHO, align: "right", lineBreak: false, link: URL_WEB });
      doc.fillColor(COLOR.gris).fontSize(7).text("Propuesta orientativa generada con asistencia de IA y revisada por el cliente.", MARGEN, 822, {
        width: ANCHO,
        align: "center",
        lineBreak: false,
      });
    }

    doc.end();
  });
}

module.exports = { generarPdf };
