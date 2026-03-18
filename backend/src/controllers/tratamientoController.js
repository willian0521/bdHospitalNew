import { sql } from '../../db.js';

const tratamientoController = {
  getTratamientos: async (req, res) => {
    try {
      const result = await sql.query`
        SELECT t.IdTratamiento, t.IdExpediente, t.Diagnostico, t.Tratamiento, t.FechaRegistro,
               u.Nombre + ' ' + u.Apellido AS Medico
        FROM Tratamiento t
        JOIN Usuario u ON t.CodigoEmpleado = u.CodigoEmpleado
        ORDER BY t.FechaRegistro DESC
      `;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

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

  createTratamiento: async (req, res) => {
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;
      await sql.query`
        EXEC sp_RegistrarTratamiento
          @IdExpediente = ${idExpediente},
          @CodigoMedico = ${codigoMedico},
          @Diagnostico  = ${diagnostico},
          @Tratamiento  = ${tratamiento}
      `;
      res.status(201).json({ mensaje: 'Tratamiento registrado exitosamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

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
