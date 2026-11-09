// Pruebas del asistente. OpenAI se simula: no se gasta saldo ni hace falta clave real.

const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

const fetchReal = globalThis.fetch;
let servidor;
let url;
let simularOpenAI; // función que devuelve la respuesta falsa de OpenAI
let llamadasOpenAI;

const respuestaIA = (objeto) =>
  new Response(
    JSON.stringify({
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(objeto) }] }],
    }),
    { status: 200 }
  );

before(async () => {
  process.env.OPENAI_API_KEY = "clave-de-prueba";
  globalThis.fetch = (destino, opciones) => {
    if (String(destino).startsWith("https://api.openai.com/")) {
      llamadasOpenAI += 1;
      return Promise.resolve().then(simularOpenAI);
    }
    return fetchReal(destino, opciones);
  };
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve);
  });
  url = `http://localhost:${servidor.address().port}`;
});

after(() => {
  globalThis.fetch = fetchReal;
  servidor.close();
});

beforeEach(() => {
  llamadasOpenAI = 0;
});

const post = (ruta, cuerpo) =>
  fetch(`${url}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

const solicitud = { cliente: "Restaurante Ficticio", descripcion: "Quiero una web con carta y reservas." };

const seleccion = (servicios) => ({
  cliente: "Restaurante Ficticio",
  resumen: "Web para un restaurante.",
  servicios,
  dudas: ["¿Cuántas páginas?"],
  pendientes: [],
});

describe("POST /api/propuesta", () => {
  test("solicitud clara: devuelve los servicios del catálogo con su justificación", async () => {
    simularOpenAI = () =>
      respuestaIA({
        resumen: "Web para un restaurante con carta y dos idiomas.",
        servicios: [
          { id: "corporativa", justificacion: "Necesita varias secciones.", cantidad: null },
          { id: "paginaAdicional", justificacion: "Carta y contacto.", cantidad: 2 },
          { id: "segundoIdioma", justificacion: "Pide dos idiomas.", cantidad: null },
        ],
        dudas: [],
        fueraDeCatalogo: [],
      });
    const r = await post("/api/propuesta", solicitud);
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.deepEqual(d.servicios.map((s) => s.id), ["corporativa", "paginaAdicional", "segundoIdioma"]);
    assert.equal(d.servicios[1].cantidad, 2);
    assert.equal(d.servicios[0].precio, undefined);
  });

  test("solicitud ambigua: sin tipo de web, conserva las dudas y deja la cantidad por completar", async () => {
    simularOpenAI = () =>
      respuestaIA({
        resumen: "El cliente quiere presencia en internet.",
        servicios: [{ id: "paginaAdicional", justificacion: "Varias secciones.", cantidad: null }],
        dudas: ["¿Qué tipo de web necesitas?"],
        fueraDeCatalogo: [],
      });
    const d = await (await post("/api/propuesta", solicitud)).json();
    assert.deepEqual(d.dudas, ["¿Qué tipo de web necesitas?"]);
    assert.equal(d.servicios[0].cantidad, null);
  });

  test("servicio inexistente: se descarta y queda pendiente de valorar", async () => {
    simularOpenAI = () =>
      respuestaIA({
        resumen: "Tienda online.",
        servicios: [
          { id: "tiendaOnline", justificacion: "Vende productos.", cantidad: null, precio: 1 },
          { id: "landing", justificacion: "Una página.", cantidad: null },
        ],
        dudas: [],
        fueraDeCatalogo: [{ necesidad: "Pasarela de pago", motivo: "No está en el catálogo." }],
      });
    const d = await (await post("/api/propuesta", solicitud)).json();
    assert.deepEqual(d.servicios.map((s) => s.id), ["landing"]);
    assert.equal(d.pendientes.length, 2);
    assert.ok(d.pendientes.some((p) => p.startsWith("Pasarela de pago")));
    assert.ok(d.pendientes.some((p) => p.startsWith("tiendaOnline")));
  });

  test("elimina precios y plazos inventados, repetidos y tipos duplicados", async () => {
    simularOpenAI = () =>
      respuestaIA({
        resumen: "Web para un taller. Costará 900 euros. La tendrás en dos semanas.",
        servicios: [
          { id: "landing", justificacion: "Sale por 300 €.", cantidad: null },
          { id: "landing", justificacion: "Repetido.", cantidad: null },
          { id: "corporativa", justificacion: "Otro tipo.", cantidad: null },
        ],
        dudas: [],
        fueraDeCatalogo: [],
      });
    const d = await (await post("/api/propuesta", solicitud)).json();
    assert.equal(d.resumen, "Web para un taller.");
    assert.deepEqual(d.servicios.map((s) => s.id), ["landing"]);
    assert.ok(!d.servicios[0].justificacion.includes("€"));
    assert.equal(d.dudas.length, 1);
  });

  test("descripción vacía o demasiado larga: 400 sin llamar a OpenAI", async () => {
    for (const descripcion of ["", "   ", "x".repeat(2001), 12]) {
      const r = await post("/api/propuesta", { cliente: "Ficticio", descripcion });
      assert.equal(r.status, 400);
      assert.deepEqual((await r.json()).campos, ["descripcion"]);
    }
    assert.equal(llamadasOpenAI, 0);
  });

  test("fallo de OpenAI: error reintentable sin filtrar detalles", async () => {
    simularOpenAI = () => new Response('{"error":"clave-de-prueba incorrecta"}', { status: 500 });
    const r = await post("/api/propuesta", solicitud);
    assert.equal(r.status, 502);
    const d = await r.json();
    assert.equal(d.reintentable, true);
    assert.ok(!JSON.stringify(d).includes("clave-de-prueba"));
  });

  test("OpenAI inaccesible o con JSON roto: 502 reintentable", async () => {
    const casos = [
      () => {
        throw new TypeError("fetch failed");
      },
      () =>
        new Response(
          JSON.stringify({
            status: "completed",
            output: [{ type: "message", content: [{ type: "output_text", text: "{roto" }] }],
          })
        ),
      () => respuestaIA({ otra: "forma" }),
    ];
    for (simularOpenAI of casos) {
      const r = await post("/api/propuesta", solicitud);
      assert.equal(r.status, 502);
      assert.equal((await r.json()).reintentable, true);
    }
  });

  test("sin clave configurada: 503", async () => {
    delete process.env.OPENAI_API_KEY;
    const r = await post("/api/propuesta", solicitud);
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    assert.equal(r.status, 503);
  });
});

describe("POST /api/propuesta/documento y /pdf", () => {
  const completa = [
    { id: "corporativa" },
    { id: "paginaAdicional", cantidad: 3 },
    { id: "formulario" },
  ];

  test("calcula con las tarifas del servidor e ignora precios enviados", async () => {
    const r = await post("/api/propuesta/documento", {
      ...seleccion([{ id: "corporativa", precio: 1 }, { id: "paginaAdicional", cantidad: 3, importe: 1 }, { id: "formulario" }]),
      total: 1,
    });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.total, 830); // el mismo caso del enunciado anterior
    assert.deepEqual(d.lineas.map((l) => l.importe), [600, 150, 80]);
  });

  test("modificar la selección cambia los importes", async () => {
    const d = await (await post("/api/propuesta/documento", seleccion([{ id: "landing" }, { id: "segundoIdioma" }]))).json();
    assert.equal(d.total, 450);
  });

  test("rechaza datos sin completar o servicios fuera del catálogo", async () => {
    const casos = [
      [[{ id: "formulario" }], "tipo"],
      [[{ id: "landing" }, { id: "corporativa" }], "tipo"],
      [[{ id: "landing" }, { id: "paginaAdicional" }], "cantidad"],
      [[{ id: "landing" }, { id: "paginaAdicional", cantidad: 20 }], "cantidad"],
      [[{ id: "landing" }, { id: "inventado" }], "servicios"],
      [[{ id: "landing" }, { id: "landing" }], "servicios"],
    ];
    for (const [servicios, campo] of casos) {
      const r = await post("/api/propuesta/documento", seleccion(servicios));
      assert.equal(r.status, 400);
      assert.ok((await r.json()).campos.includes(campo), campo);
    }
  });

  test("el PDF se genera y una selección incompleta no", async () => {
    const r = await post("/api/propuesta/pdf", seleccion(completa));
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "application/pdf");
    const bytes = Buffer.from(await r.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");

    assert.equal((await post("/api/propuesta/pdf", seleccion([{ id: "formulario" }]))).status, 400);
  });
});

test("GET /api/catalogo usa los mismos precios que las tarifas", async () => {
  const d = await (await fetch(`${url}/api/catalogo`)).json();
  assert.deepEqual(Object.fromEntries(d.servicios.map((s) => [s.id, s.precio])), {
    landing: 300,
    corporativa: 600,
    paginaAdicional: 50,
    formulario: 80,
    segundoIdioma: 150,
  });
});
