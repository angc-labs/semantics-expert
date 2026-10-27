// tipos que comparten la pantalla y la parte de logica que se hara despues

// una funcion guarda su nombre, cuantos argumentos recibe y que valor da en cada caso
// la llave del mapeo son los argumentos separados por coma, por ejemplo "1,2"
// si la aridad es 0 es una constante: solo tiene la llave "" (texto vacio)
export interface FunctionDef {
  name: string;
  arity: number;
  mapping: Record<string, string>;
}

// una relacion (predicado) guarda su nombre, su aridad y la lista de tuplas que la cumplen
// por ejemplo menor/2 con tuplas [["1", "2"], ["1", "3"]]
export interface RelationDef {
  name: string;
  arity: number;
  tuples: string[][];
}

// la interpretacion completa: el dominio y lo que significa cada simbolo
export interface Interpretacion {
  dominio: string[];
  funciones: Record<string, FunctionDef>;
  relaciones: Record<string, RelationDef>;
}

// el entorno dice que elemento del dominio le toca a cada variable libre
export type Entorno = Record<string, string>;

// ----------------------------------------------------------------------------
// forma que tendra una formula cuando se lea (todavia no hay quien la llene)
// ----------------------------------------------------------------------------

// un termino es una variable o una funcion aplicada a otros terminos
// una constante es una funcion sin argumentos, por ejemplo c se guarda como funcion "c" con []
// al leer un nombre suelto: si esta declarado como constante es constante, si no es variable
export type Termino =
  | { tipo: "variable"; nombre: string }
  | { tipo: "funcion"; nombre: string; argumentos: Termino[] };

export type Conectivo = "∧" | "∨" | "→" | "↔";
export type Cuantificador = "∀" | "∃";

export type Formula =
  | { tipo: "atomo"; predicado: string; argumentos: Termino[] }
  | { tipo: "negacion"; formula: Formula }
  | { tipo: "binaria"; conectivo: Conectivo; izquierda: Formula; derecha: Formula }
  | { tipo: "cuantificador"; cuantificador: Cuantificador; variable: string; formula: Formula };

// ----------------------------------------------------------------------------
// reglas de lectura acordadas con el equipo
// ----------------------------------------------------------------------------

// orden de fuerza de los conectivos, del que amarra mas al que amarra menos
// ¬ > ∧ > ∨ > → > ↔
// ejemplo: ¬p ∧ q ∨ r → s se lee ((¬p ∧ q) ∨ r) → s
export const PRECEDENCIA: readonly string[] = ["¬", "∧", "∨", "→", "↔"];

// la flecha agrupa hacia la derecha: p → q → r se lee p → (q → r)
// ∧ y ∨ agrupan hacia la izquierda (da lo mismo para el resultado)
//
// el cuantificador solo abarca lo que tiene justo despues:
// ∀x p(x) ∧ q(x) se lee (∀x p(x)) ∧ q(x), y ahi la x de q(x) queda libre
// si se quiere que abarque todo hay que usar parentesis: ∀x (p(x) ∧ q(x))
//
// la igualdad (=) no forma parte del lenguaje
