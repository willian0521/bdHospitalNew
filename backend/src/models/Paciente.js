// models/Paciente.js
export default class Paciente {
  constructor(dni, nombre, apellido, fechaNacimiento,
              direccion, telefono, email, sexo, alergias = []) {
    this.dni            = dni;
    this.nombre         = nombre;
    this.apellido       = apellido;
    this.fechaNacimiento = fechaNacimiento;
    this.direccion      = direccion;
    this.telefono       = telefono;
    this.email          = email;
    this.sexo           = sexo;
    this.alergias       = alergias; // string[]
  }
}