// Controlador de pacientes y expedientes
import { sql } from '../../db.js';

const pacienteController = {
  // Registrar paciente nuevo (solo si no existe por DNI)
  registrarPaciente: async (req, res) => {
    try {
      const { dni, nombre, apellido, fechaNacimiento, direccion, telefono, email, sexo } = req.body;

      // Verificar si ya existe
      const existing = await sql.query`SELECT * FROM Paciente WHERE DNI = ${dni}`;
      if (existing.recordset.length > 0) {
        return res.status(400).json({ mensaje: 'Paciente ya registrado' });
      }

      await sql.query`
        INSERT INTO Paciente (DNI, Nombre, Apellido, FechaNacimiento, Direccion, Telefono, Email, Sexo)
        VALUES (${dni}, ${nombre}, ${apellido}, ${fechaNacimiento}, ${direccion}, ${telefono}, ${email}, ${sexo})
      `;

      res.status(201).json({ mensaje: 'Paciente registrado exitosamente' });
    } catch (error) {
      console.error('Error en historialMedico:', error);
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Buscar paciente por DNI
  buscarPorDni: async (req, res) => {
    try {
      const { dni } = req.params;
      console.log('Buscando paciente por DNI:', dni);

      const result = await sql.query`SELECT * FROM Paciente WHERE DNI = ${dni}`;
      console.log('Resultado de búsqueda:', result.recordset.length, 'pacientes encontrados');

      if (result.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'Paciente no encontrado' });
      }

      const p = result.recordset[0];
      const paciente = {
        dni: p.DNI,
        nombre: p.Nombre,
        apellido: p.Apellido,
        fechaNacimiento: p.FechaNacimiento ? p.FechaNacimiento.toISOString().split('T')[0] : '',
        edad: p.FechaNacimiento ? Math.floor((new Date() - new Date(p.FechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : '',
        sexo: p.Sexo || '',
        telefono: p.Telefono || '',
        email: p.Email || '',
        direccion: p.Direccion || '',
        contactoEmergencia: p.ContactoEmergencia || '',
        telefonoEmergencia: p.TelefonoEmergencia || '',
        alergias: p.Alergias || '',
        medicamentosActuales: p.MedicamentosActuales || '',
        enfermedadesCronicas: p.EnfermedadesCronicas || '',
        antecedentesFamiliares: p.AntecedentesFamiliares || ''
      };

      console.log('Paciente encontrado:', paciente);
      res.json(paciente);
    } catch (error) {
      console.error('Error buscando paciente:', error);
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Registrar expediente (para recepcionista)
  registrarExpediente: async (req, res) => {
    try {
      const { dni, motivoConsulta, urgencia = 2 } = req.body;
      const codigoEmpleado = req.usuario.codigoEmpleado; // Del token

      const result = await sql.query`INSERT INTO Expediente (DNI, CodigoEmpleado, MotivoConsulta, Urgencia) OUTPUT INSERTED.IdExpediente VALUES (${dni}, ${codigoEmpleado}, ${motivoConsulta}, ${urgencia})`;

      res.json({ mensaje: 'Expediente registrado exitosamente', idExpediente: result.recordset[0].IdExpediente });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Obtener expediente por ID
  obtenerExpediente: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await sql.query`
        SELECT e.IdExpediente, e.DNI, e.FechaRegistro, e.Estado, e.Urgencia, e.MotivoConsulta, e.CodigoEmpleado, e.FechaCierre,
               p.Nombre, p.Apellido, p.FechaNacimiento, p.Sexo, p.Telefono, p.Email, p.Direccion,
               u.Nombre AS Recepcionista
        FROM Expediente e
        JOIN Paciente p ON e.DNI = p.DNI
        JOIN Usuario u ON e.CodigoEmpleado = u.CodigoEmpleado
        WHERE e.IdExpediente = ${id}
      `;

      if (result.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'Expediente no encontrado' });
      }

      const exp = result.recordset[0];
      const expediente = {
        idExpediente: exp.IdExpediente,
        dni: exp.DNI,
        nombre: exp.Nombre,
        apellido: exp.Apellido,
        fechaNacimiento: exp.FechaNacimiento ? exp.FechaNacimiento.toISOString().split('T')[0] : '',
        edad: exp.FechaNacimiento ? Math.floor((new Date() - new Date(exp.FechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : '',
        sexo: exp.Sexo || '',
        telefono: exp.Telefono || '',
        email: exp.Email || '',
        direccion: exp.Direccion || '',
          fechaRegistro: exp.FechaRegistro ? new Date(exp.FechaRegistro).toISOString() : null,
        estado: exp.Estado,
        urgencia: exp.Urgencia,
        motivoConsulta: exp.MotivoConsulta,
          fechaCierre: exp.FechaCierre ? new Date(exp.FechaCierre).toISOString() : null,
        recepcionista: exp.Recepcionista
      };

      res.json(expediente);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Listar lista de espera
  listarListaEspera: async (req, res) => {
    try {
      const result = await sql.query`SELECT * FROM ListaEspera`;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Obtener contador de expedientes
  listarContador: async (req, res) => {
    try {
      const result = await sql.query`SELECT COUNT(*) as total FROM Expediente`;
      res.json({ total: result.recordset[0].total });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Atender expediente (cambiar a Atendiendo y redirigir a tratamiento)
  atenderExpediente: async (req, res) => {
    try {
      const { idExpediente } = req.params;

      // Cambiar estado a Atendiendo
      await sql.query`UPDATE Expediente SET Estado = 'Atendiendo' WHERE IdExpediente = ${idExpediente}`;

      res.json({ mensaje: 'Expediente en atención', idExpediente });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Registrar tratamiento
  registrarTratamiento: async (req, res) => {
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;

      await sql.query`EXEC sp_RegistrarTratamiento @IdExpediente = ${idExpediente}, @CodigoMedico = ${codigoMedico}, @Diagnostico = ${diagnostico}, @Tratamiento = ${tratamiento}`;

      res.json({ mensaje: 'Tratamiento registrado' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Cerrar expediente
  cerrarExpediente: async (req, res) => {
    try {
      const { idExpediente } = req.params;

      await sql.query`EXEC sp_CerrarExpediente @IdExpediente = ${idExpediente}`;

      res.json({ mensaje: 'Expediente cerrado' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Historial médico
  historialMedico: async (req, res) => {
    try {
      let { dni, creador, medico } = req.query; // Filtros opcionales: creador puede ser recepcionista o médico

      // Sanitizar entradas simples para prevenir errores de SQL al construir la query
      const sanitize = (v) => (typeof v === 'string' ? v.replace(/'/g, "''") : v);
      dni = sanitize(dni);
      creador = sanitize(creador);
      medico = sanitize(medico);

      // Obtener todos los expedientes y sus tratamientos (si es que hay uwu), incluyendo nombres del creador de registro
      // Construir consulta parametrizada
      const baseQuery = `
        SELECT e.IdExpediente, e.DNI, p.Nombre, p.Apellido, p.Telefono, p.Email, p.Direccion, p.Sexo, p.FechaNacimiento,
               e.FechaRegistro, e.FechaCierre, e.MotivoConsulta, e.Urgencia,
               e.CodigoEmpleado AS CodigoRecepcionista, eu.Nombre AS Recepcionista,
               t.IdTratamiento, t.Diagnostico, t.Tratamiento AS TratamientoTexto, t.CodigoEmpleado AS CodigoMedico, tu.Nombre AS Medico,
               t.FechaRegistro AS FechaRegistroTratamiento
        FROM Expediente e
        JOIN Paciente p ON e.DNI = p.DNI
        LEFT JOIN Tratamiento t ON e.IdExpediente = t.IdExpediente
        LEFT JOIN Usuario tu ON t.CodigoEmpleado = tu.CodigoEmpleado
        LEFT JOIN Usuario eu ON e.CodigoEmpleado = eu.CodigoEmpleado
        WHERE e.Estado = 'Atendido'
      `;

      let whereClauses = '';
      const request = new sql.Request();

      if (dni) {
        whereClauses += ' AND e.DNI = @dni';
        request.input('dni', sql.NVarChar, dni);
      }
      if (creador) {
        whereClauses += ' AND (eu.Nombre LIKE @creador OR tu.Nombre LIKE @creador)';
        request.input('creador', sql.NVarChar, `%${creador}%`);
      }
      if (medico) {
        whereClauses += ' AND tu.Nombre LIKE @medico';
        request.input('medico', sql.NVarChar, `%${medico}%`);
      }

      const orderBy = ' ORDER BY e.FechaRegistro DESC, t.FechaRegistro ASC';
      const finalQuery = baseQuery + whereClauses + orderBy;

      const result = await request.query(finalQuery);

      // Agrupar por expediente y construir estructura: expediente + array de tratamientos
      const map = new Map();
      for (const r of result.recordset) {
        if (!map.has(r.IdExpediente)) {
          const fechaNacimiento = r.FechaNacimiento ? new Date(r.FechaNacimiento) : null;
          const edad = fechaNacimiento ? Math.floor((new Date() - fechaNacimiento) / (365.25 * 24 * 60 * 60 * 1000)) : '';
          const fechaRegistro = r.FechaRegistro ? new Date(r.FechaRegistro) : null;
          const expedienteStr = fechaRegistro ? `EXP-${fechaRegistro.getFullYear()}-${r.IdExpediente}` : `EXP-${r.IdExpediente}`;

          map.set(r.IdExpediente, {
            idExpediente: r.IdExpediente,
            expediente: expedienteStr,
            cedula: r.DNI,
            nombre: `${r.Nombre} ${r.Apellido}`.trim(),
            telefono: r.Telefono || '',
            email: r.Email || '',
            direccion: r.Direccion || '',
            sexo: r.Sexo || '',
            edad: edad,
            fechaRegistro: r.FechaRegistro,
            fechaCierre: r.FechaCierre,
            fechaAtencion: r.FechaCierre,
            motivoConsulta: r.MotivoConsulta,
            urgencia: r.Urgencia || 2,
            creadorExpediente: r.Recepcionista || '',
            codigoRecepcionista: r.CodigoRecepcionista || '',
            tratamientos: []
          });
        }

        // Si hay tratamiento en la fila, agregarlo al arreglo correspondiente
        if (r.IdTratamiento) {
          const tratado = {
            idTratamiento: r.IdTratamiento,
            diagnostico: r.Diagnostico || '',
            tratamiento: r.TratamientoTexto || '',
            fechaRegistro: r.FechaRegistroTratamiento || null,
            codigoMedico: r.CodigoMedico || '',
            creadorTratamiento: r.Medico || ''
          };
          map.get(r.IdExpediente).tratamientos.push(tratado);
        }
      }

      const expedientes = Array.from(map.values());
      res.json(expedientes);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Historial por DNI (usando SP)
  historialPorDni: async (req, res) => {
    try {
      const { dni } = req.params;

      const result = await sql.query`EXEC sp_HistorialPorDNI @DNI = ${dni}`;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Contador de expedientes
  contadorExpediente: async (req, res) => {
    try {
      const result = await sql.query`SELECT COUNT(*) AS total FROM Expediente`;
      res.json({ total: result.recordset[0].total });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Dashboard general (estadísticas)
  dashboard: async (req, res) => {
    try {
      const espera = await sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'En espera'`;
      const atendiendo = await sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'Atendiendo'`;
      const atendidosTotal = await sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'Atendido'`;
      // Contar atendidos hoy (FechaCierre en rango del día actual)
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayEnd = new Date();
      todayEnd.setHours(23,59,59,999);
      const atendidosHoy = await sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'Atendido' AND FechaCierre BETWEEN ${todayStart} AND ${todayEnd}`;

      // Pacientes de alta prioridad en espera
      const altaPrioridad = await sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'En espera' AND Urgencia = 1`;

      const totalPacientes = await sql.query`SELECT COUNT(*) AS count FROM Paciente`;
      const totalUsuarios = await sql.query`SELECT COUNT(*) AS count FROM Usuario`;
      // Top 5 médicos por cantidad de tratamientos
      const topMedicosQ = await sql.query`
        SELECT TOP 5 u.Nombre, COUNT(t.IdTratamiento) AS Tratamientos
        FROM Usuario u
        JOIN Tratamiento t ON u.CodigoEmpleado = t.CodigoEmpleado
        WHERE u.Rol = 'Medico'
        GROUP BY u.Nombre
        ORDER BY Tratamientos DESC
      `;

      // Pacientes con más de un expediente
      const pacientesRecurrentesQ = await sql.query`
        SELECT TOP 10 p.DNI, p.Nombre, COUNT(e.IdExpediente) AS NumExpedientes
        FROM Paciente p
        JOIN Expediente e ON p.DNI = e.DNI
        GROUP BY p.DNI, p.Nombre
        HAVING COUNT(e.IdExpediente) > 1
        ORDER BY NumExpedientes DESC
      `;

      res.json({
        estadisticas: {
          enEspera: espera.recordset[0].count,
          atendiendo: atendiendo.recordset[0].count,
          atendidosTotal: atendidosTotal.recordset[0].count,
          atendidosHoy: atendidosHoy.recordset[0].count,
          altaPrioridad: altaPrioridad.recordset[0].count,
          totalPacientes: totalPacientes.recordset[0].count,
          totalUsuarios: totalUsuarios.recordset[0].count
        },
        topMedicos: topMedicosQ.recordset,
        pacientesRecurrentes: pacientesRecurrentesQ.recordset
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  }
};

export default pacienteController;
