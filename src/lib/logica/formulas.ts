// parte 3 del analisis: utilidades sobre el arbol de la formula
// sirven para mostrar formulas como texto y para encontrar variables libres

import type { Formula, Termino } from "./tipos";

// para que sirve: escribir un termino, por ejemplo f(x, c)
export function textoTermino(t: Termino): string {
  if (t.tipo === "variable") return t.nombre;
  return t.argumentos.length === 0
    ? t.nombre
    : `${t.nombre}(${t.argumentos.map(textoTermino).join(", ")})`;
}

// para que sirve: escribir una formula con los parentesis necesarios para no confundirse
// el resultado vuelve a leerse como la misma formula
export function textoFormula(f: Formula): string {
  switch (f.tipo) {
    case "atomo":
      return f.argumentos.length === 0
        ? f.predicado
        : `${f.predicado}(${f.argumentos.map(textoTermino).join(", ")})`;
    case "negacion":
      return `¬${f.formula.tipo === "binaria" ? `(${textoFormula(f.formula)})` : textoFormula(f.formula)}`;
    case "binaria": {
      const envolver = (g: Formula) =>
        g.tipo === "binaria" || g.tipo === "cuantificador"
          ? `(${textoFormula(g)})`
          : textoFormula(g);
      return `${envolver(f.izquierda)} ${f.conectivo} ${envolver(f.derecha)}`;
    }
    case "cuantificador":
      return `${f.cuantificador}${f.variable} ${
        f.formula.tipo === "binaria" ? `(${textoFormula(f.formula)})` : textoFormula(f.formula)
      }`;
  }
}

function variablesDeTermino(t: Termino, ligadas: Set<string>, salida: string[]) {
  if (t.tipo === "variable") {
    if (!ligadas.has(t.nombre) && !salida.includes(t.nombre)) salida.push(t.nombre);
    return;
  }
  for (const a of t.argumentos) variablesDeTermino(a, ligadas, salida);
}

function recorrerLibres(f: Formula, ligadas: Set<string>, salida: string[]) {
  switch (f.tipo) {
    case "atomo":
      for (const a of f.argumentos) variablesDeTermino(a, ligadas, salida);
      return;
    case "negacion":
      recorrerLibres(f.formula, ligadas, salida);
      return;
    case "binaria":
      recorrerLibres(f.izquierda, ligadas, salida);
      recorrerLibres(f.derecha, ligadas, salida);
      return;
    case "cuantificador":
      recorrerLibres(f.formula, new Set([...ligadas, f.variable]), salida);
      return;
  }
}

// para que sirve: encontrar las variables libres (las que el entorno debe fijar)
// una variable ligada por un cuantificador no cuenta, pero fuera de su alcance si
// devuelve los nombres en el orden en que aparecen, sin repetir
export function variablesLibres(f: Formula): string[] {
  const salida: string[] = [];
  recorrerLibres(f, new Set(), salida);
  return salida;
}
