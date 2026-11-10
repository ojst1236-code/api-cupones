const express = require('express');
const { 
  validarCupon, 
  consultarCupon,
  crear,
  modificar
} = require('../controllers/cupon.controller');

const router = express.Router();

router.post('/validar', validarCupon);
router.get('/:codigo', consultarCupon);

router.post('/', crear);
router.put('/:codigo', modificar);

module.exports = router;
