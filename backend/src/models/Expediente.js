// models/Expediente.js
export default class Expediente {
  constructor(idExpediente, dni, fechaRegistro, estado, codigoEmpleado,
              motivoConsulta, fechaCierre, sintomas = [], medicamentos = []) {
    this.idExpediente  = idExpediente;
    this.dni           = dni;
    this.fechaRegistro = fechaRegistro;
    this.estado        = estado;
    this.codigoEmpleado = codigoEmpleado;
    this.motivoConsulta = motivoConsulta;
    this.fechaCierre   = fechaCierre;
    this.sintomas      = sintomas;      // string[]
    this.medicamentos  = medicamentos;  // string[]
  }
}