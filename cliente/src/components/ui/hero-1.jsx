import "./hero-1.css";

// Portada estilo HUD: etiqueta, título, Reactor ARC dibujado con CSS, lecturas
// a los lados, subtítulo y botón de acción.
// React 19 permite recibir `ref` como prop en componentes de función.
function Lecturas({ datos, className = "" }) {
  return (
    <dl className={`hero1-lecturas ${className}`}>
      {datos.map((d) => (
        <div key={d.etiqueta}>
          <dt>{d.etiqueta}</dt>
          <dd>{d.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Hero({ eyebrow, eyebrowHref = "#", title, subtitle, ctaLabel, ctaHref = "#", lecturas = [], ref }) {
  const mitad = Math.ceil(lecturas.length / 2);

  return (
    <section id="hero" className="hero1" ref={ref}>
      {eyebrow && (
        <a href={eyebrowHref} className="hero1-eyebrow">
          {eyebrow}
          <svg className="hero1-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      )}

      <h1 className="hero1-titulo">{title}</h1>

      <div className="hero1-centro">
        <Lecturas datos={lecturas.slice(0, mitad)} />

        <div className="reactor" aria-hidden="true">
          <span className="reactor-marcas" />
          <span className="reactor-bobinas" />
          <span className="reactor-oro" />
          <span className="reactor-triangulo" />
          <span className="reactor-nucleo" />
        </div>

        <Lecturas datos={lecturas.slice(mitad)} className="hero1-lecturas-derecha" />
      </div>

      <p className="hero1-subtitulo">{subtitle}</p>

      {ctaLabel && (
        <a href={ctaHref} className="hero1-boton">
          {ctaLabel}
        </a>
      )}
    </section>
  );
}
