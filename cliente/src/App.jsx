import { useEffect, useState } from "react";

const euros = (cantidad) =>
  cantidad.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const TIPOS = [
  { valor: "landing", titulo: "Landing", texto: "Una página para presentar un producto o campaña." },
  { valor: "corporativa", titulo: "Corporativa", texto: "La web completa de una empresa o marca." },
];

export default function App() {
  // Datos del formulario. "paginas" se guarda como texto para poder
  // enviar cualquier valor y ver cómo responde la validación del servidor.
  const [tipo, setTipo] = useState("corporativa");
  const [paginas, setPaginas] = useState("4");
  const [formulario, setFormulario] = useState(true);
  const [segundoIdioma, setSegundoIdioma] = useState(false);

  const [tarifas, setTarifas] = useState(null);
  const [presupuesto, setPresupuesto] = useState(null);
  const [errores, setErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  // Al cargar, consultamos las tarifas para mostrarlas (solo informativo:
  // el precio final siempre lo calcula el servidor).
  useEffect(() => {
    fetch("/api/tarifas")
      .then((r) => r.json())
      .then((datos) =>
        setTarifas(Object.fromEntries(datos.tarifas.map((t) => [t.concepto, t.precio])))
      )
      .catch(() => setErrores(["No se pudo conectar con la API. ¿Está en marcha con npm start?"]));
  }, []);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErrores([]);
    setPresupuesto(null);

    try {
      const respuesta = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          paginas: paginas === "" ? null : Number(paginas),
          formulario,
          segundoIdioma,
        }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setPresupuesto(datos);
      } else {
        setErrores(datos.detalles?.length ? datos.detalles : [datos.error]);
      }
    } catch {
      setErrores(["No se pudo conectar con la API. ¿Está en marcha con npm start?"]);
    } finally {
      setEnviando(false);
    }
  }

  const precio = (concepto) => (tarifas ? euros(tarifas[concepto]) : "…");

  return (
    <main className="pagina">
      <header className="cabecera">
        <span className="etiqueta">Agencia · Calculadora</span>
        <h1>Presupuesta mi web</h1>
        <p>Elige el tipo de web, las páginas y los extras. El servidor valida los datos y calcula el precio.</p>
      </header>

      <div className="rejilla">
        <form className="tarjeta" onSubmit={enviar} noValidate>
          <fieldset>
            <legend>Tipo de web</legend>
            <div className="tipos">
              {TIPOS.map((t) => (
                <label key={t.valor} className={`tipo ${tipo === t.valor ? "activo" : ""}`}>
                  <input
                    type="radio"
                    name="tipo"
                    value={t.valor}
                    checked={tipo === t.valor}
                    onChange={() => setTipo(t.valor)}
                  />
                  <strong>{t.titulo}</strong>
                  <span>{t.texto}</span>
                  <em>desde {precio(t.valor)}</em>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Número de páginas</legend>
            <div className="paginas">
              <input
                type="range"
                min="1"
                max="20"
                value={Number(paginas) >= 1 && Number(paginas) <= 20 ? paginas : 1}
                onChange={(e) => setPaginas(e.target.value)}
                aria-label="Número de páginas (deslizador)"
              />
              <input
                type="number"
                className="numero"
                value={paginas}
                onChange={(e) => setPaginas(e.target.value)}
                aria-label="Número de páginas"
              />
            </div>
            <small>Entre 1 y 20. La primera está incluida; cada adicional cuesta {precio("paginaAdicional")}.</small>
          </fieldset>

          <fieldset>
            <legend>Extras</legend>
            <label className="interruptor">
              <input type="checkbox" checked={formulario} onChange={(e) => setFormulario(e.target.checked)} />
              <span className="pista" aria-hidden="true" />
              Formulario de contacto <em>+{precio("formulario")}</em>
            </label>
            <label className="interruptor">
              <input type="checkbox" checked={segundoIdioma} onChange={(e) => setSegundoIdioma(e.target.checked)} />
              <span className="pista" aria-hidden="true" />
              Segundo idioma <em>+{precio("segundoIdioma")}</em>
            </label>
          </fieldset>

          <button type="submit" disabled={enviando}>
            {enviando ? "Calculando…" : "Calcular presupuesto"}
          </button>
        </form>

        <section className="tarjeta resultado" aria-live="polite">
          {errores.length > 0 && (
            <div className="errores" role="alert">
              <h2>Revisa la solicitud</h2>
              <ul>
                {errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {presupuesto && (
            <>
              <h2>Tu presupuesto</h2>
              <dl className="desglose">
                <div>
                  <dt>Precio base</dt>
                  <dd>{euros(presupuesto.base)}</dd>
                </div>
                <div>
                  <dt>Páginas adicionales</dt>
                  <dd>{euros(presupuesto.paginasAdicionales)}</dd>
                </div>
                <div>
                  <dt>Formulario de contacto</dt>
                  <dd>{euros(presupuesto.formulario)}</dd>
                </div>
                <div>
                  <dt>Segundo idioma</dt>
                  <dd>{euros(presupuesto.segundoIdioma)}</dd>
                </div>
                <div className="total">
                  <dt>Total</dt>
                  <dd>{euros(presupuesto.total)}</dd>
                </div>
              </dl>
              <small>Calculado por el servidor · {presupuesto.moneda} · sin impuestos</small>
            </>
          )}

          {!presupuesto && errores.length === 0 && (
            <div className="vacio">
              <span aria-hidden="true">🧮</span>
              <p>Rellena el formulario y pulsa <strong>Calcular presupuesto</strong>.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
