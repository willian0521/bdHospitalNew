// Modelo de Usuario
class Usuario {
  constructor(dni, nombre, apellido, rol, tipoMedico, codigoEmpleado, contrasena) {
    this.dni = dni;
    this.nombre = nombre;
    this.apellido = apellido;
    this.rol = rol; // 'Admin', 'Medico', 'Recepcionista'
    this.tipoMedico = tipoMedico; // Solo para Medico
    this.codigoEmpleado = codigoEmpleado; // Generado automáticamente
    this.contrasena = contrasena; // En producción, hashear la contraseña
  }

  // mettodo para verificar contraseña 
  verificarPassword(password) {
    return this.contrasena === password;
  }

  // Mtodo para verificar rol
  tieneRol(rol) {
    return this.rol === rol;
  }
}

export default Usuario;
