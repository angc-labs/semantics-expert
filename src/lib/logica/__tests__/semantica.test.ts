import { describe, it, expect } from "vitest";
import { analizarFormula } from "../sintaxis";
import { evaluarTermino, evaluarFormula } from "../semantica";
import { INTERP } from "./ayuda";

function ev(t: string, entorno = {}) {
  const r = analizarFormula(t, INTERP);
  if (!r.ok) throw new Error("no se pudo leer");
  return evaluarFormula(r.formula, INTERP, entorno);
}

describe("evaluarTermino", () => {
  it("evalua variables, constantes y funciones anidadas", () => {
    expect(evaluarTermino({ tipo: "variable", nombre: "x" }, INTERP, { x: "2" })).toBe("2");
    const c = { tipo: "funcion" as const, nombre: "c", argumentos: [] };
    expect(evaluarTermino(c, INTERP, {})).toBe("1");
    expect(evaluarTermino({ tipo: "funcion", nombre: "s", argumentos: [c] }, INTERP, {})).toBe("2");
  });
  it("falla si falta la variable", () => {
    expect(() => evaluarTermino({ tipo: "variable", nombre: "x" }, INTERP, {})).toThrow();
  });
});

describe("evaluarFormula", () => {
  it("atomos", () => {
    expect(ev("par(x)", { x: "2" }).valor).toBe(true);
    expect(ev("par(x)", { x: "1" }).valor).toBe(false);
    expect(ev("menor(c, s(c))").valor).toBe(true);
  });
  it("tabla de verdad de los conectivos", () => {
    const e = { x: "2", y: "1" }; // par(x) verdadero, par(y) falso
    expect(ev("¬par(y)", e).valor).toBe(true);
    expect(ev("par(x) ∧ par(y)", e).valor).toBe(false);
    expect(ev("par(x) ∨ par(y)", e).valor).toBe(true);
    expect(ev("par(x) → par(y)", e).valor).toBe(false);
    expect(ev("par(y) → par(x)", e).valor).toBe(true);
    expect(ev("par(y) ↔ par(y)", e).valor).toBe(true);
    expect(ev("par(x) ↔ par(y)", e).valor).toBe(false);
  });
  it("existencial verdadero da testigo", () => {
    const r = ev("∃x par(x)");
    expect(r.valor).toBe(true);
    expect(r.justificacion).toBe("testigo");
    expect(r.elemento).toBe("2");
  });
  it("universal falso da contraejemplo", () => {
    const r = ev("∀x par(x)");
    expect(r.valor).toBe(false);
    expect(r.justificacion).toBe("contraejemplo");
    expect(r.elemento).toBe("1");
  });
  it("universal verdadero y existencial falso dan comprobacion completa", () => {
    const u = ev("∀x (par(x) ∨ ¬par(x))");
    expect(u.valor).toBe(true);
    expect(u.justificacion).toBe("completa");
    expect(u.hijos).toHaveLength(3);
    const e = ev("∃x menor(x, x)");
    expect(e.valor).toBe(false);
    expect(e.justificacion).toBe("completa");
    expect(e.hijos).toHaveLength(3);
  });
  it("cuantificadores anidados y variable libre", () => {
    expect(ev("∀x ∃y (menor(x, y) ∨ menor(y, x))").valor).toBe(true);
    expect(ev("∃y menor(x, y)", { x: "3" }).valor).toBe(false);
    expect(ev("∀x par(x) ∧ par(x)", { x: "2" }).valor).toBe(false);
  });
  it("un cuantificador interno tapa la variable del entorno", () => {
    expect(ev("∃x par(x)", { x: "1" }).valor).toBe(true);
  });
});
