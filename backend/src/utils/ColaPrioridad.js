// Menor numero = mayor prioridad (1 alta, 2 media, 3 baja)
export default class ColaPrioridad {
  constructor(compareFn) {
    // Arreglo donde se guardan los elementos
    this.items = [];
    // Funcion para comparar prioridad y fecha
    this.compare = compareFn || ((a, b) => a.urgencia - b.urgencia || a.fechaRegistro - b.fechaRegistro);
  }
  // Agrega un elemento segun su prioridad
  enqueue(elem) {
    if (this.items.length === 0) return this.items.push(elem);
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.compare(elem, this.items[i]) < 0) {
        this.items.splice(i, 0, elem);
        inserted = true;
        break;
      }
    }
    if (!inserted) this.items.push(elem);
  }
  // Saca el elemento con mayor prioridad
  dequeue() { return this.items.shift() ?? null; }
  // Mira el primero sin sacarlo
  peek() { return this.items[0] ?? null; }
  // Verifica si esta vacia
  isEmpty() { return this.items.length === 0; }
  // Devuelve los elementos como arreglo
  toArray() { return [...this.items]; }
  // Devuelve el tamaño
  size() { return this.items.length; }
}
