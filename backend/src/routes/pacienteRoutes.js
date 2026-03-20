// routes/pacienteRoutes.js
import express from 'express';
import pacienteController from '../controllers/pacienteController.js';
import authController     from '../controllers/authController.js';

const router = express.Router();
const auth   = [authController.verificarToken];

router.post('/paciente',
  auth, authController.verificarRol(['Admin','Recepcionista']),
  pacienteController.registrarPaciente);

router.get('/paciente/:dni',
  auth,
  pacienteController.buscarPorDni);

// Agregar alergias a paciente existente
router.post('/paciente/:dni/alergias',
  auth, authController.verificarRol(['Admin','Recepcionista']),
  async (req, res) => {
    const transaction = new (await import('../../db.js')).sql.Transaction();
    try {
      const { sql } = await import('../../db.js');
      const { dni } = req.params;
      const { alergias = [] } = req.body;
      await transaction.begin();
      for (const a of alergias.filter(x => x.trim())) {
        await transaction.request()
          .input('dni', sql.NVarChar(20), dni)
          .input('val', sql.NVarChar(255), a.trim())
          .query(`IF NOT EXISTS (SELECT 1 FROM PacienteAlergia WHERE DNI=@dni AND Descripcion=@val)
                  INSERT INTO PacienteAlergia (DNI, Descripcion) VALUES (@dni, @val)`);
      }
      await transaction.commit();
      const result = await sql.query`SELECT Descripcion FROM PacienteAlergia WHERE DNI=${dni} ORDER BY IdAlergia`;
      res.json({ mensaje: 'Alergias actualizadas', alergias: result.recordset.map(a => a.Descripcion) });
    } catch (error) {
      if (transaction._aborted === false) await transaction.rollback();
      res.status(500).json({ mensaje: error.message });
    }
  });

router.post('/expediente',
  auth, authController.verificarRol(['Admin','Recepcionista']),
  pacienteController.registrarExpediente);

router.get('/expediente/contador', auth, pacienteController.contadorExpediente);

router.get('/expediente/:id',
  auth, authController.verificarRol(['Admin','Medico']),
  pacienteController.obtenerExpediente);

router.put('/expediente/:idExpediente/atender',
  auth, authController.verificarRol(['Admin','Medico']),
  pacienteController.atenderExpediente);

router.put('/expediente/:idExpediente/cerrar',
  auth, authController.verificarRol(['Admin','Medico']),
  pacienteController.cerrarExpediente);

router.post('/tratamiento',
  auth, authController.verificarRol(['Medico','Admin']),
  pacienteController.registrarTratamiento);

router.get('/lista-espera', auth,
  authController.verificarRol(['Admin','Medico','Recepcionista']),
  pacienteController.listarListaEspera);

router.get('/contador',   auth, pacienteController.listarContador);
router.get('/historial',  auth, authController.verificarRol(['Admin','Medico']), pacienteController.historialMedico);
router.get('/historial/:dni', auth, authController.verificarRol(['Admin','Medico']), pacienteController.historialPorDni);
router.get('/dashboard',  auth, pacienteController.dashboard);

export default router;