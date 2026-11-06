import { describe, it, expect } from "vitest";
import { analizarFormula } from "../sintaxis";
import { textoFormula } from "../formulas";
import { INTERP } from "./ayuda";

function leer(t: string) {
  const r = analizarFormula(t, INTERP);
  if (!r.ok) throw new Error(r.errores.map((e) => e.mensaje).join("|"));
  return textoFormula(r.formula);
}
function errores(t: string) {
  const r = analizarFormula(t, INTERP);
  return r.ok ? [] : r.errores;
}

describe("analizarFormula: precedencia y asociatividad", () => {
  it("¬ ata mas que ∧, ∧ mas que ∨, ∨ mas que →, → mas que ↔", () => {
    expect(leer("¬par(c) ∧ par(c) ∨ par(c) → par(c)")).toBe(
      "((¬par(c) ∧ par(c)) ∨ par(c)) → par(c)"
    );
    expect(leer("par(c) → par(c) ↔ par(c)")).toBe("(par(c) → par(c)) ↔ par(c)");
  });
  it("→ agrupa a la derecha", () => {
    expect(leer("par(c) -> par(c) -> par(c)")).toBe("par(c) → (par(c) → par(c))");
  });
  it("∧ y ∨ agrupan a la izquierda", () => {
    expect(leer("par(c) ∧ par(c) ∧ par(c)")).toBe("(par(c) ∧ par(c)) ∧ par(c)");
  });
  it("el cuantificador solo abarca lo que sigue", () => {
    expect(leer("∀x par(x) ∧ par(y)")).toBe("(∀x par(x)) ∧ par(y)");
    expect(leer("∀x (par(x) ∧ par(y))")).toBe("∀x (par(x) ∧ par(y))");
  });
  it("lee terminos con funciones y constantes", () => {
    expect(leer("menor(s(c), x)")).toBe("menor(s(c), x)");
    expect(leer("E x menor(x, c)")).toBe("∃x menor(x, c)");
  });
});

describe("analizarFormula: errores", () => {
  it("formula vacia, parentesis y conectivos faltantes", () => {
    expect(errores("")[0].tipo).toBe("sintaxis");
    expect(errores("(par(c)")[0].tipo).toBe("sintaxis");
    expect(errores("par(c))")[0].tipo).toBe("sintaxis");
    expect(errores("par(c) ∧")[0].tipo).toBe("sintaxis");
    expect(errores("par(c) par(c)")[0].tipo).toBe("sintaxis");
    expect(errores("∀").length).toBeGreaterThan(0);
    expect(errores("∀ ∧ par(c)").some((e) => e.tipo === "sintaxis")).toBe(true);
  });
  it("simbolos no declarados", () => {
    expect(errores("q(c)").some((e) => e.tipo === "simbolo")).toBe(true);
    expect(errores("par(g(c))").some((e) => e.tipo === "simbolo")).toBe(true);
    expect(errores("s").some((e) => e.tipo === "simbolo")).toBe(true);
    expect(errores("par(menor)").some((e) => e.tipo === "simbolo")).toBe(true);
    expect(errores("∀s par(s)").some((e) => e.tipo === "simbolo")).toBe(true);
  });
  it("aridades incorrectas", () => {
    expect(errores("par(c, c)").some((e) => e.tipo === "aridad")).toBe(true);
    expect(errores("par(s)").some((e) => e.tipo === "aridad")).toBe(true);
    expect(errores("par(s(c, c))").some((e) => e.tipo === "aridad")).toBe(true);
  });
  it("caracteres invalidos", () => {
    expect(errores("par(c) # par(c)")[0].tipo).toBe("sintaxis");
  });
});
