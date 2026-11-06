import { describe, it, expect } from "vitest";
import { EJEMPLOS } from "../ejemplos";
import { evaluar } from "../evaluador";

// valores esperados calculados a mano con las definiciones de las presentaciones
const ESPERADOS: Record<string, boolean[]> = {
  predicados: [false, true, false, true],
  constante: [true, true, true, false],
};

describe("ejemplos de las presentaciones", () => {
  for (const ej of EJEMPLOS) {
    it(`${ej.id}: todas las formulas son validas y dan el valor esperado`, () => {
      ej.formulas.forEach((f, i) => {
        const r = evaluar(f, ej.interpretacion, ej.entorno);
        expect(r.ok, f).toBe(true);
        if (r.ok) expect(r.valor, f).toBe(ESPERADOS[ej.id][i]);
      });
    });
  }
});
