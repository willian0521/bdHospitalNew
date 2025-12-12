// Importa la conexión a SQL Server
import { sql } from "../../db.js";
// Importa el modelo de paciente
import Paciente from "../models/Paciente.js";
// Importa el validador de paciente
import { pacienteSchema } from "../utils/validators.js";
// Importa el estado en memoria
import State from '../utils/State.js';

// Funcion para registrar un paciente nuevo
export const registrarPaciente = async (req, res) => {
  try {
    // Valida los datos del paciente
    const { error, value } = pacienteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // Verifica que el expediente sea unico
    const pool = await sql.connect();
    const dupResult = await pool.request()
      .input('expediente', sql.NVarChar, value.expediente)
      .query('SELECT PacienteID FROM Paciente WHERE Expediente = @expediente');
    if (dupResult.recordset.length > 0) return res.status(409).json({ error: "El expediente ya existe" });

    // Inserta el paciente en la BD
    const insertResult = await pool.request()
      .input('nombre', sql.NVarChar, value.nombre)
      .input('apellido', sql.NVarChar, value.apellido || '')
      .input('fechaNacimiento', sql.Date, value.fechaNacimiento)
      .input('direccion', sql.NVarChar, value.direccion)
      .input('telefono', sql.NVarChar, value.telefono)
      .input('email', sql.NVarChar, value.email)
      .input('expediente', sql.NVarChar, value.expediente)
      .input('cedula', sql.NVarChar, value.cedula)
      .input('sexo', sql.NVarChar, value.sexo)
      .input('motivoConsulta', sql.NVarChar, value.motivoConsulta)
      .input('sintomas', sql.NVarChar, value.sintomas)
      .input('tiempoSintomas', sql.NVarChar, value.tiempoSintomas)
      .input('alergias', sql.NVarChar, value.alergias)
      .input('medicamentosActuales', sql.NVarChar, value.medicamentosActuales)
      .input('urgencia', sql.Int, value.urgencia || 3)
      .input('usuarioRegistroID', sql.Int, value.usuarioRegistroID || 1)
      .query(`
        INSERT INTO Paciente (Nombre, Apellido, FechaNacimiento, Direccion, Telefono, Email, Expediente, Cedula, Sexo, MotivoConsulta, Sintomas, TiempoSintomas, Alergias, MedicamentosActuales, Urgencia, UsuarioRegistroID)
        OUTPUT INSERTED.PacienteID
        VALUES (@nombre, @apellido, @fechaNacimiento, @direccion, @telefono, @email, @expediente, @cedula, @sexo, @motivoConsulta, @sintomas, @tiempoSintomas, @alergias, @medicamentosActuales, @urgencia, @usuarioRegistroID)
      `);

    const pacienteID = insertResult.recordset[0].PacienteID;

    return res.status(201).json({ PacienteID: pacienteID, ...value });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para mostrar la cola de pacientes esperando
export const listarCola = async (_req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT PacienteID, Nombre, Apellido, Expediente, Urgencia, FechaRegistro, Sintomas
      FROM Paciente
      WHERE Atendido = 0
      ORDER BY Urgencia ASC, FechaRegistro ASC
    `);

    const data = result.recordset.map(p => ({
      id: p.PacienteID,
      nombre: p.Nombre + ' ' + p.Apellido,
      expediente: p.Expediente,
      urgencia: p.Urgencia,
      fechaRegistro: p.FechaRegistro.toISOString(),
      sintomas: p.Sintomas
    }));

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para mostrar todos los pacientes
export const listarPacientes = async (_req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT PacienteID, Expediente, Nombre + ' ' + Apellido AS nombre, 
             DATEDIFF(YEAR, FechaNacimiento, GETDATE()) AS edad, 
             Telefono, FechaRegistro, Urgencia, Atendido, Sintomas, 
             CASE WHEN Atendido = 1 THEN 'atendido' ELSE 'esperando' END AS status
      FROM Paciente
      ORDER BY FechaRegistro DESC
    `);

    const data = result.recordset.map(p => ({
      id: p.PacienteID,
      expediente: p.Expediente,
      nombre: p.nombre,
      edad: p.edad,
      telefono: p.Telefono,
      fechaRegistro: p.FechaRegistro.toISOString(),
      urgencia: p.Urgencia,
      atendido: p.Atendido,
      sintomas: p.Sintomas,
      status: p.status
    }));

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para atender al siguiente paciente en la cola
export const atenderPaciente = async (_req, res) => {
  try {
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // Busca el paciente con mayor urgencia (menor numero) y menor fecha
      const request = new sql.Request(transaction);
      const result = await request.query(`
        SELECT TOP 1 PacienteID, Nombre, Apellido, Expediente, Urgencia, FechaRegistro, Sintomas
        FROM Paciente
        WHERE Atendido = 0
        ORDER BY Urgencia ASC, FechaRegistro ASC
      `);

      if (result.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "No hay pacientes en espera" });
      }

      const paciente = result.recordset[0];

      // Marca como atendido
      const updateRequest = new sql.Request(transaction);
      await updateRequest
        .input('pacienteID', sql.Int, paciente.PacienteID)
        .query(`
          UPDATE Paciente
          SET Atendido = 1, FechaAtencion = GETDATE()
          WHERE PacienteID = @pacienteID
        `);

      await transaction.commit();

      // Actualiza las estructuras en memoria (asumiendo que State existe)
      // state.pilaUltimosAtendidos.push(paciente);
      // state.historialLista.push(paciente);

      return res.json({
        id: paciente.PacienteID,
        nombre: paciente.Nombre + ' ' + paciente.Apellido,
        expediente: paciente.Expediente,
        urgencia: paciente.Urgencia,
        fechaRegistro: paciente.FechaRegistro.toISOString(),
        sintomas: paciente.Sintomas,
        atendido: true,
        fechaAtencion: new Date().toISOString()
      });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para cambiar la urgencia de un paciente
export const cambiarUrgencia = async (req, res) => {
  const { id } = req.params;
  const { urgencia } = req.body;
  if (![1, 2, 3].includes(Number(urgencia))) {
    return res.status(400).json({ error: "Urgencia invalida (1,2,3)" });
  }
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('pacienteID', sql.Int, id)
      .input('urgencia', sql.Int, Number(urgencia))
      .query(`
        UPDATE Paciente
        SET Urgencia = @urgencia
        WHERE PacienteID = @pacienteID
        SELECT * FROM Paciente WHERE PacienteID = @pacienteID
      `);

    if (result.recordset.length === 0) return res.status(404).json({ error: "Paciente no encontrado" });

    const p = result.recordset[0];
    return res.json({
      id: p.PacienteID,
      nombre: p.Nombre + ' ' + p.Apellido,
      expediente: p.Expediente,
      urgencia: p.Urgencia,
      atendido: p.Atendido,
      fechaRegistro: p.FechaRegistro.toISOString()
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para cambiar el estado del paciente (atendido, esperando, atendiendo)
export const cambiarEstadoPaciente = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const pool = await sql.connect();
    let updateQuery = 'UPDATE Paciente SET ';
    const request = pool.request().input('pacienteID', sql.Int, id);

    if (status === "atendido") {
      updateQuery += 'Atendido = 1, FechaAtencion = GETDATE()';
    } else if (status === "esperando") {
      updateQuery += 'Atendido = 0, FechaAtencion = NULL';
    } else if (status === "atendiendo") {
      updateQuery += 'status = @status'; // Asumir que hay un campo status, pero en BD no, quizás agregar
    } else {
      return res.status(400).json({ error: "Status invalido" });
    }

    updateQuery += ' WHERE PacienteID = @pacienteID SELECT * FROM Paciente WHERE PacienteID = @pacienteID';

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) return res.status(404).json({ error: "Paciente no encontrado" });

    const p = result.recordset[0];
    return res.json({
      id: p.PacienteID,
      nombre: p.Nombre + ' ' + p.Apellido,
      expediente: p.Expediente,
      urgencia: p.Urgencia,
      atendido: p.Atendido,
      fechaRegistro: p.FechaRegistro.toISOString(),
      fechaAtencion: p.FechaAtencion ? p.FechaAtencion.toISOString() : null,
      status
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para cambiar urgencia en memoria
export const cambiarUrgenciaPaciente = (req, res) => {
  const { id } = req.params;
  const { urgencia } = req.body;
  const result = State.cambiarUrgenciaPaciente(id, urgencia);
  if (result) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Paciente no encontrado' });
  }
};

// Funcion para mostrar historial de pacientes atendidos
export const historialPacientes = async (req, res) => {
  try {
    const pool = await sql.connect();
    let query = `
      SELECT PacienteID, Expediente, Nombre, Apellido, Sexo, Telefono, Email, Direccion,
             MotivoConsulta, Sintomas, Alergias, MedicamentosActuales, Urgencia,
             FechaRegistro, FechaAtencion, Cedula, Atendido
      FROM Paciente
      WHERE Atendido = 1
      ORDER BY FechaAtencion DESC
    `;

    if (req.query.ultimos === "1") {
      query += ' OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY';
    }

    const result = await pool.request().query(query);

    const data = result.recordset.map(p => ({
      id: p.PacienteID,
      expediente: p.Expediente,
      nombre: p.Nombre,
      apellido: p.Apellido,
      sexo: p.Sexo,
      telefono: p.Telefono,
      email: p.Email,
      direccion: p.Direccion,
      motivoConsulta: p.MotivoConsulta,
      sintomas: p.Sintomas,
      alergias: p.Alergias,
      medicamentosActuales: p.MedicamentosActuales,
      urgencia: p.Urgencia,
      fechaRegistro: p.FechaRegistro.toISOString(),
      fechaAtencion: p.FechaAtencion ? p.FechaAtencion.toISOString() : null,
      cedula: p.Cedula,
      atendido: p.Atendido
    }));

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funcion para buscar pacientes por nombre
export const buscarPorNombre = async (req, res) => {
  try {
    const term = (req.query.q || "").toLowerCase().trim();
    if (!term) return res.status(400).json({ error: "Falta parametro q" });

    const pool = await sql.connect();
    const result = await pool.request()
      .input('term', sql.NVarChar, '%' + term + '%')
      .query(`
        SELECT PacienteID, Expediente, Nombre + ' ' + Apellido AS nombre, 
               DATEDIFF(YEAR, FechaNacimiento, GETDATE()) AS edad, 
               Telefono, FechaRegistro, Urgencia, Atendido, Sintomas
        FROM Paciente
        WHERE LOWER(Nombre) LIKE LOWER(@term) OR LOWER(Apellido) LIKE LOWER(@term)
      `);

    const data = result.recordset.map(p => ({
      id: p.PacienteID,
      expediente: p.Expediente,
      nombre: p.nombre,
      edad: p.edad,
      telefono: p.Telefono,
      fechaRegistro: p.FechaRegistro.toISOString(),
      urgencia: p.Urgencia,
      atendido: p.Atendido,
      sintomas: p.Sintomas
    }));

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Funciones para mostrar estructuras en memoria
export const ultimosAtendidos = (_req, res) => {
  return res.json(state.pilaUltimosAtendidos.toArray());
};
export const colaMemoria = (_req, res) => {
  return res.json(state.colaMemoria.toArray());
};
export const historialMemoria = (_req, res) => {
  return res.json(state.historialLista.toArray());
};

// Funcion para atender paciente por id
export const atenderPacientePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect();
    const checkResult = await pool.request()
      .input('pacienteID', sql.Int, id)
      .query('SELECT Atendido FROM Paciente WHERE PacienteID = @pacienteID');

    if (checkResult.recordset.length === 0) return res.status(404).json({ error: "Paciente no encontrado" });
    if (checkResult.recordset[0].Atendido) return res.status(400).json({ error: "Paciente ya fue atendido" });

    const updateResult = await pool.request()
      .input('pacienteID', sql.Int, id)
      .query(`
        UPDATE Paciente
        SET Atendido = 1, FechaAtencion = GETDATE()
        WHERE PacienteID = @pacienteID
        SELECT * FROM Paciente WHERE PacienteID = @pacienteID
      `);

    const p = updateResult.recordset[0];
    return res.json({
      id: p.PacienteID,
      nombre: p.Nombre + ' ' + p.Apellido,
      expediente: p.Expediente,
      urgencia: p.Urgencia,
      atendido: p.Atendido,
      fechaRegistro: p.FechaRegistro.toISOString(),
      fechaAtencion: p.FechaAtencion.toISOString()
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
