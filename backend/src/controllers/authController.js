import { sql } from '../../db.js';
import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

const authController = {
  // Login de usuario
  login: async (req, res) => {
    try {
      const { codigoEmpleado, password } = req.body;
      console.log('Login attempt:', { codigoEmpleado, password });

      const result = await sql.query`
        SELECT * FROM Usuario WHERE CodigoEmpleado = ${codigoEmpleado}
      `;

      console.log('Query result:', result.recordset.length, 'users found');

      if (result.recordset.length === 0) {
        console.log('No user found with codigoEmpleado:', codigoEmpleado);
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }

      const userData = result.recordset[0];
      console.log('User data found:', { 
        CodigoEmpleado: userData.CodigoEmpleado, 
        Nombre: userData.Nombre,
        Contrasena: userData.Contrasena 
      });

      const usuario = new Usuario(
        userData.DNI,
        userData.Nombre,
        userData.Apellido,
        userData.Rol,
        userData.TipoMedico,
        userData.CodigoEmpleado,
        userData.Contrasena
      );

      const passwordMatch = usuario.verificarPassword(password);
      console.log('Password verification:', { provided: password, stored: userData.Contrasena, match: passwordMatch });

      if (!passwordMatch) {
        console.log('Password verification failed');
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        {
          dni: usuario.dni,
          nombre: usuario.nombre,
          rol: usuario.rol,
          codigoEmpleado: usuario.codigoEmpleado
        },
        'clave_secreta_jwt',
        { expiresIn: '8h' }
      );

      res.json({
        mensaje: 'Login exitoso',
        token,
        usuario: {
          dni: usuario.dni,
          nombre: usuario.nombre,
          rol: usuario.rol,
          codigoEmpleado: usuario.codigoEmpleado
        }
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Registro de nuevo usuario (solo admin)
  registro: async (req, res) => {
    try {
      const { dni, nombre, apellido, rol, tipoMedico, password } = req.body;

      const existing = await sql.query`
        SELECT * FROM Usuario WHERE DNI = ${dni}
      `;

      if (existing.recordset.length > 0) {
        return res.status(400).json({ mensaje: 'El DNI ya está registrado' });
      }

      let base = 0;
      if (rol === 'Admin') base = 1000;
      else if (rol === 'Medico') base = 2000;
      else if (rol === 'Recepcionista') base = 3000;

      const countResult = await sql.query`
        SELECT COUNT(*) AS count FROM Usuario WHERE Rol = ${rol}
      `;

      const count = countResult.recordset[0].count + 1;
      const codigoEmpleado = (base + count).toString();

      await sql.query`
        INSERT INTO Usuario
        (DNI, Nombre, Apellido, Rol, TipoMedico, CodigoEmpleado, Contrasena)
        VALUES
        (${dni}, ${nombre}, ${apellido}, ${rol}, ${tipoMedico}, ${codigoEmpleado}, ${password})
      `;

      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
          dni,
          nombre,
          rol,
          codigoEmpleado
        }
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Obtener todos los usuarios (solo admin)
  obtenerUsuarios: async (req, res) => {
    try {
      const result = await sql.query`
        SELECT DNI, Nombre, Apellido, Rol, TipoMedico, CodigoEmpleado, Activo
        FROM Usuario
        ORDER BY Nombre, Apellido
      `;

      const usuarios = result.recordset.map(user => ({
        dni: user.DNI,
        nombre: `${user.Nombre} ${user.Apellido}`,
        rol: user.Rol,
        tipoMedico: user.TipoMedico,
        codigoEmpleado: user.CodigoEmpleado,
        activo: user.Activo
      }));

      res.json({
        mensaje: 'Usuarios obtenidos exitosamente',
        usuarios
      });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Actualizar usuario (solo admin)
  actualizarUsuario: async (req, res) => {
    try {
      const { dni } = req.params;
      const { nombre, apellido, rol, tipoMedico, activo, password } = req.body;

      console.log('Actualizar usuario request:', { dni, nombre, apellido, rol, tipoMedico, activo, hasPassword: !!password });

      // Construir UPDATE dinámico para incluir contraseña solo si fue enviada
      if (password) {
        await sql.query`
          UPDATE Usuario
          SET Nombre = ${nombre}, Apellido = ${apellido}, Rol = ${rol},
              TipoMedico = ${tipoMedico}, Activo = ${activo}, Contrasena = ${password}
          WHERE DNI = ${dni}
        `;
        console.log('Contrasena actualizada para DNI:', dni);
      } else {
        await sql.query`
          UPDATE Usuario
          SET Nombre = ${nombre}, Apellido = ${apellido}, Rol = ${rol},
              TipoMedico = ${tipoMedico}, Activo = ${activo}
          WHERE DNI = ${dni}
        `;
      }

      res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Eliminar usuario (solo admin)
  eliminarUsuario: async (req, res) => {
    try {
      const { dni } = req.params;

      await sql.query`
        DELETE FROM Usuario WHERE DNI = ${dni}
      `;

      res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Cambiar estado de usuario (solo admin)
  cambiarEstadoUsuario: async (req, res) => {
    try {
      const { dni } = req.params;
      const { activo } = req.body;

      await sql.query`
        UPDATE Usuario
        SET Activo = ${activo}
        WHERE DNI = ${dni}
      `;

      res.json({ mensaje: 'Estado del usuario actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error en el servidor',
        error: error.message
      });
    }
  },

  // Middleware: verificar token
  verificarToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        mensaje: 'Acceso denegado. Token requerido.'
      });
    }

    try {
      const decoded = jwt.verify(token, 'clave_secreta_jwt');
      req.usuario = decoded;
      next();
    } catch (error) {
      res.status(401).json({ mensaje: 'Token inválido' });
    }
  },

  // Middleware: verificar rol
  verificarRol: (rolesPermitidos) => {
    return (req, res, next) => {
      if (!req.usuario) {
        return res.status(401).json({
          mensaje: 'Usuario no autenticado'
        });
      }

      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          mensaje: 'Acceso denegado. Rol insuficiente.'
        });
      }

      next();
    };
  }
};

export default authController;
