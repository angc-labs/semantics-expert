// atajos de teclado para escribir simbolos sin tener que buscarlos
//
//   ->    se cambia por  →
//   <->   se cambia por  ↔
//   e x   se cambia por  ∃x
//
// por eso e no se puede usar como nombre de simbolo ni de variable

export const ATAJOS = [
  { escribe: "->", queda: "→" },
  { escribe: "<->", queda: "↔" },
  { escribe: "E x", queda: "∃x" },
] as const;

export function normalizarAtajos(texto: string): string {
  return (
    texto
      // primero <-> para que no se confunda con ->
      .replace(/<->/g, "↔")
      .replace(/->/g, "→")
      // una e sola (que no sea parte de otra palabra), un espacio y luego una variable
      .replace(/(^|[^A-Za-z0-9_])E[ \t]+(?=[A-Za-z_])/g, (_m, antes: string) =>
        antes + "∃"
      )
  );
}
