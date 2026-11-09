import { useCallback, useEffect, useMemo, useState } from "react";

const CABECERAS = { "Content-Type": "application/json" };
const ERROR_RED = "No se pudo conectar con el servidor. Inténtalo de nuevo.";

// Estado de la calculadora. Aquí solo se guarda QUÉ se ha elegido: el importe
// lo calcula siempre el servidor con POST /api/estimacion.
export function useCalculator() {
  const [catalogo, setCatalogo] = useState(null);
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState(null);
  const [paginas, setPaginas] = useState(1);
  const [opciones, setOpciones] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [estimacion, setEstimacion] = useState(null);
  const [error, setError] = useState(null);
  const [intercambio, setIntercambio] = useState(null);

  useEffect(() => {
    fetch("/api/estimacion/catalogo")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setCatalogo)
      .catch(() => setError(ERROR_RED));
  }, []);

  const solicitud = useMemo(() => ({ tipo, paginas, opciones, plan: planId }), [tipo, paginas, opciones, planId]);

  useEffect(() => {
    if (!tipo) {
      setEstimacion(null);
      return undefined;
    }
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const respuesta = await fetch("/api/estimacion", {
          method: "POST",
          headers: CABECERAS,
          signal: controlador.signal,
          body: JSON.stringify(solicitud),
        });
        const datos = await respuesta.json();
        setIntercambio({ solicitud, estado: respuesta.status, datos });
        if (respuesta.ok) {
          setEstimacion(datos);
          setError(null);
        } else {
          setError(datos.detalles?.join(" ") ?? datos.error);
        }
      } catch (e) {
        if (e.name !== "AbortError") setError(ERROR_RED);
      }
    }, 150);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [tipo, solicitud]);

  // El diseño es de elección única; el resto de opciones se suman.
  const alternarOpcion = useCallback(
    (id) => {
      const grupo = catalogo?.opciones.find((o) => o.id === id)?.grupo;
      setOpciones((actuales) => {
        if (actuales.includes(id)) return actuales.filter((o) => o !== id);
        if (grupo !== "diseno") return [...actuales, id];
        const diseno = new Set(catalogo.opciones.filter((o) => o.grupo === "diseno").map((o) => o.id));
        return [...actuales.filter((o) => !diseno.has(o)), id];
      });
    },
    [catalogo]
  );

  // Un pack carga su configuración y se revisa desde el primer paso.
  const cargarPack = useCallback((config) => {
    setTipo(config.tipo);
    setPaginas(config.paginas);
    setOpciones([config.formulario && "formulario", config.segundoIdioma && "segundoIdioma"].filter(Boolean));
    setPaso(1);
  }, []);

  const descargarPdf = useCallback(
    async (cliente) => {
      const respuesta = await fetch("/api/estimacion/pdf", {
        method: "POST",
        headers: CABECERAS,
        body: JSON.stringify({ ...solicitud, cliente }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.detalles?.join(" ") ?? "No se pudo generar el PDF.");
      }
      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "propuesta.pdf";
      enlace.click();
      URL.revokeObjectURL(url);
    },
    [solicitud]
  );

  const plan = catalogo?.planes.find((p) => p.id === planId) ?? null;

  return {
    catalogo,
    paso,
    setPaso,
    tipo,
    setTipo,
    paginas,
    setPaginas,
    opciones,
    alternarOpcion,
    planId,
    setPlanId,
    plan,
    estimacion,
    error,
    intercambio,
    cargarPack,
    descargarPdf,
  };
}
