// Esta clase representa un paciente en el sistema
export default class Paciente {
  constructor({ 
    nombre, 
    edad, 
    fechaNacimiento, 
    cedula,
    sexo,
    telefono,
    email,
    direccion,
    motivoConsulta,
    sintomas, 
    tiempoSintomas,
    alergias,
    medicamentosActuales,
    urgencia, 
    expediente
  }) {
    // Valida el formato del expediente, debe ser tipo EXP-0000-0000
    const expedienteRegex = /^EXP-\d{4}-\d{4}$/;
    if (!expedienteRegex.test(expediente)) {
        throw new Error('Formato de expediente invalido');
    }
    
    // Asigna los datos basicos del paciente
    this.nombre = nombre;
    this.edad = typeof edad === "number" ? edad : null;
    this.fechaNacimiento = fechaNacimiento || null;
    this.cedula = cedula;
    this.sexo = sexo;
    this.telefono = telefono;
    this.email = email || null;
    this.direccion = direccion;
    
    // Info medica
    this.motivoConsulta = motivoConsulta;
    this.sintomas = sintomas;
    this.tiempoSintomas = tiempoSintomas || null;
    this.alergias = alergias || null;
    this.medicamentosActuales = medicamentosActuales || null;
    
    // Datos de control
    this.urgencia = urgencia; // 1,2,3
    this.expediente = expediente;
    this.atendido = false;
    this.fechaRegistro = null;     // serverTimestamp en Firestore
    this.fechaAtencion = null;     // serverTimestamp al atender
  }
}
