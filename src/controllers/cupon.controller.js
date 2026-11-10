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
    res.status(201).json(resultado);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') { 
        return res.status(400).json({ error: 'El código del cupón ya existe en el sistema' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al crear el cupón' });
  }
};

const modificar = async (req, res) => {
  try {
    const { codigo } = req.params;
    const resultado = await cuponService.modificar(codigo, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    if (error.message === 'CUPON_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'No se encontró un cupón con ese código' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al modificar el cupón' });
  }
};

module.exports = { validar, consultar, crear, modificar };
