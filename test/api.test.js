// Pruebas automáticas: se ejecutan con `npm test`.
// Arrancan la API en un puerto libre, envían las peticiones y comparan
// el resultado obtenido con el esperado.

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { calcularPresupuesto } = require("../src/calculo");
const { casosObligatorios, casosAdicionales } = require("../pruebas/casos");

let servidor;
let url;

before(async () => {
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve); // puerto 0 = cualquier puerto libre
  });
  url = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

function enviarPresupuesto(cuerpo, contentType = "application/json") {
  return fetch(`${url}/api/presupuesto`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(cuerpo),
  });
}

describe("GET /api/estado", () => {
  test("responde 200 con { status: 'ok' }", async () => {
    const respuesta = await fetch(`${url}/api/estado`);
    assert.equal(respuesta.status, 200);
    assert.deepEqual(await respuesta.json(), { status: "ok" });
  });
});

describe("GET /api/tarifas", () => {
  test("devuelve las cinco tarifas con su nombre y precio", async () => {
    const respuesta = await fetch(`${url}/api/tarifas`);
    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.moneda, "EUR");

    const precios = Object.fromEntries(cuerpo.tarifas.map((t) => [t.concepto, t.precio]));
    assert.deepEqual(precios, {
      landing: 300,
      corporativa: 600,
      paginaAdicional: 50,
      formulario: 80,
      segundoIdioma: 150,
    });
  });
});

describe("POST /api/presupuesto: casos obligatorios", () => {
  for (const c of casosObligatorios) {
    test(`Caso ${c.caso}: ${c.descripcion} → ${c.estadoEsperado}`, async () => {
      const respuesta = await enviarPresupuesto(c.solicitud);
      const cuerpo = await respuesta.json();

      assert.equal(respuesta.status, c.estadoEsperado);
      if (c.totalEsperado !== undefined) assert.equal(cuerpo.total, c.totalEsperado);
      if (c.campoErroneo) assert.ok(cuerpo.campos.includes(c.campoErroneo));
    });
  }

  test("Caso 2 devuelve exactamente el desglose del enunciado", async () => {
    const respuesta = await enviarPresupuesto(casosObligatorios[1].solicitud);
    assert.deepEqual(await respuesta.json(), {
      base: 600,
      paginasAdicionales: 150,
      formulario: 80,
      segundoIdioma: 0,
      total: 830,
      moneda: "EUR",
    });
  });
});

describe("POST /api/presupuesto: casos adicionales", () => {
  for (const c of casosAdicionales) {
    test(`${c.caso}: ${c.descripcion} → ${c.estadoEsperado}`, async () => {
      const respuesta = await enviarPresupuesto(c.solicitud, c.contentType);
      const cuerpo = await respuesta.json();

      assert.equal(respuesta.status, c.estadoEsperado);
      if (c.totalEsperado !== undefined) assert.equal(cuerpo.total, c.totalEsperado);
      if (c.campoErroneo) assert.ok(cuerpo.campos.includes(c.campoErroneo));
    });
  }

  test("JSON mal escrito → 400", async () => {
    const respuesta = await fetch(`${url}/api/presupuesto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"tipo": "landing",',
    });
    assert.equal(respuesta.status, 400);
  });
});

describe("calcularPresupuesto() (función independiente de la ruta)", () => {
  test("aplica base + páginas adicionales + extras", () => {
    assert.deepEqual(
      calcularPresupuesto({ tipo: "landing", paginas: 2, formulario: true, segundoIdioma: true }),
      {
        base: 300,
        paginasAdicionales: 50,
        formulario: 80,
        segundoIdioma: 150,
        total: 580,
        moneda: "EUR",
      }
    );
  });
});
