import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Ruta para login
router.post('/login', authController.login);

// Ruta para registro (protegida para Admin)
router.post('/registro',
  authController.verificarToken,
  authController.verificarRol(['Admin']),
  authController.registro
);

// Ruta para obtener usuarios (protegida para Admin)
router.get('/usuarios',
  authController.verificarToken,
  authController.verificarRol(['Admin']),
  authController.obtenerUsuarios
);

// Ruta para actualizar usuario (protegida para Admin)
router.put('/usuarios/:dni',
  authController.verificarToken,
  authController.verificarRol(['Admin']),
  authController.actualizarUsuario
);

// Ruta para eliminar usuario (protegida para Admin)
router.delete('/usuarios/:dni',
  authController.verificarToken,
  authController.verificarRol(['Admin']),
  authController.eliminarUsuario
);

// Ruta para cambiar estado de usuario (protegida para Admin)
router.put('/usuarios/:dni/status',
  authController.verificarToken,
  authController.verificarRol(['Admin']),
  authController.cambiarEstadoUsuario
);

export default router;