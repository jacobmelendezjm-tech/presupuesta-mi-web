// En local, la clave de OpenAI se lee de .env. En Vercel no existe ese archivo:
// las variables se configuran en el panel del proyecto.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables de entorno que ya existan.
}

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de presupuestos escuchando en http://localhost:${PORT}`);
  console.log(`Prueba el estado en http://localhost:${PORT}/api/estado`);
});
