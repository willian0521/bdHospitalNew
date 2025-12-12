import express from 'express';
// Importa todas las funciones del controlador de pacientes
import {
  registrarPaciente,
  listarCola,
  atenderPaciente,
  atenderPacientePorId, // <-- nueva funcion
  cambiarUrgencia,
  historialPacientes,
  buscarPorNombre,
  ultimosAtendidos,
  colaMemoria,
  historialMemoria,
  listarPacientes,
  cambiarEstadoPaciente
} from "../controllers/pacienteController.js";
// Importa la base de datos
// import { db } from '../config/db.js'; // <-- No se usa

const router = express.Router();

// Rutas para la gestion de pacientes
router.post("/", registrarPaciente); // Para registrar un paciente nuevo
router.get("/", listarPacientes); // Para ver todos los pacientes
router.put("/:id/atender", atenderPacientePorId); // Atender paciente por id
router.put("/:id/urgencia", cambiarUrgencia); // Cambiar urgencia de un paciente
router.get('/historial', historialPacientes); // Ver historial de pacientes

// Rutas adicionales en memoria
router.get("/cola", colaMemoria); // Ver la cola de pacientes en memoria
router.get("/historial-memoria", historialMemoria); // Ver historial en memoria (lista enlazada)
router.get("/ultimos", ultimosAtendidos); // Ver los ultimos atendidos (pila)

// Obtener todos los pacientes
router.get('/pacientes', listarPacientes);

// Cambiar estado
router.put('/:id/estado', cambiarEstadoPaciente); // Cambiar estado del paciente

// Contador de expedientes
router.get('/expediente/contador', async (_req, res) => {
  try {
    const snap = await db.collection("pacientes").get();
    res.json({ total: snap.size }); // Devuelve el total de expedientes
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Estadisticas de pacientes
router.get('/stats', async (_req, res) => {
  try {
    const snap = await db.collection("pacientes").get();
    let waiting = 0, attended = 0, priority = 0;
    snap.forEach(doc => {
      const p = doc.data();
      if (!p.atendido) waiting++;
      if (p.atendido) attended++;
      if (!p.atendido && p.urgencia === 1) priority++;
    });
    res.json({ waiting, attended, priority }); // Devuelve estadisticas
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
