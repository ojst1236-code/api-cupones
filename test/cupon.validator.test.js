const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarEntrada,
  fechaIsoValida,
  ValidationError
} = require('../src/validators/cupon.validator');

test('normaliza un código válido y conserva los otros valores', () => {
  const entrada = validarEntrada({
    codigo: 'Eclipse-10',
    monto_compra: 80000,
    fecha_hora_validacion: '2026-11-03T15:00:00-05:00'
  });

  assert.deepEqual(entrada, {
    codigo: 'ECLIPSE-10',
    montoCompra: 80000,
    fechaHoraValidacion: '2026-11-03T15:00:00-05:00'
  });
});

test('rechaza cuerpo ausente, nulo, arrays y valores primitivos', () => {
  for (const body of [undefined, null, [], 'texto', 1, true]) {
    assert.throws(
      () => validarEntrada(body),
      (error) =>
        error instanceof ValidationError && error.code === 'CUERPO_INVALIDO'
    );
  }
});

test('rechaza códigos fuera del formato admitido sin convertir valores', () => {
  for (const codigo of [
    'AB',
    'ABCDEFGHIJK',
    'CODIGO CON ESPACIO',
    123,
    null,
    {}
  ]) {
    assert.throws(
      () =>
        validarEntrada({
          codigo,
          monto_compra: 1,
          fecha_hora_validacion: '2026-11-03T15:00:00-05:00'
        }),
      (error) =>
        error instanceof ValidationError && error.code === 'CODIGO_INVALIDO'
    );
  }
});

test('acepta solo montos JSON numéricos, finitos y positivos', () => {
  for (const monto of [0, -1, NaN, Infinity, '80000', true, null]) {
    assert.throws(
      () =>
        validarEntrada({
          codigo: 'ABC',
          monto_compra: monto,
          fecha_hora_validacion: '2026-11-03T15:00:00-05:00'
        }),
      (error) =>
        error instanceof ValidationError &&
        error.code === 'MONTO_COMPRA_INVALIDO'
    );
  }
});

test('exige fecha ISO válida y zona horaria explícita', () => {
  for (const fecha of [
    '2026-11-03T15:00:00',
    '2026-02-30T15:00:00Z',
    '2026-11-03T15:00:00+25:00',
    'no es fecha',
    null
  ]) {
    assert.equal(fechaIsoValida(fecha), false);
  }
});
