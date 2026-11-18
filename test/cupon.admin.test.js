const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarCrearCupon,
  validarModificarCupon,
  ValidationError
} = require('../src/validators/cupon.validator');
const { crear, modificar } = require('../src/services/cupon.service');

function datosCupon() {
  return {
    codigo: 'eclipse-10',
    porcentaje_descuento: 10,
    fecha_inicio: '2026-11-01 00:00:00',
    fecha_fin: '2026-12-01 00:00:00',
    monto_minimo: 50000,
    estado: 'ACTIVO'
  };
}

test('valida y normaliza los datos de creación', () => {
  assert.deepEqual(validarCrearCupon(datosCupon()), {
    ...datosCupon(),
    codigo: 'ECLIPSE-10'
  });
});

test('rechaza rangos y estados inválidos', () => {
  assert.throws(
    () => validarCrearCupon({
      ...datosCupon(),
      porcentaje_descuento: 101
    }),
    (error) => error instanceof ValidationError &&
      error.code === 'PORCENTAJE_DESCUENTO_INVALIDO'
  );

  assert.throws(
    () => validarModificarCupon({
      ...datosCupon(),
      estado: 'BORRADO'
    }),
    (error) => error instanceof ValidationError &&
      error.code === 'ESTADO_INVALIDO'
  );
});

test('crea sin mutar la entrada y modifica por código normalizado', async () => {
  const entrada = datosCupon();
  const original = { ...entrada };
  let creado;
  let modificado;

  const resultadoCrear = await crear(entrada, {
    async crearCupon(datos) {
      creado = datos;
    }
  });

  assert.deepEqual(entrada, original);
  assert.equal(creado.codigo, 'ECLIPSE-10');
  assert.equal(resultadoCrear.codigo, 'ECLIPSE-10');

  const resultadoModificar = await modificar('eclipse-10', datosCupon(), {
    async modificarCupon(codigo, datos) {
      modificado = { codigo, datos };
      return { affectedRows: 1 };
    }
  });

  assert.equal(modificado.codigo, 'ECLIPSE-10');
  assert.equal(resultadoModificar.codigo, 'ECLIPSE-10');
});
