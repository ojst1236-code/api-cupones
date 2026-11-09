const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarCupon,
  datetimeLocalAInstante
} = require('../src/services/cupon.service');

const solicitud = {
  codigo: 'ECLIPSE-10',
  monto_compra: 80000,
  fecha_hora_validacion: '2026-11-03T15:00:00-05:00'
};

function conCupon(cupon) {
  return {
    async obtenerPorCodigo(codigo) {
      assert.equal(codigo, solicitud.codigo);
      return cupon;
    }
  };
}

function crearCupon(overrides = {}) {
  return {
    id: 'id',
    codigo: solicitud.codigo,
    porcentaje_descuento: '10.00',
    fecha_inicio: '2026-10-01 00:00:00',
    fecha_fin: '2026-12-01 00:00:00',
    monto_minimo: '50000.00',
    estado: 'ACTIVO',
    ...overrides
  };
}

test('convierte DATETIME local usando siempre el offset UTC-05:00', () => {
  assert.equal(
    datetimeLocalAInstante('2026-10-01 00:00:00'),
    Date.parse('2026-10-01T00:00:00-05:00')
  );
});

test('devuelve 404 y el error funcional si el cupón no existe', async () => {
  const resultado = await validarCupon(solicitud, conCupon(null));

  assert.equal(resultado.status, 404);
  assert.deepEqual(resultado.body, {
    error: 'CUPON_NO_ENCONTRADO',
    mensaje: 'El cupón solicitado no existe.'
  });
});

test('calcula el descuento consultando el cupón proporcionado por MySQL', async () => {
  const resultado = await validarCupon(solicitud, conCupon(crearCupon()));

  assert.equal(resultado.status, 200);
  assert.deepEqual(resultado.body, {
    elegible: true,
    porcentaje_descuento: 10,
    monto_compra: 80000,
    descuento_calculado: 8000,
    total_estimado: 72000,
    motivo: 'CUPON_APLICABLE'
  });
});

test('considera inclusivos los instantes inicial y final de vigencia', async () => {
  for (const fecha of [
    '2026-10-01T00:00:00-05:00',
    '2026-12-01T00:00:00-05:00'
  ]) {
    const resultado = await validarCupon(
      { ...solicitud, fecha_hora_validacion: fecha },
      conCupon(crearCupon())
    );
    assert.equal(resultado.body.elegible, true);
  }
});

test('rechaza cupones inactivos y fechas fuera de vigencia', async () => {
  const inactivo = await validarCupon(
    solicitud,
    conCupon(crearCupon({ estado: 'INACTIVO' }))
  );
  assert.equal(inactivo.status, 200);
  assert.equal(inactivo.body.motivo, 'CUPON_INACTIVO');

  const vencido = await validarCupon(
    { ...solicitud, fecha_hora_validacion: '2026-12-01T00:00:01-05:00' },
    conCupon(crearCupon())
  );
  assert.equal(vencido.body.motivo, 'CUPON_FUERA_DE_VIGENCIA');
});

test('rechaza monto menor al mínimo', async () => {
  const resultado = await validarCupon(
    { ...solicitud, monto_compra: 49999 },
    conCupon(crearCupon())
  );

  assert.equal(resultado.body.elegible, false);
  assert.equal(resultado.body.descuento_calculado, 0);
  assert.equal(resultado.body.motivo, 'MONTO_MINIMO_NO_CUMPLIDO');
});

test('redondea el descuento con ROUND_HALF_UP antes de restarlo', async () => {
  const resultado = await validarCupon(
    { ...solicitud, monto_compra: 1.05 },
    conCupon(
      crearCupon({
        porcentaje_descuento: '10.00',
        monto_minimo: '1.00'
      })
    )
  );

  assert.equal(resultado.body.descuento_calculado, 0.11);
  assert.equal(resultado.body.total_estimado, 0.94);
});
