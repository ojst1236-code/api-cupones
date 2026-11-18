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


const crearCupon = async (cupon) => {
  const { codigo, porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado } = cupon;
  const query = `
    INSERT INTO cupones (codigo, porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute(query, [
    codigo, 
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    monto_minimo, 
    estado || 'ACTIVO'
  ]);
  return result;
};

const desactivarCupon = async (codigo) => {
  const [rows] = await pool.execute(
    'SELECT codigo, estado FROM cupones WHERE codigo = ? LIMIT 1',
    [codigo]
  );
  const cupon = rows[0];

  if (!cupon) {
    return null;
  }

  if (cupon.estado !== 'INACTIVO') {
    await pool.execute(
      'UPDATE cupones SET estado = ? WHERE codigo = ?',
      ['INACTIVO', codigo]
    );
  }

  return { codigo: cupon.codigo, estado: 'INACTIVO' };
};

module.exports = { obtenerPorCodigo, crearCupon, desactivarCupon };
