// Envía las peticiones de prueba a la API que está en marcha
// (por defecto http://localhost:3000) y muestra una tabla con la
// solicitud enviada, el resultado esperado y el resultado obtenido.
//
// Uso:  1) npm start   (en una terminal)
//       2) npm run pruebas   (en otra terminal)

const { casosObligatorios, casosAdicionales } = require("./casos");

const BASE_URL = process.env.API_URL || "http://localhost:3000";

function esperado(c) {
  if (c.estadoEsperado === 200) {
    return `200 · Total: ${c.totalEsperado.toLocaleString("es-ES", { useGrouping: "always" })} €`;
  }
  return "400";
}

function obtenido(estado, cuerpo) {
  if (estado === 200) {
    return `${estado} · Total: ${cuerpo.total.toLocaleString("es-ES", { useGrouping: "always" })} €`;
  }
  return `${estado} · ${cuerpo.detalles ? cuerpo.detalles.join(" ") : cuerpo.error}`;
}

async function probarGet(ruta) {
  const respuesta = await fetch(`${BASE_URL}${ruta}`);
  const cuerpo = await respuesta.json();
  console.log(`GET ${ruta} → ${respuesta.status}`);
  console.log(JSON.stringify(cuerpo, null, 2));
  console.log();
  return respuesta.status === 200;
}

async function probarCaso(c) {
  const respuesta = await fetch(`${BASE_URL}/api/presupuesto`, {
    method: "POST",
    headers: { "Content-Type": c.contentType || "application/json" },
    body: JSON.stringify(c.solicitud),
  });
  const cuerpo = await respuesta.json();

  const correcto =
    respuesta.status === c.estadoEsperado &&
    (c.totalEsperado === undefined || cuerpo.total === c.totalEsperado);

  return {
    Caso: c.caso,
    Solicitud: JSON.stringify(c.solicitud),
    Esperado: esperado(c),
    Obtenido: obtenido(respuesta.status, cuerpo),
    "¿OK?": correcto ? "✔" : "✘",
  };
}

async function main() {
  let fallos = 0;

  if (!(await probarGet("/api/estado"))) fallos++;
  if (!(await probarGet("/api/tarifas"))) fallos++;

  for (const [titulo, casos] of [
    ["Casos obligatorios", casosObligatorios],
    ["Casos adicionales", casosAdicionales],
  ]) {
    const filas = [];
    for (const c of casos) filas.push(await probarCaso(c));
    fallos += filas.filter((f) => f["¿OK?"] !== "✔").length;

    console.log(`POST /api/presupuesto · ${titulo}`);
    console.table(filas);
  }

  console.log(fallos === 0 ? "Todas las pruebas son correctas." : `Pruebas fallidas: ${fallos}`);
  process.exitCode = fallos === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(`No se pudo conectar con ${BASE_URL}. ¿Está la API en marcha (npm start)?`);
  console.error(error.message);
  process.exitCode = 1;
});
