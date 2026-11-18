const { createHash, timingSafeEqual } = require('node:crypto');

function adminAuth(req, res, next) {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (typeof expectedKey !== 'string' || expectedKey.length < 32) {
    return res.status(503).json({
      error: 'AUTENTICACION_NO_CONFIGURADA',
      mensaje: 'La clave de administrador no está configurada correctamente.'
    });
  }

  const authorization = req.get('authorization');
  const match = /^Bearer ([^\s]+)$/.exec(authorization || '');
  if (!match) {
    return res.status(401).json({
      error: 'NO_AUTORIZADO',
      mensaje: 'Se requiere una clave de administrador válida.'
    });
  }

  const expectedHash = createHash('sha256').update(expectedKey).digest();
  const providedHash = createHash('sha256').update(match[1]).digest();
  if (!timingSafeEqual(expectedHash, providedHash)) {
    return res.status(401).json({
      error: 'NO_AUTORIZADO',
      mensaje: 'Se requiere una clave de administrador válida.'
    });
  }

  return next();
}

module.exports = adminAuth;
