const test = require('node:test');
const assert = require('node:assert/strict');

test('responde la ruta de salud usando la configuración MySQL de Railway', async (t) => {
  process.env.MYSQLHOST = 'localhost';
  process.env.MYSQLPORT = '3306';
  process.env.MYSQLUSER = 'test';
  process.env.MYSQLPASSWORD = 'test';
  process.env.MYSQLDATABASE = 'api_cupones';

  const app = require('../src/app');
  const servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => servidor.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    servidor.close((error) => error ? reject(error) : resolve());
  }));

  const { port } = servidor.address();
  const respuesta = await fetch(`http://127.0.0.1:${port}/`);

  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), {
    mensaje: 'API de Gestión de Cupones funcionando'
  });
});

test('crea y desactiva cupones en las rutas especificadas sin autenticación', async (t) => {
  const app = require('../src/app');
  const repository = require('../src/repositories/cupon.repository');
  const crearCuponOriginal = repository.crearCupon;
  const desactivarCuponOriginal = repository.desactivarCupon;
  repository.crearCupon = async () => ({ insertId: 1 });
  repository.desactivarCupon = async (codigo) => ({
    codigo,
    estado: 'INACTIVO'
  });

  const servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => servidor.once('listening', resolve));
  t.after(async () => {
    repository.crearCupon = crearCuponOriginal;
    repository.desactivarCupon = desactivarCuponOriginal;
    await new Promise((resolve, reject) => {
      servidor.close((error) => error ? reject(error) : resolve());
    });
  });

  const baseUrl = `http://127.0.0.1:${servidor.address().port}/cupones`;
  const creada = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codigo: 'eclipse-10',
      porcentaje_descuento: 10,
      fecha_inicio: '2026-10-01T00:00:00-05:00',
      fecha_fin: '2026-12-31T23:59:59-05:00',
      monto_minimo: 50000
    })
  });

  assert.equal(creada.status, 201);
  assert.deepEqual(await creada.json(), {
    id: 'CUP-0001',
    codigo: 'ECLIPSE-10',
    porcentaje_descuento: 10,
    fecha_inicio: '2026-10-01T00:00:00-05:00',
    fecha_fin: '2026-12-31T23:59:59-05:00',
    monto_minimo: 50000,
    estado: 'ACTIVO'
  });

  const desactivada = await fetch(`${baseUrl}/eclipse-10/desactivar`, {
    method: 'PATCH'
  });

  assert.equal(desactivada.status, 200);
  assert.deepEqual(await desactivada.json(), {
    codigo: 'ECLIPSE-10',
    estado: 'INACTIVO',
    mensaje: 'Cupón desactivado'
  });
});
