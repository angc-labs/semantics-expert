// ejemplos listos para cargar, tomados de las presentaciones del curso
// 10 interpretaciones (ejemplos 1 y 3) y 11 entornos (formulas abiertas)

import type { Entorno, Interpretacion } from "./tipos";

export interface Ejemplo {
  id: string;
  titulo: string;
  // de donde sale en las presentaciones
  fuente: string;
  interpretacion: Interpretacion;
  entorno: Entorno;
  formulas: string[];
}

// atajo para armar una funcion o relacion sin repetir llaves
const rel = (name: string, arity: number, tuples: string[][]) => ({ name, arity, tuples });

export const EJEMPLOS: readonly Ejemplo[] = [
  {
    id: "predicados",
    titulo: "P unario y R binario",
    fuente: "10 Interpretaciones, ejemplo 1",
    interpretacion: {
      dominio: ["1", "2", "3"],
      funciones: {},
      relaciones: {
        P: rel("P", 1, [["1"], ["2"]]),
        R: rel("R", 2, [["1", "3"], ["2", "1"], ["3", "2"]]),
      },
    },
    // x fija la variable libre de la ultima formula (11 entornos)
    entorno: { x: "2" },
    formulas: ["∀x P(x)", "∀x ∃y R(x, y)", "∀x ∀y (P(x) → R(x, y))", "∃y R(x, y)"],
  },
  {
    id: "constante",
    titulo: "constante i, R unario y Q binario",
    fuente: "10 Interpretaciones, ejemplo 3 (sin igualdad)",
    interpretacion: {
      dominio: ["a", "b", "c"],
      funciones: { i: { name: "i", arity: 0, mapping: { "": "a" } } },
      relaciones: {
        R: rel("R", 1, [["b"], ["c"]]),
        Q: rel("Q", 2, [["a", "a"], ["a", "b"], ["a", "c"], ["b", "c"], ["c", "c"]]),
      },
    },
    entorno: {},
    formulas: ["∃y Q(i, y)", "¬R(i)", "∀x ∃y Q(x, y)", "∀x R(x)"],
  },
];

// para que sirve: buscar un ejemplo por su id
export function buscarEjemplo(id: string): Ejemplo | undefined {
  return EJEMPLOS.find((e) => e.id === id);
}
