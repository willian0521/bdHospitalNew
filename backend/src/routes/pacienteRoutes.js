import express from 'express';
import pacienteController from '../controllers/pacienteController.js';
import authController from '../controllers/authController.js';

const router = express.Router();

// Middleware de autenticación
const auth = [authController.verificarToken];

// Registrar paciente (Recepcionista o Admin)
router.post('/paciente',
  auth,
  authController.verificarRol(['Admin', 'Recepcionista']),
  pacienteController.registrarPaciente
);

// Buscar paciente por DNI
router.get('/paciente/:dni',
  auth,
  pacienteController.buscarPorDni
);

// Registrar expediente (Recepcionista o Admin)
router.post('/expediente',
  auth,
  authController.verificarRol(['Admin', 'Recepcionista']),
  pacienteController.registrarExpediente
);

// Obtener expediente por ID (Médico, Admin)
router.get('/expediente/:id',
  auth,
  authController.verificarRol(['Admin', 'Medico']),
  pacienteController.obtenerExpediente
);

// Listar lista de espera (Médico, Admin)
router.get('/lista-espera',
  auth,
  authController.verificarRol(['Admin', 'Medico']),
  pacienteController.listarListaEspera
);

// Atender expediente (Médico)
router.put('/expediente/:idExpediente/atender',
  auth,
  // Permitir que Médicos y Administradores puedan poner un expediente en 'Atendiendo'
  authController.verificarRol(['Medico', 'Admin']),
  pacienteController.atenderExpediente
);

// Registrar tratamiento (Médico)
router.post('/tratamiento',
  auth,
  // Permitir que Médicos y Administradores registren tratamientos
  authController.verificarRol(['Medico', 'Admin']),
  pacienteController.registrarTratamiento
);

// Obtener contador de expedientes
router.get('/contador',
  auth,
  pacienteController.listarContador
);

// Cerrar expediente (Médico)
router.put('/expediente/:idExpediente/cerrar',
  auth,
  // Permitir que Médicos y Administradores cierren expedientes
  authController.verificarRol(['Medico', 'Admin']),
  pacienteController.cerrarExpediente
);

// Historial médico (Admin, Médico)
router.get('/historial',
  auth,
  authController.verificarRol(['Admin', 'Medico']),
  pacienteController.historialMedico
);

// Historial por DNI (Admin, Médico)
router.get('/historial/:dni',
  auth,
  authController.verificarRol(['Admin', 'Medico']),
  pacienteController.historialPorDni
);

// Contador de expedientes
router.get('/expediente/contador',
  auth,
  pacienteController.contadorExpediente
);

// Dashboard (todos los roles)
router.get('/dashboard',
  auth,
  pacienteController.dashboard
);

export default router;
