import { describe, expect, it } from "vitest";
import { normalizarDictado } from "../../voz";

describe("normalizarDictado", () => {
  it("convierte cuantificadores y conectivos hablados", () => {
    expect(normalizarDictado("para todo x, par de x y no impar de x")).toBe(
      "∀x par(x) ∧ ¬ impar(x)"
    );
  });

  it("convierte parentesis, comas y bicondicional", () => {
    expect(normalizarDictado("abre paréntesis P de x coma y si y solo si Q de y cierra paréntesis")).toBe(
      "(P(x,y) ↔ Q(y))"
    );
  });

  it("conserva la formula formal ya escrita", () => {
    expect(normalizarDictado("∃x (P(x) -> Q(x))")).toBe("∃x (P(x) → Q(x))");
  });
});