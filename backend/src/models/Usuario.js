// Modelo de Usuario
class Usuario {
  constructor(id, nombre, email, password, rol) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.password = password; // En producción, hashear la contraseña
    this.rol = rol; // 'admin', 'medico', 'recepcionista'
  }

  // Método para verificar contraseña (simplificado)
  verificarPassword(password) {
    return this.password === password;
  }

  // Método para verificar rol
  tieneRol(rol) {
    return this.rol === rol;
  }
}

export default Usuario;
