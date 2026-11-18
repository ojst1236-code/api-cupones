const test = require('node:test');
const assert = require('node:assert/strict');

test('responde la ruta de salud usando la configuración MySQL de Railway', async (t) => {
  process.env.MYSQLHOST = 'localhost';
  process.env.MYSQLPORT = '3306';
  process.env.MYSQLUSER = 'test';
  process.env.MYSQLPASSWORD = 'test';
  process.env.MYSQLDATABASE = 'api_cupones';
  process.env.ADMIN_API_KEY = 'test-key-with-at-least-32-characters';

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
