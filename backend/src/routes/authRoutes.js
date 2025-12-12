import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Ruta para login
router.post('/login', authController.login);

// Ruta para registro (protegida para admin)
router.post('/registro',
  authController.verificarToken,
  authController.verificarRol(['admin']),
  authController.registro
);

export default router;