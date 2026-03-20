// models/Usuario.js
export default class Usuario {
  constructor(dni, nombre, apellido, rol, tipoMedico, codigoEmpleado, contrasena) {
    this.dni            = dni;
    this.nombre         = nombre;
    this.apellido       = apellido;
    this.rol            = rol;
    this.tipoMedico     = tipoMedico;
    this.codigoEmpleado = codigoEmpleado;
    this.contrasena     = contrasena;
  }

  verificarPassword(password) { return this.contrasena === password; }
  tieneRol(rol)               { return this.rol === rol; }
}