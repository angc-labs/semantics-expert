// ejemplos de interpretaciones y entornos
// los ejemplos ahora se gestionan dinámicamente como plantillas desde los notebooks

import type { Entorno, Interpretacion } from "./tipos";

export interface Ejemplo {
  id: string;
  titulo: string;
  fuente: string;
  interpretacion: Interpretacion;
  entorno: Entorno;
  formulas: string[];
}

// sin ejemplos hardcodeados: el usuario guarda sus propias plantillas usando el bookmark de notebooks
export const EJEMPLOS: readonly Ejemplo[] = [];

// para que sirve: buscar un ejemplo por su id
export function buscarEjemplo(id: string): Ejemplo | undefined {
  return EJEMPLOS.find((e) => e.id === id);
}
