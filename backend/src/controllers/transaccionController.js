import { sql } from '../../db.js';

const transaccionController = {
  // Transacción completa: registrar tratamiento + cerrar expediente en una sola operación atómica
  crearTratamientoYCerrar: async (req, res) => {
    const transaction = new sql.Transaction();
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;

      await transaction.begin();

      // Validar que el expediente exista y esté activo
      const check = await transaction.request()
        .input('id', sql.Int, idExpediente)
        .query('SELECT Estado FROM Expediente WHERE IdExpediente = @id');

      if (check.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ mensaje: 'Expediente no encontrado' });
      }
      if (check.recordset[0].Estado === 'Atendido') {
        await transaction.rollback();
        return res.status(400).json({ mensaje: 'El expediente ya está cerrado' });
      }

      // Paso 1: Insertar tratamiento
      await transaction.request()
        .input('idExp',   sql.Int,          idExpediente)
        .input('codMed',  sql.NVarChar(20),  codigoMedico)
        .input('diag',    sql.NVarChar(255), diagnostico)
        .input('trat',    sql.NVarChar(255), tratamiento)
        .query(`INSERT INTO Tratamiento (IdExpediente, CodigoEmpleado, Diagnostico, Tratamiento)
                VALUES (@idExp, @codMed, @diag, @trat)`);

      // Paso 2: Cambiar estado a Atendido y registrar fecha de cierre
      await transaction.request()
        .input('id', sql.Int, idExpediente)
        .query(`UPDATE Expediente
                SET Estado = 'Atendido', FechaCierre = GETDATE()
                WHERE IdExpediente = @id`);

      await transaction.commit();
      res.json({ mensaje: 'Transacción completada: tratamiento registrado y expediente cerrado' });

    } catch (error) {
      if (transaction._aborted === false) await transaction.rollback();
      res.status(500).json({ mensaje: 'Error en la transacción — ROLLBACK ejecutado', error: error.message });
    }
  },

  // Consulta del historial de transacciones (expedientes cerrados con tratamiento)
  getHistorialTransacciones: async (req, res) => {
    try {
      const result = await sql.query`
        SELECT
          e.IdExpediente,
          p.Nombre + ' ' + p.Apellido AS Paciente,
          e.FechaRegistro  AS FechaApertura,
          e.FechaCierre    AS FechaCierre,
          t.Diagnostico,
          t.Tratamiento,
          u.Nombre + ' ' + u.Apellido AS Medico
        FROM Expediente e
        JOIN Paciente    p ON e.DNI            = p.DNI
        JOIN Tratamiento t ON e.IdExpediente   = t.IdExpediente
        JOIN Usuario     u ON t.CodigoEmpleado = u.CodigoEmpleado
        WHERE e.Estado = 'Atendido'
        ORDER BY e.FechaCierre DESC
      `;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  }
};

export default transaccionController;
