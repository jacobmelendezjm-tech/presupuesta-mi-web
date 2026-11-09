const path = require("node:path");
const PDFDocument = require("pdfkit");

const RUTA_CAMARON = path.join(__dirname, "assets", "camaron.png");

// PDFKit carga sus fuentes con un require dinámico y Vercel solo empaqueta lo que
// ve citado en el código. Sin estas líneas, el PDF falla solo en producción.
require("pdfkit/standard-fonts/Helvetica");
require("pdfkit/standard-fonts/HelveticaBold");
require("pdfkit/standard-fonts/HelveticaOblique");

const COLOR = { texto: "#1d1d1f", suave: "#6e6e73", linea: "#d2d2d7", acento: "#0071e3", fondo: "#f5f5f7" };
const MARGEN = 50;
const ANCHO_PAGINA = 595.28;
const ALTO_UTIL = 841.89 - 60;
const ANCHO = ANCHO_PAGINA - MARGEN * 2;
const COL_DETALLE = 90;
const COL_IMPORTE = 80;
const COL_CONCEPTO = ANCHO - COL_DETALLE - COL_IMPORTE;

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const euros = (cantidad) => formatoEuros.format(cantidad);

// Las fuentes estándar de PDF solo tienen los caracteres de WinAnsi (español incluido).
// El resto (emojis, otros alfabetos) se sustituye para que no salgan símbolos rotos.
function limpiar(texto) {
  return String(texto)
    .replace(/ /g, " ")
    .replace(/[→⇒]/g, "->")
    .replace(/[^\n\x20-\x7E\xA0-\xFF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/gu, "?");
}

const detalleLinea = (l) => (l.unidad ? `${l.cantidad} × ${euros(l.precioUnitario)}` : "");

/** Genera el PDF a partir del documento calculado por el servidor y devuelve un Buffer. */
function generarPdf(documento) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGEN, bottom: 30, left: MARGEN, right: MARGEN },
      bufferPages: true,
      info: { Title: limpiar(`Presupuesto - ${documento.cliente}`), Author: "Presupuesta mi web" },
    });

    const partes = [];
    doc.on("data", (p) => partes.push(p));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    const asegurarEspacio = (alto) => {
      if (doc.y + alto > ALTO_UTIL) doc.addPage();
    };

    const titulo = (texto) => {
      asegurarEspacio(50);
      doc.moveDown(1.1).font("Helvetica-Bold").fontSize(12).fillColor(COLOR.texto).text(texto, MARGEN);
      doc.moveDown(0.35);
    };

    const lista = (elementos) => {
      doc.font("Helvetica").fontSize(10).fillColor(COLOR.texto);
      for (const elemento of elementos) {
        asegurarEspacio(doc.heightOfString(limpiar(elemento), { width: ANCHO - 14 }) + 6);
        const y = doc.y;
        doc.text("•", MARGEN, y);
        doc.text(limpiar(elemento), MARGEN + 14, y, { width: ANCHO - 14 });
        doc.moveDown(0.3);
      }
    };

    // Cabecera
    doc.image(RUTA_CAMARON, ANCHO_PAGINA - MARGEN - 58, 34, { width: 58 });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.acento).text("Presupuesta mi web", MARGEN, MARGEN);
    doc.font("Helvetica-Bold").fontSize(26).fillColor(COLOR.texto).text("Presupuesto", { width: ANCHO - 70 });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(11).text(limpiar(documento.cliente), { width: ANCHO - 70 });
    doc.font("Helvetica").fontSize(10).fillColor(COLOR.suave).text(limpiar(documento.fecha));
    doc.y = Math.max(doc.y, 34 + 94);

    titulo("Resumen del proyecto");
    doc.font("Helvetica").fontSize(10).fillColor(COLOR.texto).text(limpiar(documento.resumen), MARGEN, doc.y, { width: ANCHO, lineGap: 2 });

    titulo("Servicios y desglose");
    asegurarEspacio(26);
    let y = doc.y;
    doc.rect(MARGEN, y, ANCHO, 20).fill(COLOR.fondo);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR.suave);
    doc.text("Servicio", MARGEN + 8, y + 6, { width: COL_CONCEPTO - 8, lineBreak: false });
    doc.text("Detalle", MARGEN + COL_CONCEPTO, y + 6, { width: COL_DETALLE - 8, align: "right", lineBreak: false });
    doc.text("Importe", MARGEN + COL_CONCEPTO + COL_DETALLE, y + 6, { width: COL_IMPORTE - 8, align: "right", lineBreak: false });
    doc.y = y + 26;

    for (const linea of documento.lineas) {
      const anchoTexto = COL_CONCEPTO - 16;
      const descripcion = limpiar(linea.descripcion);
      const justificacion = linea.justificacion ? limpiar(linea.justificacion) : null;

      doc.font("Helvetica-Bold").fontSize(10);
      let alto = doc.heightOfString(limpiar(linea.nombre), { width: anchoTexto }) + 3;
      doc.font("Helvetica").fontSize(9);
      alto += doc.heightOfString(descripcion, { width: anchoTexto }) + 2;
      if (justificacion) {
        doc.font("Helvetica-Oblique");
        alto += doc.heightOfString(justificacion, { width: anchoTexto }) + 2;
      }
      asegurarEspacio(alto + 12);

      y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.texto);
      doc.text(limpiar(linea.nombre), MARGEN + 8, y, { width: anchoTexto });
      doc.text(limpiar(euros(linea.importe)), MARGEN + COL_CONCEPTO + COL_DETALLE, y, { width: COL_IMPORTE - 8, align: "right" });
      doc.font("Helvetica").fontSize(9).fillColor(COLOR.suave);
      doc.text(limpiar(detalleLinea(linea)), MARGEN + COL_CONCEPTO, y, { width: COL_DETALLE - 8, align: "right" });

      doc.y = y + doc.font("Helvetica-Bold").fontSize(10).heightOfString(limpiar(linea.nombre), { width: anchoTexto }) + 3;
      doc.font("Helvetica").fontSize(9).fillColor(COLOR.suave).text(descripcion, MARGEN + 8, doc.y, { width: anchoTexto });
      if (justificacion) {
        doc.moveDown(0.15).font("Helvetica-Oblique").text(justificacion, MARGEN + 8, doc.y, { width: anchoTexto });
      }

      y = doc.y + 6;
      doc.moveTo(MARGEN, y).lineTo(MARGEN + ANCHO, y).lineWidth(0.5).strokeColor(COLOR.linea).stroke();
      doc.y = y + 7;
    }

    asegurarEspacio(50);
    y = doc.y + 2;
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLOR.texto).text("Total", MARGEN + 8, y, { lineBreak: false });
    doc.text(limpiar(euros(documento.total)), MARGEN, y, { width: ANCHO - 8, align: "right" });
    doc.font("Helvetica").fontSize(8.5).fillColor(COLOR.suave).text(`Importes sin impuestos, en ${documento.moneda}.`, MARGEN, doc.y + 3, { width: ANCHO - 8, align: "right" });

    if (documento.dudas.length > 0 || documento.pendientes.length > 0) {
      titulo("Aclaraciones y aspectos pendientes de concretar");
      lista(documento.dudas);
      if (documento.pendientes.length > 0) {
        asegurarEspacio(40);
        doc.moveDown(0.3).font("Helvetica-Bold").fontSize(10).fillColor(COLOR.texto).text("Fuera de catálogo · pendiente de valorar (no incluido en el total)", MARGEN);
        doc.moveDown(0.3);
        lista(documento.pendientes);
      }
    }

    // Numeración de páginas. Sin margen inferior para que no cree páginas nuevas.
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i += 1) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      doc.font("Helvetica").fontSize(8).fillColor(COLOR.suave).text(
        `Propuesta orientativa generada con asistencia de IA y revisada por el cliente · Página ${i + 1} de ${rango.count}`,
        MARGEN,
        812,
        { width: ANCHO, align: "center", lineBreak: false }
      );
    }

    doc.end();
  });
}

module.exports = { generarPdf };
