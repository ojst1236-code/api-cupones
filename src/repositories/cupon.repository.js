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

const modificarCupon = async (codigo, datos) => {
  const { porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado } = datos;
  const query = `
    UPDATE cupones
    SET porcentaje_descuento = ?, fecha_inicio = ?, fecha_fin = ?, monto_minimo = ?, estado = ?
    WHERE codigo = ?
  `;
  const [result] = await pool.execute(query, [
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    monto_minimo, 
    estado, 
    codigo
  ]);
  return result;
};

module.exports = { obtenerPorCodigo, crearCupon, modificarCupon };
