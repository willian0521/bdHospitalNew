// Clase para crear una pila (stack)
export default class Pila {
  constructor(max = Infinity) {
    this.items = []; // Aqui se guardan los elementos
    this.max = max; // Maximo de elementos que puede tener la pila
  }
  // Mete un elemento arriba de la pila
  push(v) {
    this.items.push(v);
    // Si se pasa del maximo, quita el de abajo
    if (this.items.length > this.max) this.items.shift();
  }
  // Saca el elemento de arriba
  pop() { return this.items.pop() ?? null; }
  // Mira el elemento de arriba sin sacarlo
  peek() { return this.items[this.items.length - 1] ?? null; }
  // Devuelve los elementos como arreglo, el ultimo arriba
  toArray() { return [...this.items].reverse(); }
  // Devuelve el tamaño de la pila
  size() { return this.items.length; }
  // Verifica si esta vacia
  isEmpty() { return this.items.length === 0; }
}
