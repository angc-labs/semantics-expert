// parte 1 del analisis: lexico
// convierte el texto escrito por el usuario en una lista de piezas (tokens)
// no revisa si la formula tiene sentido, eso lo hace sintaxis.ts

import { normalizarAtajos } from "./atajos";
import type { ErrorLogico } from "./errores";

export type TipoToken =
  | "nombre"
  | "negacion"
  | "conjuncion"
  | "disyuncion"
  | "implicacion"
  | "bicondicional"
  | "universal"
  | "existencial"
  | "abre"
  | "cierra"
  | "coma"
  | "fin";

export interface Token {
  tipo: TipoToken;
  // texto tal como quedo despues de normalizar atajos
  texto: string;
  // posicion (desde 0) dentro del texto normalizado
  posicion: number;
}

const SIMBOLOS: Record<string, TipoToken> = {
  "¬": "negacion",
  "∧": "conjuncion",
  "∨": "disyuncion",
  "→": "implicacion",
  "↔": "bicondicional",
  "∀": "universal",
  "∃": "existencial",
  "(": "abre",
  ")": "cierra",
  ",": "coma",
};

const ES_INICIO_NOMBRE = /[A-Za-z]/;
const ES_PARTE_NOMBRE = /[A-Za-z0-9_]/;

// para que sirve: partir el texto de una formula en tokens
// devuelve los tokens (siempre terminan con "fin") o los errores de caracteres invalidos
export function tokenizar(
  entrada: string
): { tokens: Token[]; texto: string; errores: ErrorLogico[] } {
  const texto = normalizarAtajos(entrada);
  const tokens: Token[] = [];
  const errores: ErrorLogico[] = [];
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const simbolo = SIMBOLOS[c];
    if (simbolo) {
      tokens.push({ tipo: simbolo, texto: c, posicion: i });
      i++;
      continue;
    }
    if (ES_INICIO_NOMBRE.test(c)) {
      let j = i + 1;
      while (j < texto.length && ES_PARTE_NOMBRE.test(texto[j])) j++;
      tokens.push({ tipo: "nombre", texto: texto.slice(i, j), posicion: i });
      i = j;
      continue;
    }
    errores.push({
      tipo: "sintaxis",
      mensaje: `Carácter no válido "${c}" en la posición ${i + 1}.`,
      posicion: i,
    });
    i++;
  }

  tokens.push({ tipo: "fin", texto: "", posicion: texto.length });
  return { tokens, texto, errores };
}
