const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarCrearCupon,
  ValidationError
} = require('../src/validators/cupon.validator');
const { crear, desactivar } = require('../src/services/cupon.service');

function datosCupon() {
  return {
    codigo: 'eclipse-10',
    porcentaje_descuento: 10,
    fecha_inicio: '2026-10-01T00:00:00-05:00',
    fecha_fin: '2026-12-31T23:59:59-05:00',
    monto_minimo: 50000
  };
}

test('valida los datos de creación y asigna estado ACTIVO', () => {
  assert.deepEqual(validarCrearCupon(datosCupon()), {
    ...datosCupon(),
    codigo: 'ECLIPSE-10',
    estado: 'ACTIVO'
  });
});

test('aplica los límites del porcentaje y exige una vigencia creciente', () => {
  assert.equal(
    validarCrearCupon({
      ...datosCupon(),
      porcentaje_descuento: 70
    }).porcentaje_descuento,
    70
  );

  for (const porcentaje of [0, 71]) {
    assert.throws(
      () => validarCrearCupon({ ...datosCupon(), porcentaje_descuento: porcentaje }),
      (error) =>
        error instanceof ValidationError &&
        error.code === 'PORCENTAJE_INVALIDO'
    );
  }

  for (const [fecha_inicio, fecha_fin] of [
    [datosCupon().fecha_inicio, datosCupon().fecha_inicio],
    [datosCupon().fecha_fin, datosCupon().fecha_inicio]
  ]) {
    assert.throws(
      () => validarCrearCupon({ ...datosCupon(), fecha_inicio, fecha_fin }),
      (error) =>
        error instanceof ValidationError && error.code === 'VIGENCIA_INVALIDA'
    );
  }
});

test('crea el cupón con ID público y guarda fechas en UTC-05:00', async () => {
  const entrada = datosCupon();
  const original = { ...entrada };
  let guardado;

  const resultado = await crear(entrada, {
    async crearCupon(datos) {
      guardado = datos;
      return { insertId: 1 };
    }
  });

  assert.deepEqual(entrada, original);
  assert.equal(guardado.codigo, 'ECLIPSE-10');
  assert.equal(guardado.fecha_inicio, '2026-10-01 00:00:00');
  assert.equal(guardado.fecha_fin, '2026-12-31 23:59:59');
  assert.equal(guardado.estado, 'ACTIVO');
  assert.deepEqual(resultado, {
    id: 'CUP-0001',
    codigo: 'ECLIPSE-10',
    porcentaje_descuento: 10,
    fecha_inicio: '2026-10-01T00:00:00-05:00',
    fecha_fin: '2026-12-31T23:59:59-05:00',
    monto_minimo: 50000,
    estado: 'ACTIVO'
  });
});

test('desactivar es idempotente y normaliza el código', async () => {
  let codigoConsultado;
  const resultado = await desactivar('eclipse-10', {
    async desactivarCupon(codigo) {
      codigoConsultado = codigo;
      return { codigo, estado: 'INACTIVO' };
    }
  });

  assert.equal(codigoConsultado, 'ECLIPSE-10');
  assert.deepEqual(resultado, {
    status: 200,
    body: {
      codigo: 'ECLIPSE-10',
      estado: 'INACTIVO',
      mensaje: 'Cupón desactivado'
    }
  });
});

test('informa cuando se intenta desactivar un código inexistente', async () => {
  const resultado = await desactivar('eclipse-10', {
    async desactivarCupon() {
      return null;
    }
  });

  assert.equal(resultado.status, 404);
  assert.equal(resultado.body.error, 'CUPON_NO_ENCONTRADO');
});
