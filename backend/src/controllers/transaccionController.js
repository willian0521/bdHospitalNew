// controllers/transaccionController.js
import { sql } from '../../db.js';

const transaccionController = {

  // FIX: template literal → sql.Request().execute()
  // "too many arguments" porque sp_RegTratamientoYCerrar tiene 4 parámetros
  // y sql.query`EXEC sp ...` los convierte en parámetros posicionales
  // en lugar de nombrados, causando el error.
  crearTratamientoYCerrar: async (req, res) => {
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;

      const request = new sql.Request();
      request.input('IdExpediente', sql.Int,           idExpediente);
      request.input('CodigoMedico', sql.NVarChar(20),  codigoMedico);
      request.input('Diagnostico',  sql.NVarChar(255), diagnostico);
      request.input('Tratamiento',  sql.NVarChar(255), tratamiento);

      const result = await request.execute('sp_RegTratamientoYCerrar');

      res.json({
        mensaje:       result.recordset[0].Mensaje,
        idTratamiento: result.recordset[0].IdTratamiento,
        idExpediente:  result.recordset[0].IdExpediente
      });
    } catch (error) {
      const status = error.message.includes('no encontrado') ? 404
                   : error.message.includes('ya está cerrado') ? 400 : 500;
      res.status(status).json({ mensaje: error.message });
    }
  },

  // SELECT sobre vista — template literal correcto, sin cambios
  getHistorialTransacciones: async (req, res) => {
    try {
      const result = await sql.query`SELECT * FROM HistorialTransacciones`;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  }
};

export default transaccionController;
