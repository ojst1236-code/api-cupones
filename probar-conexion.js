const pool = require('./src/config/db');

async function probarConexion() {
  try {
    const [datos] = await pool.execute(
      'SELECT DATABASE() AS base_actual'
    );

    console.log('Conexión correcta:', datos[0].base_actual);

    const [cupones] = await pool.execute(`
      SELECT codigo, porcentaje_descuento, estado
      FROM cupones
      ORDER BY codigo
    `);

    console.table(cupones);
  } catch (error) {
    console.error('Error de conexión:', error.code);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarConexion();