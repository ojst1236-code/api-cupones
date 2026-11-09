const express = require('express');
const {
  validarCupon,
  consultarCupon
} = require('../controllers/cupon.controller');

const router = express.Router();

router.post('/validar', validarCupon);
router.get('/:codigo', consultarCupon);

module.exports = router;
