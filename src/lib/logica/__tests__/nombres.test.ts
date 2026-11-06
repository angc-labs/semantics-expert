import { describe, it, expect } from "vitest";
import { revisarNombre } from "../nombres";
import { INTERP } from "./ayuda";

describe("revisarNombre", () => {
  it("acepta un nombre libre", () => {
    expect(revisarNombre("g", "funcion", INTERP)).toBeNull();
  });
  it("rechaza vacio, mal formado y reservado", () => {
    expect(revisarNombre("  ", "funcion", INTERP)).not.toBeNull();
    expect(revisarNombre("1a", "relacion", INTERP)).not.toBeNull();
    expect(revisarNombre("E", "variable", INTERP)).not.toBeNull();
  });
  it("rechaza choques entre tipos de simbolo", () => {
    expect(revisarNombre("par", "funcion", INTERP)).not.toBeNull();
    expect(revisarNombre("s", "relacion", INTERP)).not.toBeNull();
    expect(revisarNombre("s", "variable", INTERP)).not.toBeNull();
    expect(revisarNombre("menor", "variable", INTERP)).not.toBeNull();
  });
  it("permite el mismo nombre al editar", () => {
    expect(revisarNombre("s", "funcion", INTERP)).not.toBeNull();
    expect(revisarNombre("s", "funcion", INTERP, "s")).toBeNull();
  });
});
