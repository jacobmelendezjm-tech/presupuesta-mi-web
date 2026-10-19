import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El cliente se sirve en http://localhost:5173.
// Las peticiones a /api se reenvían a la API Express (puerto 3000),
// así el navegador no necesita CORS.
// `npm run build` deja la interfaz compilada en ../public, desde donde
// la sirven Express (en local) y Vercel (en producción).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
