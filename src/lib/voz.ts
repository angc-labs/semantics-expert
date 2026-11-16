//Convierte expresiones habituales del dictado en la notacion formal del proyecto.
export function normalizarDictado(texto: string): string {
  let salida = texto.trim();
  if (!salida) return "";

  salida = salida
    .replace(/[¿?¡!]/g, " ")
    .replace(/\b(de|coma)\s+(y|o)\b/gi, "$1 __VOZ_VARIABLE_$2__ ")
    .replace(/\b(?:predicado|relación|relacion|símbolo|simbolo|función|funcion|constante)\s+/gi, "")
    .replace(/\bsi y solo si\b/gi, " ↔ ")
    .replace(/\bsi solamente si\b/gi, " ↔ ")
    .replace(/\bimplica(?: que)?\b/gi, " → ")
    .replace(/\bentonces\b/gi, " → ")
    .replace(/\b(?:no|negacion de|negación de)\b/gi, " ¬ ")
    .replace(/\bpara todo\s+([A-Za-z][A-Za-z0-9_]*)\s*,?/gi, "∀__VOZ_CUANT_$1__ ")
    .replace(/\bpara cada\s+([A-Za-z][A-Za-z0-9_]*)\s*,?/gi, "∀__VOZ_CUANT_$1__ ")
    .replace(/\bexiste(?: al menos un| una)?\s+([A-Za-z][A-Za-z0-9_]*)\b/gi, "∃__VOZ_CUANT_$1__ ")
    .replace(/\btal que\b/gi, " ")
    .replace(/\b(?:conjunción|conjuncion)\b/gi, " ∧ ")
    .replace(/\b(?:disyunción|disyuncion)\b/gi, " ∨ ")
    .replace(/\b(?:y|además)\b/gi, " ∧ ")
    .replace(/\b(?:o|alternativamente)\b/gi, " ∨ ")
    .replace(/([∀∃])__VOZ_CUANT_([A-Za-z][A-Za-z0-9_]*)__ /g, "$1$2 ")
    .replace(/\b(?:abre|abrir) par(?:e|é)ntesis\b/gi, " ( ")
    .replace(/\b(?:cierra|cerrar) par(?:e|é)ntesis\b/gi, " ) ")
    .replace(/\bcoma\b/gi, " , ")
    .replace(/__VOZ_VARIABLE_(Y|O)__/gi, (_match, variable: string) => variable.toLowerCase())
    .replace(/\b(?:cero|zero)\b/gi, "0")
    .replace(/\buno\b/gi, "1")
    .replace(/\bdos\b/gi, "2")
    .replace(/\btres\b/gi, "3")
    .replace(/\bcuatro\b/gi, "4")
    .replace(/\bcinco\b/gi, "5")
    .replace(/\bseis\b/gi, "6")
    .replace(/\bsiete\b/gi, "7")
    .replace(/\bocho\b/gi, "8")
    .replace(/\bnueve\b/gi, "9")
    .replace(/\bdiez\b/gi, "10")
    .replace(/\bpor\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  //Permite dictar "P de x" o "P de x coma y" sin obligar a pronunciar parentesis.
  salida = salida.replace(
    /\b([A-Za-z][A-Za-z0-9_]*)\s+de\s+([A-Za-z0-9_]+(?:\s*,\s*[A-Za-z0-9_]+)*)/gi,
    (_match, nombre: string, argumentos: string) => `${nombre}(${argumentos.replace(/\s+/g, "")})`
  );

  return salida
    .replace(/<->/g, "↔")
    .replace(/->/g, "→")
    .replace(/([∀∃][^\s,()]+),\s*/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}
