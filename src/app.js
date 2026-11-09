require('dotenv').config();

const express = require('express');
const pool = require('./config/db');
const cuponRoutes = require('./routes/cupon.routes');

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT || 3000);

// Ruta de prueba: comprueba que el servidor HTTP responde.
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API de Gestión de Cupones funcionando'
  });
});

app.use('/cupones', cuponRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'CUERPO_INVALIDO',
      mensaje: 'El cuerpo de la solicitud debe contener JSON válido.'
    });
  }

  console.error('Error inesperado al procesar la solicitud:', error);
  return res.status(500).json({
    error: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error interno al procesar la solicitud.'
  });
});

// Inicia el servidor solo si puede consultar MySQL.
async function iniciarServidor() {
  try {
    await pool.execute('SELECT 1');

    console.log('Conexión a MySQL correcta.');

    const servidor = app.listen(PORT, () => {
      console.log(`API disponible en http://localhost:${PORT}`);
    });

    servidor.on('error', async (error) => {
      console.error('No se pudo iniciar el servidor:', error.message);

      await pool.end();
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('No se pudo conectar con MySQL:', error.code);
    console.error(error.message);

    await pool.end();
    process.exitCode = 1;
  }
}

if (require.main === module) {
  iniciarServidor();
}

module.exports = app;