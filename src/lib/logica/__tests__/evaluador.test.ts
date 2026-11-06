import { describe, it, expect } from "vitest";
import { evaluar, erroresDeInterpretacion, erroresDeEntorno } from "../evaluador";
import { INTERP } from "./ayuda";

describe("erroresDeInterpretacion", () => {
  it("no hay errores en una interpretacion correcta", () => {
    expect(erroresDeInterpretacion(INTERP, {})).toEqual([]);
  });
  it("clasifica los errores por tipo", () => {
    expect(erroresDeInterpretacion({ ...INTERP, dominio: [] }, {})[0].tipo).toBe("dominio");
    expect(erroresDeInterpretacion(INTERP, { x: "9" })[0].tipo).toBe("entorno");
    const vacia = { ...INTERP, relaciones: { p: { name: "p", arity: 1, tuples: [] } } };
    expect(erroresDeInterpretacion(vacia, {})[0].tipo).toBe("tupla");
  });
});

describe("erroresDeEntorno", () => {
  it("avisa de libres sin valor", () => {
    expect(erroresDeEntorno(["x", "y"], { x: "1" })).toHaveLength(1);
    expect(erroresDeEntorno(["x"], { x: "1" })).toEqual([]);
  });
});

describe("evaluar", () => {
  it("da Verdadero o Falso con explicacion", () => {
    const v = evaluar("∃x par(x)", INTERP, {});
    expect(v.ok && v.etiqueta).toBe("Verdadero");
    const f = evaluar("∀x par(x)", INTERP, {});
    expect(f.ok && f.etiqueta).toBe("Falso");
    expect(f.ok && f.explicacion.justificacion).toBe("contraejemplo");
  });
  it("informa las variables libres", () => {
    const r = evaluar("par(x)", INTERP, { x: "2" });
    expect(r.ok && r.variablesLibres).toEqual(["x"]);
  });
  it("sin valor de verdad si falta una asignacion", () => {
    const r = evaluar("par(x)", INTERP, {});
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores[0].tipo).toBe("entorno");
  });
  it("sin valor de verdad si la sintaxis falla", () => {
    expect(evaluar("par(", INTERP, {}).ok).toBe(false);
  });
  it("sin valor de verdad si la interpretacion es invalida", () => {
    expect(evaluar("∃x par(x)", { ...INTERP, dominio: [] }, {}).ok).toBe(false);
    const sinTuplas = { ...INTERP, relaciones: { par: { name: "par", arity: 1, tuples: [] } } };
    expect(evaluar("∃x par(x)", sinTuplas, {}).ok).toBe(false);
  });
});
