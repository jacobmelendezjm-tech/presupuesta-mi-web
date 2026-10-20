import { useEffect, useRef, useState } from "react";
import "./pricing.css";

// Packs: configuraciones ya preparadas para elegir más rápido.
// No tienen precio propio: el precio de cada pack lo calcula el servidor
// con POST /api/presupuesto, igual que cualquier otra configuración.
export const PACKS = [
  {
    nombre: "Esencial",
    descripcion: "Una sola página para lanzar un producto, una campaña o un evento.",
    config: { tipo: "landing", paginas: 1, formulario: false },
    caracteristicas: [
      { icono: "landing", texto: "Landing" },
      { icono: "paginaAdicional", texto: "1 página" },
      { icono: "formulario", texto: "Sin formulario" },
    ],
    idealPara: ["Lanzamientos y campañas", "Eventos y promociones", "Presentar un único producto"],
  },
  {
    nombre: "Negocio",
    descripcion: "La web completa de una empresa pequeña, con contacto directo.",
    config: { tipo: "corporativa", paginas: 5, formulario: true },
    popular: true,
    caracteristicas: [
      { icono: "corporativa", texto: "Web corporativa" },
      { icono: "paginaAdicional", texto: "5 páginas" },
      { icono: "formulario", texto: "Formulario de contacto" },
    ],
    idealPara: ["Comercios y despachos", "Inicio, servicios, equipo y contacto", "Recibir clientes desde la web"],
  },
  {
    nombre: "Empresa",
    descripcion: "Para empresas con muchos servicios que quieren contarlo todo.",
    config: { tipo: "corporativa", paginas: 12, formulario: true },
    caracteristicas: [
      { icono: "corporativa", texto: "Web corporativa" },
      { icono: "paginaAdicional", texto: "12 páginas" },
      { icono: "formulario", texto: "Formulario de contacto" },
    ],
    idealPara: ["Empresas con varios servicios", "Secciones de casos y blog", "Equipos que crecen"],
  },
];

const formatoEuros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});

// Iconos de trazo (mismo estilo que el resto de la página)
function Icono({ nombre, className }) {
  const trazos = {
    landing: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 14h8" /></>,
    corporativa: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M8 7h4M8 11h4M8 15h4" /><path d="M2 21h20" /></>,
    paginaAdicional: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 12v6M9 15h6" /></>,
    formulario: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    segundoIdioma: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    flecha: <path d="m9 6 6 6-6 6" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}

// Activa la animación de entrada cuando el bloque entra en pantalla.
function useAlEntrar(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ref]);
  return visible;
}

// Número que pasa suavemente de un valor al siguiente.
function Precio({ valor }) {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);

  useEffect(() => {
    if (valor == null) return;
    const desde = actual.current;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (desde == null || desde === valor || reducido) {
      actual.current = valor;
      setMostrado(valor);
      return;
    }
    let fotograma;
    const inicio = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / 600);
      actual.current = Math.round(desde + (valor - desde) * (1 - Math.pow(1 - p, 3)));
      setMostrado(actual.current);
      if (p < 1) fotograma = requestAnimationFrame(paso);
    };
    fotograma = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(fotograma);
  }, [valor]);

  return <span className="pack-precio-valor">{mostrado == null ? "—" : formatoEuros.format(mostrado)}</span>;
}

// Control segmentado de dos opciones con una pastilla que se desliza.
function Segmentado({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={etiqueta}>
      <span className="segmentado-pastilla" data-pos={opciones.findIndex((o) => o.valor === valor)} aria-hidden="true" />
      {opciones.map((o) => (
        <button
          key={o.etiqueta}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          className="segmentado-opcion"
          data-activo={valor === o.valor || undefined}
          onClick={() => onCambio(o.valor)}
        >
          {o.etiqueta}
          {o.nota && <span className="segmentado-nota">{o.nota}</span>}
        </button>
      ))}
    </div>
  );
}

export default function PricingSection({ onElegir, precioIdioma }) {
  const ref = useRef(null);
  const visible = useAlEntrar(ref);
  const [segundoIdioma, setSegundoIdioma] = useState(false);
  const [precios, setPrecios] = useState({}); // nombre del pack -> total del servidor
  const [error, setError] = useState(false);

  // Pide al servidor el precio de cada pack (con o sin segundo idioma).
  useEffect(() => {
    const controlador = new AbortController();
    Promise.all(
      PACKS.map((pack) =>
        fetch("/api/presupuesto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controlador.signal,
          body: JSON.stringify({ ...pack.config, segundoIdioma }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then((d) => [pack.nombre, d.total])
      )
    )
      .then((pares) => {
        setPrecios(Object.fromEntries(pares));
        setError(false);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError(true);
      });
    return () => controlador.abort();
  }, [segundoIdioma]);

  const elegir = (pack, destino) => onElegir?.({ ...pack.config, segundoIdioma }, destino);

  return (
    <div className="packs" ref={ref} data-visible={visible || undefined}>
      <div className="packs-cabecera">
        <div className="packs-entrada" style={{ "--n": 0 }}>
          <h2 className="titular">
            Packs. <span className="gris">Elegir nunca fue tan rápido.</span>
          </h2>
          <p className="entradilla">
            Tres configuraciones listas para empezar. Elige una y la cargamos en el configurador, con el mismo precio
            que calcula el servidor.
          </p>
        </div>
        <div className="packs-entrada" style={{ "--n": 1 }}>
          <Segmentado
            etiqueta="Idiomas de la web"
            valor={segundoIdioma}
            onCambio={setSegundoIdioma}
            opciones={[
              { valor: false, etiqueta: "Un idioma" },
              { valor: true, etiqueta: "Dos idiomas", nota: precioIdioma ? `+${precioIdioma}` : null },
            ]}
          />
        </div>
      </div>

      {error && <p className="packs-error">No se pudieron calcular los packs. ¿Está la API en marcha?</p>}

      <ul className="packs-rejilla">
        {PACKS.map((pack, i) => (
          <li
            key={pack.nombre}
            className="pack packs-entrada"
            style={{ "--n": 2 + i }}
            data-popular={pack.popular || undefined}
            aria-labelledby={`pack-${i}`}
          >
            <p className="pack-etiqueta">{pack.popular ? "Más elegido" : " "}</p>
            <h3 id={`pack-${i}`} className="pack-nombre">{pack.nombre}</h3>
            <p className="pack-descripcion">{pack.descripcion}</p>

            <p className="pack-precio">
              <Precio valor={precios[pack.nombre]} />
              <span className="pack-precio-nota">pago único¹</span>
            </p>

            <div className="pack-acciones">
              <button type="button" className="boton" onClick={() => elegir(pack, "desglose")}>
                Elegir
              </button>
              <button type="button" className="pack-enlace" onClick={() => elegir(pack, "configurar")}>
                Personalizar <Icono nombre="flecha" className="pack-enlace-icono" />
              </button>
            </div>

            <ul className="pack-caracteristicas">
              {pack.caracteristicas.map((c) => (
                <li key={c.texto}>
                  <Icono nombre={c.icono} className="pack-icono" />
                  {c.texto}
                </li>
              ))}
              {segundoIdioma && (
                <li className="pack-extra">
                  <Icono nombre="segundoIdioma" className="pack-icono" />
                  Segundo idioma
                </li>
              )}
            </ul>

            <div className="pack-ideal">
              <p>Ideal para</p>
              <ul>
                {pack.idealPara.map((texto) => (
                  <li key={texto}>
                    <Icono nombre="check" className="pack-check" />
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
