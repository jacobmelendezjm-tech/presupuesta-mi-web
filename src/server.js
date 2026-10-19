const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de presupuestos escuchando en http://localhost:${PORT}`);
  console.log(`Prueba el estado en http://localhost:${PORT}/api/estado`);
});
