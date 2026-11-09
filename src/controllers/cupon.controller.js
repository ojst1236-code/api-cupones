const cuponService = require('../services/cupon.service');

async function validarCupon(req, res) {
  try {
    const resultado = await cuponService.validarCupon(req.body);
    return res.status(resultado.status).json(resultado.body);
  } catch (error) {
    if (error.status === 400 && typeof error.code === 'string') {
      return res.status(400).json({
        error: error.code,
        mensaje: error.message
      });
    }

    console.error('Error inesperado al validar el cupón:', error);
    return res.status(500).json({
      error: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error interno al validar el cupón.'
    });
  }
}

async function consultarCupon(req, res) {
  try {
    const resultado = await cuponService.consultarCupon(req.params.codigo);
    return res.status(resultado.status).json(resultado.body);
  } catch (error) {
    if (error.status === 400 && typeof error.code === 'string') {
      return res.status(400).json({
        error: error.code,
        mensaje: error.message
      });
    }

    console.error('Error inesperado al consultar el cupón:', error);
    return res.status(500).json({
      error: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error interno al consultar el cupón.'
    });
  }
}

module.exports = { validarCupon, consultarCupon };
