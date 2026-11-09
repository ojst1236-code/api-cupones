const pool = require('../config/db');

async function obtenerPorCodigo(codigo) {
  const [rows] = await pool.execute(
    `SELECT id, codigo, porcentaje_descuento,
            DATE_FORMAT(fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fecha_inicio,
            DATE_FORMAT(fecha_fin, '%Y-%m-%d %H:%i:%s') AS fecha_fin,
            monto_minimo, estado
     FROM cupones
     WHERE codigo = ?
     LIMIT 1`,
    [codigo]
  );

  return rows[0] || null;
}

module.exports = { obtenerPorCodigo };
