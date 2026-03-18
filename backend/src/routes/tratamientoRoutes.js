import express from 'express';
import tratamientoController from '../controllers/tratamientoController.js';
import authController from '../controllers/authController.js';

const router = express.Router();
const auth = [authController.verificarToken];

router.get('/',    auth, tratamientoController.getTratamientos);
router.get('/:id', auth, tratamientoController.getTratamiento);
router.post('/',   auth, authController.verificarRol(['Medico','Admin']), tratamientoController.createTratamiento);
router.put('/:id', auth, authController.verificarRol(['Medico','Admin']), tratamientoController.updateTratamiento);
router.delete('/:id', auth, authController.verificarRol(['Admin']),       tratamientoController.deleteTratamiento);

export default router;
