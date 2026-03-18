import { sql } from '../../db.js';

const transaccionController = {
  // Transacción completa: registrar tratamiento + cerrar expediente en una sola operación atómica
  crearTratamientoYCerrar: async (req, res) => {
  try {
    const { idExpediente, diagnostico, tratamiento } = req.body;
    const codigoMedico = req.usuario.codigoEmpleado;

    const result = await sql.query`
      EXEC sp_RegistrarTratamientoYCerrar
        @IdExpediente = ${idExpediente},
        @CodigoMedico = ${codigoMedico},
        @Diagnostico  = ${diagnostico},
        @Tratamiento  = ${tratamiento}
    `;

    res.json({
      mensaje: result.recordset[0].Mensaje,
      idTratamiento: result.recordset[0].IdTratamiento
    });
  } catch (error) {
    // RAISERROR del SP llega aquí automáticamente
    const status = error.message.includes('no encontrado') ? 404
                 : error.message.includes('ya está cerrado') ? 400 : 500;
    res.status(status).json({ mensaje: error.message });
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
