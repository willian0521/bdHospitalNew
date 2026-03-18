// Estado en memoria para demostrar estructuras (no reemplaza Firestore)
import Pila from "./Pila.js";
import ListaEnlazada from "./ListaEnlazada.js";
import ColaPrioridad from "./ColaPrioridad.js";

// Aqui se crean las estructuras en memoria
const state = {
  pilaUltimosAtendidos: new Pila(10), // Guarda los ultimos 10 pacientes atendidos
  historialLista: new ListaEnlazada(), // Guarda el historial de pacientes atendidos
  colaMemoria: new ColaPrioridad() // Cola de prioridad para pacientes esperando
};

let pacientes = []; // Simulacion en memoria de los pacientes

export default {
  ...state,
  getPacientes: () => pacientes, // Devuelve todos los pacientes en memoria
  atenderPaciente: (id) => { // Marca un paciente como atendido
    const paciente = pacientes.find(p => p.id === id);
    if (paciente && !paciente.atendido) {
      paciente.atendido = true;
      paciente.status = 'atendido';
      paciente.fechaAtencion = new Date();
      return true;
    }
    return false;
  },
  cambiarEstadoPaciente: (id, status) => { // Cambia el estado del paciente
    const paciente = pacientes.find(p => p.id === id);
    if (paciente) {
      paciente.status = status;
      return true;
    }
    return false;
  },
  cambiarUrgenciaPaciente: (id, urgencia) => { // Cambia la urgencia del paciente
    const paciente = pacientes.find(p => p.id === id);
    if (paciente) {
      paciente.urgencia = urgencia;
      return true;
    }
    return false;
  },
  // ... otras funciones ...
};
