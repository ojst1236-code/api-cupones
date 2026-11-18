const test = require('node:test');
const assert = require('node:assert/strict');
const adminAuth = require('../src/middleware/admin-auth');

const originalApiKey = process.env.ADMIN_API_KEY;

function ejecutarMiddleware(authorization) {
  const resultado = {
    status: null,
    body: null,
    continuado: false
  };
  const req = {
    get(header) {
      assert.equal(header, 'authorization');
      return authorization;
    }
  };
  const res = {
    status(status) {
      resultado.status = status;
      return this;
    },
    json(body) {
      resultado.body = body;
      return this;
    }
  };

  adminAuth(req, res, () => {
    resultado.continuado = true;
  });
  return resultado;
}

test('rechaza solicitudes si la clave no está configurada', () => {
  delete process.env.ADMIN_API_KEY;
  const resultado = ejecutarMiddleware('Bearer clave');

  assert.equal(resultado.status, 503);
  assert.equal(resultado.body.error, 'AUTENTICACION_NO_CONFIGURADA');
  assert.equal(resultado.continuado, false);
});

test('requiere una clave de administrador en formato Bearer', () => {
  process.env.ADMIN_API_KEY = 'a'.repeat(32);

  const sinClave = ejecutarMiddleware(undefined);
  const incorrecta = ejecutarMiddleware(`Bearer ${'b'.repeat(32)}`);

  assert.equal(sinClave.status, 401);
  assert.equal(incorrecta.status, 401);
  assert.equal(sinClave.continuado, false);
  assert.equal(incorrecta.continuado, false);
});

test('permite continuar con la clave correcta', () => {
  const clave = 'a'.repeat(32);
  process.env.ADMIN_API_KEY = clave;

  const resultado = ejecutarMiddleware(`Bearer ${clave}`);

  assert.equal(resultado.continuado, true);
  assert.equal(resultado.status, null);
});

test.after(() => {
  if (originalApiKey === undefined) {
    delete process.env.ADMIN_API_KEY;
  } else {
    process.env.ADMIN_API_KEY = originalApiKey;
  }
});
