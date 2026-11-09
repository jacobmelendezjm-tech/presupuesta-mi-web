// Pruebas de la calculadora por pasos: POST /api/estimacion y su PDF.

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

let servidor;
let url;

before(async () => {
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve);
  });
  url = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

const post = (ruta, cuerpo) =>
  fetch(`${url}${ruta}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });

describe("POST /api/estimacion", () => {
  test("una web corporativa coincide con POST /api/presupuesto", async () => {
    const estimacion = await (await post("/api/estimacion", { tipo: "corporativa", paginas: 4, opciones: ["formulario"] })).json();
    const presupuesto = await (
      await post("/api/presupuesto", { tipo: "corporativa", paginas: 4, formulario: true, segundoIdioma: false })
    ).json();
    assert.equal(estimacion.total, presupuesto.total);
    assert.equal(estimacion.total, 830);
  });

  test("lo mensual va aparte y no suma al total", async () => {
    const r = await (await post("/api/estimacion", { tipo: "landing", opciones: ["soporte"], plan: "basico" })).json();
    assert.equal(r.total, 300);
    assert.equal(r.totalMensual, 49 + 29);
  });

  test("un precio enviado por el cliente se ignora", async () => {
    const r = await (await post("/api/estimacion", { tipo: "landing", precio: 1, total: 1 })).json();
    assert.equal(r.total, 300);
  });

  test("e-commerce suma su base y las opciones", async () => {
    const catalogo = await (await fetch(`${url}/api/estimacion/catalogo`)).json();
    const base = catalogo.tipos.find((t) => t.id === "ecommerce").precio;
    const seo = catalogo.opciones.find((o) => o.id === "seo").precio;
    const r = await (await post("/api/estimacion", { tipo: "ecommerce", paginas: 999, opciones: ["seo"] })).json();
    assert.equal(r.total, base + seo);
  });

  for (const [nombre, cuerpo, campo] of [
    ["tipo inexistente", { tipo: "blog" }, "tipo"],
    ["opción inexistente", { tipo: "landing", opciones: ["magia"] }, "opciones"],
    ["opción repetida", { tipo: "landing", opciones: ["seo", "seo"] }, "opciones"],
    ["dos enfoques de diseño", { tipo: "landing", opciones: ["uiCustom", "plantilla"] }, "opciones"],
    ["plan inexistente", { tipo: "landing", plan: "oro" }, "plan"],
    ["páginas fuera de rango", { tipo: "corporativa", paginas: 21 }, "paginas"],
  ]) {
    test(`responde 400 con ${nombre}`, async () => {
      const r = await post("/api/estimacion", cuerpo);
      assert.equal(r.status, 400);
      assert.ok((await r.json()).campos.includes(campo));
    });
  }
});

describe("POST /api/estimacion/pdf", () => {
  test("genera el PDF y exige el nombre del cliente", async () => {
    const r = await post("/api/estimacion/pdf", { cliente: "Empresa Ficticia S.L.", tipo: "saas", opciones: ["cms", "soporte"] });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "application/pdf");
    assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
    assert.equal((await post("/api/estimacion/pdf", { tipo: "saas" })).status, 400);
  });
});
