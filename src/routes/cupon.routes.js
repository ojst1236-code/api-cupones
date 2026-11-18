const express = require('express');
const { 
  validar, 
  consultar,
  crear,
  modificar
} = require('../controllers/cupon.controller');

const router = express.Router();

router.post('/validar', validar);
router.get('/:codigo', consultar);

router.post('/', crear);
router.put('/:codigo', modificar);

module.exports = router;