// controllers/pacienteController.js
import { sql } from '../../db.js';

// ─────────────────────────────────────────────────────────────
const pacienteController = {

  // ── Registrar paciente nuevo ──────────────────────────────
  // Usa sql.Request() explícito en lugar de template literal porque
  // sql.query`EXEC sp ...` no admite parámetros nombrados múltiples
  // y lanza "too many arguments specified".
  registrarPaciente: async (req, res) => {
    try {
      const {
        dni, nombre, apellido, fechaNacimiento,
        direccion, telefono, email, sexo,
        alergias = []
      } = req.body;

      const alergiasStr = Array.isArray(alergias)
        ? alergias.filter(a => String(a).trim()).join('|')
        : '';

      const request = new sql.Request();
      request.input('DNI',             sql.NVarChar(20),  dni);
      request.input('Nombre',          sql.NVarChar(100), nombre);
      request.input('Apellido',        sql.NVarChar(100), apellido);
      request.input('FechaNacimiento', sql.Date,          fechaNacimiento);
      request.input('Sexo',            sql.NVarChar(1),   sexo      || null);
      request.input('Direccion',       sql.NVarChar(255), direccion || null);
      request.input('Telefono',        sql.NVarChar(20),  telefono  || null);
      request.input('Email',           sql.NVarChar(100), email     || null);
      request.input('Alergias',        sql.NVarChar(sql.MAX), alergiasStr || null);

      const result = await request.execute('sp_RegistrarPaciente');

      res.status(201).json({ mensaje: result.recordset[0].Mensaje });
    } catch (error) {
      const isDuplicate = error.message.includes('ya registrado');
      res.status(isDuplicate ? 400 : 500).json({ mensaje: error.message });
    }
  },

  // ── Buscar paciente por DNI (incluye alergias) ────────────
  buscarPorDni: async (req, res) => {
    try {
      const { dni } = req.params;

      const [pacResult, alergiaResult] = await Promise.all([
        sql.query`SELECT * FROM Paciente WHERE DNI = ${dni}`,
        sql.query`SELECT Descripcion FROM PacienteAlergia WHERE DNI = ${dni} ORDER BY IdAlergia`
      ]);

      if (pacResult.recordset.length === 0)
        return res.status(404).json({ mensaje: 'Paciente no encontrado' });

      const p = pacResult.recordset[0];
      res.json({
        dni:             p.DNI,
        nombre:          p.Nombre,
        apellido:        p.Apellido,
        fechaNacimiento: p.FechaNacimiento?.toISOString().split('T')[0] ?? '',
        edad:            p.FechaNacimiento
                           ? Math.floor((new Date() - new Date(p.FechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
                           : '',
        sexo:      p.Sexo      || '',
        telefono:  p.Telefono  || '',
        email:     p.Email     || '',
        direccion: p.Direccion || '',
        alergias:  alergiaResult.recordset.map(a => a.Descripcion)
      });

    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Registrar expediente ──────────────────────────────────
  // Misma corrección: sql.Request() explícito con .execute()
  registrarExpediente: async (req, res) => {
    try {
      const {
        dni, motivoConsulta, urgencia = 2,
        sintomas     = [],
        medicamentos = []
      } = req.body;
      const codigoEmpleado = req.usuario.codigoEmpleado;

      const sintomasStr = Array.isArray(sintomas)
        ? sintomas.filter(s => String(s).trim()).join('|')
        : '';
      const medicamentosStr = Array.isArray(medicamentos)
        ? medicamentos.filter(m => String(m).trim()).join('|')
        : '';

      const request = new sql.Request();
      request.input('DNI',            sql.NVarChar(20),  dni);
      request.input('CodigoEmpleado', sql.NVarChar(20),  codigoEmpleado);
      request.input('MotivoConsulta', sql.NVarChar(255), motivoConsulta);
      request.input('Urgencia',       sql.Int,           urgencia);
      request.input('Sintomas',       sql.NVarChar(sql.MAX), sintomasStr     || null);
      request.input('Medicamentos',   sql.NVarChar(sql.MAX), medicamentosStr || null);

      const result = await request.execute('sp_RegistrarExpediente');

      res.json({
        mensaje:      result.recordset[0].Mensaje,
        idExpediente: result.recordset[0].IdExpediente
      });
    } catch (error) {
      const status = error.message.includes('no encontrado') ? 404 : 500;
      res.status(status).json({ mensaje: error.message });
    }
  },

  // ── Obtener expediente por ID ─────────────────────────────
  // Paso 1: expediente (necesitamos el DNI antes de consultar alergias).
  // Paso 2: síntomas, medicamentos y alergias en Promise.all paralelo.
  obtenerExpediente: async (req, res) => {
    try {
      const { id } = req.params;

      const expResult = await sql.query`
        SELECT e.IdExpediente, e.DNI, e.FechaRegistro, e.Estado, e.Urgencia,
               e.MotivoConsulta, e.CodigoEmpleado, e.FechaCierre,
               p.Nombre, p.Apellido, p.FechaNacimiento, p.Sexo,
               p.Telefono, p.Email, p.Direccion,
               u.Nombre AS Recepcionista
        FROM Expediente e
        JOIN Paciente p ON e.DNI = p.DNI
        JOIN Usuario  u ON e.CodigoEmpleado = u.CodigoEmpleado
        WHERE e.IdExpediente = ${id}
      `;

      if (expResult.recordset.length === 0)
        return res.status(404).json({ mensaje: 'Expediente no encontrado' });

      const exp = expResult.recordset[0];
      const dni = exp.DNI;

      const [sintomasResult, medResult, alergiaResult] = await Promise.all([
        sql.query`SELECT Sintoma FROM ExpedienteSintoma WHERE IdExpediente = ${id} ORDER BY IdSintoma`,
        sql.query`SELECT Medicamento FROM ExpedienteMedicamento WHERE IdExpediente = ${id} ORDER BY IdMedicamento`,
        sql.query`SELECT Descripcion FROM PacienteAlergia WHERE DNI = ${dni} ORDER BY IdAlergia`
      ]);

      res.json({
        idExpediente:    exp.IdExpediente,
        dni:             exp.DNI,
        nombre:          exp.Nombre,
        apellido:        exp.Apellido,
        fechaNacimiento: exp.FechaNacimiento?.toISOString().split('T')[0] ?? '',
        edad:            exp.FechaNacimiento
                           ? Math.floor((new Date() - new Date(exp.FechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
                           : '',
        sexo:           exp.Sexo      || '',
        telefono:       exp.Telefono  || '',
        email:          exp.Email     || '',
        direccion:      exp.Direccion || '',
        fechaRegistro:  exp.FechaRegistro ? new Date(exp.FechaRegistro).toISOString() : null,
        estado:         exp.Estado,
        urgencia:       exp.Urgencia,
        motivoConsulta: exp.MotivoConsulta,
        fechaCierre:    exp.FechaCierre ? new Date(exp.FechaCierre).toISOString() : null,
        recepcionista:  exp.Recepcionista,
        sintomas:       sintomasResult.recordset.map(s => s.Sintoma),
        medicamentos:   medResult.recordset.map(m => m.Medicamento),
        alergias:       alergiaResult.recordset.map(a => a.Descripcion)
      });

    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Lista de espera ───────────────────────────────────────
  listarListaEspera: async (req, res) => {
    try {
      const result = await sql.query`SELECT * FROM ListaEspera ORDER BY Urgencia ASC, FechaRegistro ASC`;
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Contadores ────────────────────────────────────────────
  listarContador: async (req, res) => {
    try {
      const result = await sql.query`SELECT COUNT(*) AS total FROM Expediente`;
      res.json({ total: result.recordset[0].total });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  contadorExpediente: async (req, res) => {
    try {
      const result = await sql.query`SELECT COUNT(*) AS total FROM Expediente`;
      res.json({ total: result.recordset[0].total });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Atender expediente ────────────────────────────────────
  atenderExpediente: async (req, res) => {
    try {
      const { idExpediente } = req.params;
      await sql.query`UPDATE Expediente SET Estado = 'Atendiendo' WHERE IdExpediente = ${idExpediente}`;
      res.json({ mensaje: 'Expediente en atención', idExpediente });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Registrar tratamiento ─────────────────────────────────
  registrarTratamiento: async (req, res) => {
    try {
      const { idExpediente, diagnostico, tratamiento } = req.body;
      const codigoMedico = req.usuario.codigoEmpleado;

      const request = new sql.Request();
      request.input('IdExpediente', sql.Int,          idExpediente);
      request.input('CodigoMedico', sql.NVarChar(20), codigoMedico);
      request.input('Diagnostico',  sql.NVarChar(255), diagnostico);
      request.input('Tratamiento',  sql.NVarChar(255), tratamiento);

      await request.execute('sp_RegistrarTratamiento');
      res.json({ mensaje: 'Tratamiento registrado' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Cerrar expediente ─────────────────────────────────────
  cerrarExpediente: async (req, res) => {
    try {
      const { idExpediente } = req.params;

      const request = new sql.Request();
      request.input('IdExpediente', sql.Int, idExpediente);
      await request.execute('sp_CerrarExpediente');

      res.json({ mensaje: 'Expediente cerrado' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Historial médico ──────────────────────────────────────
  historialMedico: async (req, res) => {
    try {
      let { dni, creador, medico } = req.query;
      const sanitize = v => (typeof v === 'string' ? v.replace(/'/g, "''") : v);
      dni     = sanitize(dni);
      creador = sanitize(creador);
      medico  = sanitize(medico);

      const baseQuery = `
        SELECT e.IdExpediente, e.DNI, p.Nombre, p.Apellido, p.Telefono, p.Email,
               p.Direccion, p.Sexo, p.FechaNacimiento,
               e.FechaRegistro, e.FechaCierre, e.MotivoConsulta, e.Urgencia,
               e.CodigoEmpleado AS CodigoRecepcionista, eu.Nombre AS Recepcionista,
               t.IdTratamiento, t.Diagnostico, t.Tratamiento AS TratamientoTexto,
               t.CodigoEmpleado AS CodigoMedico, tu.Nombre AS Medico,
               t.FechaRegistro AS FechaRegistroTratamiento
        FROM Expediente e
        JOIN Paciente p ON e.DNI = p.DNI
        LEFT JOIN Tratamiento t  ON e.IdExpediente   = t.IdExpediente
        LEFT JOIN Usuario tu     ON t.CodigoEmpleado = tu.CodigoEmpleado
        LEFT JOIN Usuario eu     ON e.CodigoEmpleado = eu.CodigoEmpleado
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

      const result = await request.query(
        baseQuery + whereClauses + ' ORDER BY e.FechaRegistro DESC, t.FechaRegistro ASC'
      );

      const idsExpediente = [...new Set(result.recordset.map(r => r.IdExpediente))];
      const dnisPacientes = [...new Set(result.recordset.map(r => r.DNI))];

      const sintomasMap     = new Map();
      const medicamentosMap = new Map();
      const alergiasMap     = new Map();

      if (idsExpediente.length > 0) {
        const idsList  = idsExpediente.join(',');
        const dnisList = dnisPacientes.map(d => `'${d}'`).join(',');

        const [sintomasRes, medRes, alergiasRes] = await Promise.all([
          new sql.Request().query(
            `SELECT IdExpediente, Sintoma FROM ExpedienteSintoma
             WHERE IdExpediente IN (${idsList}) ORDER BY IdSintoma`
          ),
          new sql.Request().query(
            `SELECT IdExpediente, Medicamento FROM ExpedienteMedicamento
             WHERE IdExpediente IN (${idsList}) ORDER BY IdMedicamento`
          ),
          new sql.Request().query(
            `SELECT DNI, Descripcion FROM PacienteAlergia
             WHERE DNI IN (${dnisList}) ORDER BY IdAlergia`
          )
        ]);

        for (const s of sintomasRes.recordset) {
          if (!sintomasMap.has(s.IdExpediente)) sintomasMap.set(s.IdExpediente, []);
          sintomasMap.get(s.IdExpediente).push(s.Sintoma);
        }
        for (const m of medRes.recordset) {
          if (!medicamentosMap.has(m.IdExpediente)) medicamentosMap.set(m.IdExpediente, []);
          medicamentosMap.get(m.IdExpediente).push(m.Medicamento);
        }
        for (const a of alergiasRes.recordset) {
          if (!alergiasMap.has(a.DNI)) alergiasMap.set(a.DNI, []);
          alergiasMap.get(a.DNI).push(a.Descripcion);
        }
      }

      const map = new Map();
      for (const r of result.recordset) {
        if (!map.has(r.IdExpediente)) {
          const fechaNac      = r.FechaNacimiento ? new Date(r.FechaNacimiento) : null;
          const edad          = fechaNac
                                  ? Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000))
                                  : '';
          const fechaRegistro = r.FechaRegistro ? new Date(r.FechaRegistro) : null;
          const expedienteStr = fechaRegistro
                                  ? `EXP-${fechaRegistro.getFullYear()}-${r.IdExpediente}`
                                  : `EXP-${r.IdExpediente}`;

          map.set(r.IdExpediente, {
            idExpediente:        r.IdExpediente,
            expediente:          expedienteStr,
            cedula:              r.DNI,
            nombre:              `${r.Nombre} ${r.Apellido}`.trim(),
            telefono:            r.Telefono   || '',
            email:               r.Email      || '',
            direccion:           r.Direccion  || '',
            sexo:                r.Sexo       || '',
            edad,
            fechaRegistro:       r.FechaRegistro,
            fechaCierre:         r.FechaCierre,
            fechaAtencion:       r.FechaCierre,
            motivoConsulta:      r.MotivoConsulta,
            urgencia:            r.Urgencia   || 2,
            creadorExpediente:   r.Recepcionista       || '',
            codigoRecepcionista: r.CodigoRecepcionista || '',
            sintomas:            sintomasMap.get(r.IdExpediente)     || [],
            medicamentos:        medicamentosMap.get(r.IdExpediente) || [],
            alergias:            alergiasMap.get(r.DNI)              || [],
            tratamientos:        []
          });
        }

        if (r.IdTratamiento) {
          map.get(r.IdExpediente).tratamientos.push({
            idTratamiento:      r.IdTratamiento,
            diagnostico:        r.Diagnostico              || '',
            tratamiento:        r.TratamientoTexto         || '',
            fechaRegistro:      r.FechaRegistroTratamiento || null,
            codigoMedico:       r.CodigoMedico             || '',
            creadorTratamiento: r.Medico                   || ''
          });
        }
      }

      res.json(Array.from(map.values()));

    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Historial por DNI (SP) ────────────────────────────────
  historialPorDni: async (req, res) => {
    try {
      const { dni } = req.params;

      const request = new sql.Request();
      request.input('DNI', sql.NVarChar(20), dni);
      const result = await request.execute('sp_HistorialPorDNI');

      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // ── Dashboard ─────────────────────────────────────────────
  dashboard: async (req, res) => {
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const [
        espera, atendiendo, atendidosTotal, atendidosHoy,
        altaPrioridad, totalPacientes, totalUsuarios,
        topMedicosQ, pacientesRecurrentesQ
      ] = await Promise.all([
        sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'En espera'`,
        sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'Atendiendo'`,
        sql.query`SELECT COUNT(*) AS count FROM Expediente WHERE Estado = 'Atendido'`,
        sql.query`
          SELECT COUNT(*) AS count FROM Expediente
          WHERE Estado = 'Atendido' AND FechaCierre BETWEEN ${todayStart} AND ${todayEnd}
        `,
        sql.query`
          SELECT COUNT(*) AS count FROM Expediente
          WHERE Estado = 'En espera' AND Urgencia = 1
        `,
        sql.query`SELECT COUNT(*) AS count FROM Paciente`,
        sql.query`SELECT COUNT(*) AS count FROM Usuario`,
        sql.query`
          SELECT TOP 5 u.Nombre, COUNT(t.IdTratamiento) AS Tratamientos
          FROM Usuario u
          JOIN Tratamiento t ON u.CodigoEmpleado = t.CodigoEmpleado
          WHERE u.Rol = 'Medico'
          GROUP BY u.Nombre ORDER BY Tratamientos DESC
        `,
        sql.query`
          SELECT TOP 10 p.DNI, p.Nombre, COUNT(e.IdExpediente) AS NumExpedientes
          FROM Paciente p
          JOIN Expediente e ON p.DNI = e.DNI
          GROUP BY p.DNI, p.Nombre
          HAVING COUNT(e.IdExpediente) > 1
          ORDER BY NumExpedientes DESC
        `
      ]);

      res.json({
        estadisticas: {
          enEspera:       espera.recordset[0].count,
          atendiendo:     atendiendo.recordset[0].count,
          atendidosTotal: atendidosTotal.recordset[0].count,
          atendidosHoy:   atendidosHoy.recordset[0].count,
          altaPrioridad:  altaPrioridad.recordset[0].count,
          totalPacientes: totalPacientes.recordset[0].count,
          totalUsuarios:  totalUsuarios.recordset[0].count
        },
        topMedicos:           topMedicosQ.recordset,
        pacientesRecurrentes: pacientesRecurrentesQ.recordset
      });

    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  }
};

export default pacienteController;