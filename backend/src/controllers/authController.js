import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

// Simulación de base de datos de usuarios (en producción usar BD)
const usuarios = [
  new Usuario(1, 'Admin', 'admin@hospital.com', 'admin123', 'admin'),
  new Usuario(2, 'Dr. García', 'medico@hospital.com', 'medico123', 'medico'),
  new Usuario(3, 'Recepcionista', 'recepcion@hospital.com', 'recepcion123', 'recepcionista')
];

const authController = {
  // Login de usuario
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const usuario = usuarios.find(u => u.email === email);

      if (!usuario || !usuario.verificarPassword(password)) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
        'clave_secreta_jwt', // En producción, usar variable de entorno
        { expiresIn: '8h' }
      );

      res.json({
        mensaje: 'Login exitoso',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Registro de nuevo usuario (solo para admin)
  registro: async (req, res) => {
    try {
      const { nombre, email, password, rol } = req.body;

      // Verificar si el usuario ya existe
      if (usuarios.find(u => u.email === email)) {
        return res.status(400).json({ mensaje: 'El email ya está registrado' });
      }

      const nuevoUsuario = new Usuario(
        usuarios.length + 1,
        nombre,
        email,
        password,
        rol
      );

      usuarios.push(nuevoUsuario);

      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          rol: nuevoUsuario.rol
        }
      });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
  },

  // Verificar token (middleware)
  verificarToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ mensaje: 'Acceso denegado. Token requerido.' });
    }

    try {
      const decoded = jwt.verify(token, 'clave_secreta_jwt');
      req.usuario = decoded;
      next();
    } catch (error) {
      res.status(401).json({ mensaje: 'Token inválido' });
    }
  },

  // Middleware para verificar roles
  verificarRol: (rolesPermitidos) => {
    return (req, res, next) => {
      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'Usuario no autenticado' });
      }

      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Rol insuficiente.' });
      }

      next();
    };
  }
};

export default authController;