import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function obtenerConsulta() {
  return window.matchMedia(CONSULTA);
}

function suscribir(aviso) {
  const consulta = obtenerConsulta();
  consulta.addEventListener("change", aviso);
  return () => consulta.removeEventListener("change", aviso);
}

export function useReducirMovimiento() {
  return useSyncExternalStore(
    suscribir,
    () => obtenerConsulta().matches,
    () => false
  );
}