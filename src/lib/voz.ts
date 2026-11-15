import { normalizarAtajos } from "./logica/atajos";

//Convierte expresiones habituales del dictado en la notacion formal del proyecto.
export function normalizarDictado(texto: string): string {
  let salida = texto.trim();
  if (!salida) return "";

  salida = salida
    .replace(/[¿?¡!]/g, " ")
    .replace(/\b(de|coma)\s+y\b/gi, "$1 __VOZ_VARIABLE_Y__ ")
    .replace(/\bsi y solo si\b/gi, " ↔ ")
    .replace(/\bsi solamente si\b/gi, " ↔ ")
    .replace(/\bimplica(?: que)?\b/gi, " → ")
    .replace(/\bentonces\b/gi, " → ")
    .replace(/\by\b/gi, " ∧ ")
    .replace(/\bo\b/gi, " ∨ ")
    .replace(/\b(?:no|negacion de|negación de)\b/gi, " ¬ ")
    .replace(/\bpara todo\s+([A-Za-z][A-Za-z0-9_]*)\s*,?/gi, "∀$1 ")
    .replace(/\bpara cada\s+([A-Za-z][A-Za-z0-9_]*)\s*,?/gi, "∀$1 ")
    .replace(/\bexiste(?: al menos un| una)?\s+([A-Za-z][A-Za-z0-9_]*)\b/gi, "∃$1 ")
    .replace(/\b(?:abre|abrir) par(?:e|é)ntesis\b/gi, " ( ")
    .replace(/\b(?:cierra|cerrar) par(?:e|é)ntesis\b/gi, " ) ")
    .replace(/\bcoma\b/gi, " , ")
    .replace(/__VOZ_VARIABLE_Y__/g, "y")
    .replace(/\bpor\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  //Permite dictar "P de x" o "P de x coma y" sin obligar a pronunciar parentesis.
  salida = salida.replace(
    /\b([A-Za-z][A-Za-z0-9_]*)\s+de\s+([A-Za-z][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z][A-Za-z0-9_]*)*)/gi,
    (_match, nombre: string, argumentos: string) => `${nombre}(${argumentos.replace(/\s+/g, "")})`
  );

  return normalizarAtajos(salida)
    .replace(/([∀∃][^\s,()]+),\s*/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}