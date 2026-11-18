const pool = require('../config/db');

async function obtenerPorCodigo(codigo) {
  const result = await pool.query(
    `SELECT id, codigo, porcentaje_descuento,
            TO_CHAR(fecha_inicio, 'YYYY-MM-DD HH24:MI:SS') AS fecha_inicio,
            TO_CHAR(fecha_fin, 'YYYY-MM-DD HH24:MI:SS') AS fecha_fin,
            monto_minimo, estado
     FROM cupones
     WHERE codigo = $1
     LIMIT 1`,
    [codigo]
  );

  return result.rows[0] || null;
}

const crearCupon = async (cupon) => {
  const { codigo, porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado } = cupon;
  const query = `
    INSERT INTO cupones (codigo, porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await pool.query(query, [
    codigo,
    porcentaje_descuento,
    fecha_inicio,
    fecha_fin,
    monto_minimo,
    estado || 'ACTIVO'
  ]);
  return { affectedRows: result.rowCount, cupon: result.rows[0] };
};

const modificarCupon = async (codigo, cupon) => {
  const { porcentaje_descuento, fecha_inicio, fecha_fin, monto_minimo, estado } = cupon;
  const query = `
    UPDATE cupones
    SET porcentaje_descuento = COALESCE($1, porcentaje_descuento),
        fecha_inicio = COALESCE($2, fecha_inicio),
        fecha_fin = COALESCE($3, fecha_fin),
        monto_minimo = COALESCE($4, monto_minimo),
        estado = COALESCE($5, estado)
    WHERE codigo = $6
  `;
  const result = await pool.query(query, [
    porcentaje_descuento ?? null,
    fecha_inicio ?? null,
    fecha_fin ?? null,
    monto_minimo ?? null,
    estado ?? null,
    codigo
  ]);
  return { affectedRows: result.rowCount };
};

module.exports = {
  obtenerPorCodigo,
  crearCupon,
  modificarCupon
};