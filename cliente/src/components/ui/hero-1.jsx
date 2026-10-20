import "./hero-1.css";

// Hero de portada: cuadrícula de fondo, arco luminoso en la parte inferior,
// etiqueta superior, título con degradado, subtítulo y botón de acción.
// Adaptado a JSX + CSS (el proyecto no usa TypeScript ni Tailwind).
// React 19 permite recibir `ref` como prop en componentes de función.
export function Hero({
  eyebrow = "Innovate Without Limits",
  eyebrowHref = "#",
  title,
  subtitle,
  ctaLabel = "Explore Now",
  ctaHref = "#",
  ref,
}) {
  return (
    <section id="hero" className="hero1" ref={ref}>
      {/* Cuadrícula de fondo */}
      <div className="hero1-cuadricula" aria-hidden="true" />

      {/* Arco luminoso */}
      <div className="hero1-arco" aria-hidden="true" />

      {/* Etiqueta superior */}
      {eyebrow && (
        <a href={eyebrowHref} className="hero1-eyebrow">
          {eyebrow}
          <svg className="hero1-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      )}

      {/* Título */}
      <h1 className="hero1-titulo">{title}</h1>

      {/* Subtítulo */}
      <p className="hero1-subtitulo">{subtitle}</p>

      {/* Botón de acción */}
      {ctaLabel && (
        <div className="hero1-acciones">
          <a href={ctaHref} className="hero1-boton">
            {ctaLabel}
          </a>
        </div>
      )}

      {/* Fundido inferior */}
      <div className="hero1-fundido" aria-hidden="true" />
    </section>
  );
}
