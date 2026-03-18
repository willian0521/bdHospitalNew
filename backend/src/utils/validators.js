import Joi from "joi";

// Esquema para validar los datos de un paciente
export const pacienteSchema = Joi.object({
  nombre: Joi.string().required(), // El nombre es obligatorio
  edad: Joi.number().min(0).max(150).required(), // Edad entre 0 y 150
  fechaNacimiento: Joi.date().required(), // Fecha de nacimiento obligatoria
  cedula: Joi.string()
    .pattern(/^\d{4}-\d{4}-\d{5}$/) // Formato de cedula
    .required()
    .messages({
      "string.pattern.base": "La cédula debe tener el formato XXXX-XXXX-XXXXX",
      "any.required": "La cédula es requerida",
    }),
  sexo: Joi.string().valid("M", "F").required(), // Solo M o F
  telefono: Joi.string()
    .pattern(/^\+504\s\d{4}-\d{4}$/) // Formato de telefono
    .required(),
  email: Joi.string().email().allow(null, ""), // Email puede ser nulo o vacio
  direccion: Joi.string().required(), // Direccion obligatoria

  // Campos medicos
  motivoConsulta: Joi.string().required(),
  sintomas: Joi.string().required(),
  tiempoSintomas: Joi.string().allow(null, ""),
  alergias: Joi.string().allow(null, ""),
  medicamentosActuales: Joi.string().allow(null, ""),

  // Campos de control
  urgencia: Joi.number().valid(1, 2, 3).required(), // Urgencia solo 1,2,3
  expediente: Joi.string()
    .pattern(/^EXP-\d{4}-\d{4}$/) // Formato de expediente
    .required(),
  atendido: Joi.boolean().default(false),
  fechaRegistro: Joi.date(),
  fechaAtencion: Joi.date().allow(null),
});
