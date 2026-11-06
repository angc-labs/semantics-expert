import { describe, it, expect } from "vitest";
import { tokenizar } from "../lexico";

describe("tokenizar", () => {
  it("separa simbolos y nombres", () => {
    const { tokens, errores } = tokenizar("∀x (p(x) ∧ ¬q)");
    expect(errores).toEqual([]);
    expect(tokens.map((t) => t.tipo)).toEqual([
      "universal", "nombre", "abre", "nombre", "abre", "nombre", "cierra",
      "conjuncion", "negacion", "nombre", "cierra", "fin",
    ]);
  });
  it("aplica los atajos de teclado", () => {
    const { tokens } = tokenizar("E x p(x) -> q <-> r");
    expect(tokens.map((t) => t.tipo)).toContain("existencial");
    expect(tokens.map((t) => t.tipo)).toContain("implicacion");
    expect(tokens.map((t) => t.tipo)).toContain("bicondicional");
  });
  it("reporta caracteres invalidos", () => {
    const { errores } = tokenizar("p $ q");
    expect(errores).toHaveLength(1);
    expect(errores[0].tipo).toBe("sintaxis");
  });
  it("siempre termina con fin", () => {
    expect(tokenizar("").tokens.map((t) => t.tipo)).toEqual(["fin"]);
  });
});
