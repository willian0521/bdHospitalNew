// Clase para crear un nodo de la lista
class Nodo {
  constructor(valor) {
    this.valor = valor; // El dato que guarda el nodo
    this.siguiente = null; // Apunta al siguiente nodo
  }
}

// Clase para la lista enlazada
export default class ListaEnlazada {
  constructor() {
    this.cabeza = null; // Primer nodo de la lista
    this.longitud = 0; // Cuantos nodos hay
  }
  // Agrega un valor al final de la lista
  push(valor) {
    const n = new Nodo(valor);
    if (!this.cabeza) this.cabeza = n; // Si esta vacia, el nuevo es la cabeza
    else {
      let actual = this.cabeza;
      while (actual.siguiente) actual = actual.siguiente; // Busca el ultimo nodo
      actual.siguiente = n; // Lo agrega al final
    }
    this.longitud++; // Suma uno al tamaño
  }
  // Convierte la lista en un arreglo
  toArray() {
    const arr = [];
    let actual = this.cabeza;
    while (actual) {
      arr.push(actual.valor); // Mete el valor de cada nodo al arreglo
      actual = actual.siguiente; // Pasa al siguiente nodo
    }
    return arr;
  }
  // Devuelve el tamaño de la lista
  size() { return this.longitud; }
}
