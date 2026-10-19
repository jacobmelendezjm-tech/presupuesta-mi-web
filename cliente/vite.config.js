import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El cliente se sirve en http://localhost:5173.
// Las peticiones a /api se reenvían a la API Express (puerto 3000),
// así el navegador no necesita CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
