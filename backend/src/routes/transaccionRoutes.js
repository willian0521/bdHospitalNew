import express from 'express';
import transaccionController from '../controllers/transaccionController.js';
import authController from '../controllers/authController.js';

const router = express.Router();
const auth = [authController.verificarToken];

router.post('/cerrar',   auth, authController.verificarRol(['Medico','Admin']), transaccionController.crearTratamientoYCerrar);
router.get('/historial', auth, authController.verificarRol(['Admin','Medico']), transaccionController.getHistorialTransacciones);

export default router;
