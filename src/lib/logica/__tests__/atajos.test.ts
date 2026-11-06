import { describe, it, expect } from "vitest";
import { normalizarAtajos } from "../atajos";

describe("normalizarAtajos", () => {
  it("cambia -> y <-> por flechas", () => {
    expect(normalizarAtajos("p -> q")).toBe("p → q");
    expect(normalizarAtajos("p <-> q")).toBe("p ↔ q");
  });
  it("cambia E x por el existencial", () => {
    expect(normalizarAtajos("E x p(x)")).toBe("∃x p(x)");
    expect(normalizarAtajos("(E y q(y))")).toBe("(∃y q(y))");
  });
  it("no toca una e dentro de otra palabra", () => {
    expect(normalizarAtajos("Ex p")).toBe("Ex p");
    expect(normalizarAtajos("AE x")).toBe("AE x");
  });
});
