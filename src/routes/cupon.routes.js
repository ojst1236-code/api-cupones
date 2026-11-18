const express = require('express');
const { 
  validarCupon, 
  consultarCupon,
  crear,
  modificar
} = require('../controllers/cupon.controller');
const adminAuth = require('../middleware/admin-auth');

const router = express.Router();

router.post('/validar', validarCupon);
router.get('/:codigo', consultarCupon);

router.post('/', adminAuth, crear);
router.put('/:codigo', adminAuth, modificar);

module.exports = router;
