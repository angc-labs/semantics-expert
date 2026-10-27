// reglas para los nombres de funciones, constantes, relaciones y variables

import type { Interpretacion } from "./tipos";

// estas letras se usan para el atajo e x (existe)
export const NOMBRES_RESERVADOS = ["E"];

// un nombre empieza con letra y despues puede llevar letras, numeros o _
const PATRON_NOMBRE = /^[A-Za-z][A-Za-z0-9_]*$/;

export type TipoSimbolo = "funcion" | "relacion" | "variable";

// revisa si un nombre se puede usar
// devuelve el problema en texto, o null si todo esta bien
// nombreoriginal sirve cuando se esta editando: permite dejar el mismo nombre
export function revisarNombre(
  nombre: string,
  tipo: TipoSimbolo,
  interp: Pick<Interpretacion, "funciones" | "relaciones">,
  nombreOriginal?: string
): string | null {
  const n = nombre.trim();
  if (!n) return "Escribe un nombre.";
  if (!PATRON_NOMBRE.test(n)) {
    return "El nombre debe empezar con una letra y solo llevar letras, números o _.";
  }
  if (NOMBRES_RESERVADOS.includes(n)) {
    return "E está reservada para el atajo E x (∃x).";
  }

  if (tipo === "funcion") {
    if (interp.relaciones[n]) return `Ya hay una relación llamada ${n}.`;
    if (interp.funciones[n] && n !== nombreOriginal) {
      return `Ya existe la función ${n}; edítala desde su chip.`;
    }
  }

  if (tipo === "relacion") {
    if (interp.funciones[n]) return `Ya hay una función o constante llamada ${n}.`;
    if (interp.relaciones[n] && n !== nombreOriginal) {
      return `Ya existe la relación ${n}; edítala desde su chip.`;
    }
  }

  if (tipo === "variable") {
    if (interp.funciones[n]) return `${n} ya es el nombre de una función o constante.`;
    if (interp.relaciones[n]) return `${n} ya es el nombre de una relación.`;
  }

  return null;
}
