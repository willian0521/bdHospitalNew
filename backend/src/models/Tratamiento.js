// Modelo de Tratamiento
export default class Tratamiento {
  constructor(idTratamiento, idExpediente, codigoEmpleado, diagnostico, tratamiento, fechaRegistro) {
    this.idTratamiento = idTratamiento;
    this.idExpediente = idExpediente;
    this.codigoEmpleado = codigoEmpleado;
    this.diagnostico = diagnostico;
    this.tratamiento = tratamiento;
    this.fechaRegistro = fechaRegistro;
  }
}