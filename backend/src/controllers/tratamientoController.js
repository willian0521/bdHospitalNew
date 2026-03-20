// controllers/tratamientoController.js
import { sql } from '../../db.js';

const tratamientoController = {

  // SELECT simple — template literal correcto, sin cambios
  getTratamientos: async (req, res) => {
    try {
      const result = await sql.query`
        SELECT t.IdTratamiento, t.IdExpediente, t.Diagnostico, t.Tratamiento,
               t.FechaRegistro, u.Nombre + ' ' + u.Apellido AS Medico
        FROM Tratamiento t
        JOIN Usuario u ON t.CodigoEmpleado = u.CodigoEmpleado
        ORDER BY t.FechaRegistro DESC
      `;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // SELECT simple — template literal correcto, sin cambios
  getTratamiento: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await sql.query`
        SELECT t.*, u.Nombre + ' ' + u.Apellido AS Medico
        FROM Tratamiento t
        JOIN Usuario u ON t.CodigoEmpleado = u.CodigoEmpleado
        WHERE t.IdTratamiento = ${id}
      `;
      if (result.recordset.length === 0)
        return res.status(404).json({ mensaje: 'Tratamiento no encontrado' });
      res.json(result.recordset[0]);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // FIX: template literal → sql.Request().execute()
  // "too many arguments" porque sp_RegistrarTratamiento tiene 4 parámetros
  // y sql.query con EXEC los trata como argumentos posicionales separados.
  createTratamiento: async (req, res) => {
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;

      const request = new sql.Request();
      request.input('IdExpediente', sql.Int,           idExpediente);
      request.input('CodigoMedico', sql.NVarChar(20),  codigoMedico);
      request.input('Diagnostico',  sql.NVarChar(255), diagnostico);
      request.input('Tratamiento',  sql.NVarChar(255), tratamiento);

      const result = await request.execute('sp_RegistrarTratamiento');

      res.status(201).json({
        mensaje:       'Tratamiento registrado exitosamente',
        idTratamiento: result.recordset[0]?.IdTratamiento
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // UPDATE directo — template literal correcto, sin cambios
  updateTratamiento: async (req, res) => {
    try {
      const { id } = req.params;
      const { diagnostico, tratamiento } = req.body;
      await sql.query`
        UPDATE Tratamiento
        SET Diagnostico = ${diagnostico}, Tratamiento = ${tratamiento}
        WHERE IdTratamiento = ${id}
      `;
      res.json({ mensaje: 'Tratamiento actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // DELETE directo — template literal correcto, sin cambios
  deleteTratamiento: async (req, res) => {
    try {
      const { id } = req.params;
      await sql.query`DELETE FROM Tratamiento WHERE IdTratamiento = ${id}`;
      res.json({ mensaje: 'Tratamiento eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  }
};

export default tratamientoController;
