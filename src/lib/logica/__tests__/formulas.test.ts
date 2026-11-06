import { describe, it, expect } from "vitest";
import { analizarFormula } from "../sintaxis";
import { textoTermino, textoFormula, variablesLibres } from "../formulas";
import { INTERP } from "./ayuda";

function arbol(t: string) {
  const r = analizarFormula(t, INTERP);
  if (!r.ok) throw new Error("no se pudo leer");
  return r.formula;
}

describe("textoTermino y textoFormula", () => {
  it("escribe terminos", () => {
    expect(textoTermino({ tipo: "variable", nombre: "x" })).toBe("x");
    expect(textoTermino({ tipo: "funcion", nombre: "c", argumentos: [] })).toBe("c");
  });
  it("lo escrito vuelve a leerse igual", () => {
    for (const t of ["¬(par(x) ∨ par(y))", "∀x ∃y (menor(x, y) → par(s(y)))", "¬∀x par(x)"]) {
      const f = arbol(t);
      expect(arbol(textoFormula(f))).toEqual(f);
    }
  });
});

describe("variablesLibres", () => {
  it("formula cerrada no tiene libres", () => {
    expect(variablesLibres(arbol("∀x ∃y menor(x, y)"))).toEqual([]);
  });
  it("devuelve libres en orden y sin repetir", () => {
    expect(variablesLibres(arbol("menor(y, x) ∧ par(y)"))).toEqual(["y", "x"]);
  });
  it("una variable queda libre fuera del alcance del cuantificador", () => {
    expect(variablesLibres(arbol("∀x par(x) ∧ par(x)"))).toEqual(["x"]);
    expect(variablesLibres(arbol("∀x (par(x) ∧ par(z))"))).toEqual(["z"]);
  });
});
