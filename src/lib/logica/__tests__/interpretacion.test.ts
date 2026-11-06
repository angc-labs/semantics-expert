import { describe, it, expect } from "vitest";
import {
  productoCartesiano,
  textoAplicacion,
  textoTupla,
  ajustarAlDominio,
  revisarInterpretacion,
} from "../interpretacion";
import { INTERP } from "./ayuda";

describe("productoCartesiano", () => {
  it("d^0 tiene la tupla vacia", () => expect(productoCartesiano(["a"], 0)).toEqual([[]]));
  it("d^2 tiene n^2 tuplas", () => {
    expect(productoCartesiano(["1", "2"], 2)).toEqual([
      ["1", "1"],
      ["1", "2"],
      ["2", "1"],
      ["2", "2"],
    ]);
  });
  it("dominio vacio o aridad negativa no da tuplas", () => {
    expect(productoCartesiano([], 2)).toEqual([]);
    expect(productoCartesiano(["1"], -1)).toEqual([]);
  });
});

describe("textoAplicacion y textoTupla", () => {
  it("escribe aplicaciones", () => {
    expect(textoAplicacion("c", [])).toBe("c");
    expect(textoAplicacion("f", ["1", "2"])).toBe("f(1, 2)");
  });
  it("escribe tuplas", () => {
    expect(textoTupla(["1"])).toBe("1");
    expect(textoTupla(["1", "2"])).toBe("(1, 2)");
  });
});

describe("ajustarAlDominio", () => {
  it("quita tuplas y mapeos con elementos que ya no estan", () => {
    const r = ajustarAlDominio(["1", "2"], INTERP.funciones, INTERP.relaciones);
    expect(r.relaciones.menor.tuples).toEqual([["1", "2"]]);
    expect(r.funciones.s.mapping).toEqual({ "1": "2", "2": "3" }); // el 3 fuera de d se conserva y la revision lo marca
    expect(r.avisos.length).toBe(1);
  });
});

describe("revisarInterpretacion", () => {
  it("una interpretacion correcta no falla", () => {
    expect(revisarInterpretacion(INTERP, { x: "1" }).every((c) => c.ok)).toBe(true);
  });
  it("detecta dominio vacio o repetido", () => {
    const vacio = revisarInterpretacion({ ...INTERP, dominio: [] }, {});
    expect(vacio.find((c) => c.id === "dominio")?.ok).toBe(false);
    const rep = revisarInterpretacion({ ...INTERP, dominio: ["1", "1"] }, {});
    expect(rep.find((c) => c.id === "dominio")?.ok).toBe(false);
  });
  it("detecta funciones incompletas o fuera de d", () => {
    const interp = {
      ...INTERP,
      funciones: { s: { name: "s", arity: 1, mapping: { "1": "9", "2": "3" } } },
    };
    expect(revisarInterpretacion(interp, {}).find((c) => c.id === "f:s")?.ok).toBe(false);
  });
  it("detecta relaciones vacias o con tuplas malas", () => {
    const vacia = { ...INTERP, relaciones: { p: { name: "p", arity: 1, tuples: [] } } };
    expect(revisarInterpretacion(vacia, {}).find((c) => c.id === "r:p")?.ok).toBe(false);
    const mala = { ...INTERP, relaciones: { p: { name: "p", arity: 1, tuples: [["1", "2"], ["9"]] } } };
    expect(revisarInterpretacion(mala, {}).find((c) => c.id === "r:p")?.ok).toBe(false);
  });
  it("detecta nombres repetidos y entorno invalido", () => {
    const choque = {
      ...INTERP,
      relaciones: { s: { name: "s", arity: 1, tuples: [["1"]] } },
    };
    expect(revisarInterpretacion(choque, {}).find((c) => c.id === "nombres")?.ok).toBe(false);
    expect(revisarInterpretacion(INTERP, { x: "9" }).find((c) => c.id === "s:x")?.ok).toBe(false);
    expect(revisarInterpretacion(INTERP, { c: "1" }).find((c) => c.id === "s:c")?.ok).toBe(false);
  });
});
