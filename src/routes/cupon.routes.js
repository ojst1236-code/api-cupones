const express = require('express');
const { 
  validarCupon, 
  consultarCupon,
  crear,
  desactivar
} = require('../controllers/cupon.controller');

const router = express.Router();

router.post('/validar', validarCupon);
router.get('/:codigo', consultarCupon);

router.post('/', crear);
router.patch('/:codigo/desactivar', desactivar);

module.exports = router;
