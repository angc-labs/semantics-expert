// interpretacion de ejemplo que usan los tests
// d = {1, 2, 3}, menor/2 (orden estricto), par/1, s/1 (sucesor con tope en 3), c (constante 1)

import type { Interpretacion } from "../tipos";

export const INTERP: Interpretacion = {
  dominio: ["1", "2", "3"],
  funciones: {
    c: { name: "c", arity: 0, mapping: { "": "1" } },
    s: { name: "s", arity: 1, mapping: { "1": "2", "2": "3", "3": "3" } },
  },
  relaciones: {
    menor: {
      name: "menor",
      arity: 2,
      tuples: [
        ["1", "2"],
        ["1", "3"],
        ["2", "3"],
      ],
    },
    par: { name: "par", arity: 1, tuples: [["2"]] },
  },
};
