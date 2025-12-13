// Modelo de Expediente
export default class Expediente {
  constructor(idExpediente, dni, fechaRegistro, estado, codigoEmpleado, motivoConsulta, fechaCierre) {
    this.idExpediente = idExpediente;
    this.dni = dni;
    this.fechaRegistro = fechaRegistro;
    this.estado = estado; // 'En espera', 'Atendiendo', 'Atendido'
    this.codigoEmpleado = codigoEmpleado;
    this.motivoConsulta = motivoConsulta;
    this.fechaCierre = fechaCierre;
  }
}