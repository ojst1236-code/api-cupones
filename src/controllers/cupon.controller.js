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

const crear = async (req, res) => {
  try {
    const resultado = await cuponService.crear(req.body);
    return res.status(201).json(resultado);
  } catch (error) {
    if (error.status === 400 && typeof error.code === 'string') {
      return res.status(400).json({
        error: error.code,
        mensaje: error.message
      });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'CODIGO_DUPLICADO',
        mensaje: 'El código del cupón ya existe en el sistema.'
      });
    }
    console.error(error);
    return res.status(500).json({
      error: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error interno al crear el cupón.'
    });
  }
};

const desactivar = async (req, res) => {
  try {
    const { codigo } = req.params;
    const resultado = await cuponService.desactivar(codigo);
    return res.status(resultado.status).json(resultado.body);
  } catch (error) {
    if (error.status === 400 && typeof error.code === 'string') {
      return res.status(400).json({
        error: error.code,
        mensaje: error.message
      });
    }
    console.error('Error inesperado al desactivar el cupón:', error);
    return res.status(500).json({
      error: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error interno al desactivar el cupón.'
    });
  }
};

module.exports = {
  validarCupon,
  consultarCupon,
  crear,
  desactivar
};
