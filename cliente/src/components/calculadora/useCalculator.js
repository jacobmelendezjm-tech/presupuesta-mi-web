import { useCallback, useEffect, useMemo, useState } from "react";

const CABECERAS = { "Content-Type": "application/json" };
const ERROR_RED = "No se pudo conectar con el servidor. Inténtalo de nuevo.";

// Describe qué ha cambiado entre dos selecciones, para que la interfaz marque
// la tarjeta (o el módulo de la escena 3D) que acaba de tocar el usuario.
// Si cambian varias cosas a la vez (un pack), manda el tipo de proyecto.
function describirCambio(antes, ahora, catalogo) {
  const accionDe = (previo, nuevo) => (!nuevo ? "quitar" : previo ? "cambiar" : "anadir");
  if (antes.tipo !== ahora.tipo) {
    return { id: ahora.tipo ?? antes.tipo, grupo: "tipo", accion: accionDe(antes.tipo, ahora.tipo) };
  }
  if (antes.paginas !== ahora.paginas) {
    return { id: "paginas", grupo: "paginas", accion: ahora.paginas > antes.paginas ? "anadir" : "quitar" };
  }
  const grupoDe = (id) => catalogo?.opciones.find((o) => o.id === id)?.grupo ?? null;
  const anadidas = ahora.opciones.filter((id) => !antes.opciones.includes(id));
  const quitadas = antes.opciones.filter((id) => !ahora.opciones.includes(id));
  // Cambiar de diseño añade uno y quita otro: cuenta como «cambiar» el nuevo.
  if (anadidas.length > 0) return { id: anadidas[0], grupo: grupoDe(anadidas[0]), accion: quitadas.length > 0 ? "cambiar" : "anadir" };
  if (quitadas.length > 0) return { id: quitadas[0], grupo: grupoDe(quitadas[0]), accion: "quitar" };
  if (antes.plan !== ahora.plan) {
    return { id: ahora.plan ?? antes.plan, grupo: "plan", accion: accionDe(antes.plan, ahora.plan) };
  }
  return null;
}

// Estado de la calculadora. Aquí solo se guarda QUÉ se ha elegido: el importe
// lo calcula siempre el servidor con POST /api/estimacion.
export function useCalculator() {
  const [catalogo, setCatalogo] = useState(null);
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState(null);
  const [paginas, setPaginas] = useState(1);
  const [opciones, setOpciones] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [estimacion, setEstimacion] = useState(null);
  const [error, setError] = useState(null);
  const [intercambio, setIntercambio] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();
    fetch("/api/estimacion/catalogo", { signal: controlador.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((datos) => {
        setCatalogo(datos);
        setError(null);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError(ERROR_RED);
      });
    return () => controlador.abort();
  }, [intentoCatalogo]);

  const recargarCatalogo = useCallback(() => setIntentoCatalogo((n) => n + 1), []);

  const solicitud = useMemo(() => ({ tipo, paginas, opciones, plan: planId }), [tipo, paginas, opciones, planId]);

  // Último cambio de la selección. Se calcula durante el render (patrón «ajustar
  // estado cuando cambia otro»), así llega en el mismo fotograma que `calculando`.
  const [solicitudPrevia, setSolicitudPrevia] = useState(solicitud);
  const [ultimoCambio, setUltimoCambio] = useState(null);
  if (solicitudPrevia !== solicitud) {
    setSolicitudPrevia(solicitud);
    const cambio = describirCambio(solicitudPrevia, solicitud, catalogo);
    if (cambio) setUltimoCambio({ ...cambio, marca: (ultimoCambio?.marca ?? 0) + 1 });
  }

  // `calculando` es verdadero desde que cambia la selección (incluida la espera
  // de 40 ms) hasta que el servidor responde a ESA selección, con éxito o error.
  const [respondida, setRespondida] = useState(null);
  const [intento, setIntento] = useState(0);
  const calculando = Boolean(tipo) && respondida !== solicitud;

  // Tras un error, vuelve a pedir la misma selección (y vuelve a «calcular»).
  const reintentar = useCallback(() => {
    setRespondida(null);
    setIntento((n) => n + 1);
  }, []);

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
        if (controlador.signal.aborted) return;
        setIntercambio({ solicitud, estado: respuesta.status, datos });
        if (respuesta.ok) {
          setEstimacion(datos);
          setError(null);
        } else {
          setError(datos.detalles?.join(" ") ?? datos.error);
        }
      } catch (e) {
        if (e.name === "AbortError" || controlador.signal.aborted) return;
        setError(ERROR_RED);
      }
      setRespondida(solicitud);
    }, 40);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [tipo, solicitud, intento]);

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
    recargarCatalogo,
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
    calculando,
    ultimoCambio,
    reintentar,
    error,
    intercambio,
    cargarPack,
    descargarPdf,
  };
}
