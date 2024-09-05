const express = require('express');
const app = express();

// Ruta básica
app.get('/', (req, res) => {
  res.send('¡Hola, Mundo!');
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
