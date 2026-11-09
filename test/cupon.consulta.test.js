const test = require('node:test');
const assert = require('node:assert/strict');
const {
  consultarCupon
} = require('../src/services/cupon.service');
const {
  ValidationError
} = require('../src/validators/cupon.validator');

function crearRepository(cupon) {
  return {
    async obtenerPorCodigo(codigo) {
      assert.equal(codigo, 'ECLIPSE-10');
      return cupon;
    }
  };
}

const cupon = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  codigo: 'ECLIPSE-10',
  porcentaje_descuento: '10.00',
  fecha_inicio: '2026-10-01 00:00:00',
  fecha_fin: '2026-12-01 23:59:59',
  monto_minimo: '80000.50',
  estado: 'INACTIVO'
};

test('consulta por código normalizado y serializa los siete campos', async () => {
  const resultado = await consultarCupon('eclipse-10', crearRepository(cupon));

  assert.equal(resultado.status, 200);
  assert.deepEqual(resultado.body, {
    id: cupon.id,
    codigo: 'ECLIPSE-10',
    porcentaje_descuento: 10,
    fecha_inicio: '2026-10-01T00:00:00-05:00',
    fecha_fin: '2026-12-01T23:59:59-05:00',
    monto_minimo: 80000.5,
    estado: 'INACTIVO'
  });
});

test('consulta los cupones sin filtrar por estado ni vigencia', async () => {
  const futuro = {
    ...cupon,
    fecha_inicio: '2099-01-01 00:00:00',
    fecha_fin: '2099-12-31 23:59:59',
    estado: 'ACTIVO'
  };
  const resultado = await consultarCupon(
    'ECLIPSE-10',
    crearRepository(futuro)
  );

  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.estado, 'ACTIVO');
  assert.equal(resultado.body.fecha_inicio, '2099-01-01T00:00:00-05:00');
});

test('devuelve 404 para un cupón no encontrado', async () => {
  const resultado = await consultarCupon(
    'ECLIPSE-10',
    crearRepository(null)
  );

  assert.equal(resultado.status, 404);
  assert.deepEqual(resultado.body, {
    error: 'CUPON_NO_ENCONTRADO',
    mensaje: 'El cupón solicitado no existe.'
  });
});

test('rechaza códigos inválidos con CODIGO_INVALIDO', async () => {
  for (const codigo of ['AB', 'ABCDEFGHIJK', 'CODIGO CON ESPACIO', 123]) {
    await assert.rejects(
      () => consultarCupon(codigo, crearRepository(cupon)),
      (error) =>
        error instanceof ValidationError && error.code === 'CODIGO_INVALIDO'
    );
  }
});
