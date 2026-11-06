// parte 5: punto de entrada de la logica
// junta todas las partes en el orden del proyecto:
//   1. sintaxis de la formula (sintaxis.ts)
//   2. revision de interpretacion y entorno (interpretacion.ts)
//   3. variables libres con valor en el entorno (formulas.ts)
//   4. evaluacion con explicacion (semantica.ts)
// si algun paso falla no se da valor de verdad (requisito 7)

import type { Entorno, Formula, Interpretacion } from "./tipos";
import type { ErrorLogico } from "./errores";
import { analizarFormula } from "./sintaxis";
import { revisarInterpretacion } from "./interpretacion";
import { variablesLibres } from "./formulas";
import { evaluarFormula, type Explicacion } from "./semantica";

export type ResultadoEvaluacion =
  | {
      ok: true;
      valor: boolean;
      etiqueta: "Verdadero" | "Falso";
      formula: Formula;
      variablesLibres: string[];
      explicacion: Explicacion;
    }
  | { ok: false; errores: ErrorLogico[] };

// para que sirve: traducir las revisiones de la interpretacion a errores con tipo
// solo se convierten las revisiones que fallaron
export function erroresDeInterpretacion(interp: Interpretacion, entorno: Entorno): ErrorLogico[] {
  const errores: ErrorLogico[] = [];
  for (const c of revisarInterpretacion(interp, entorno)) {
    if (c.ok) continue;
    const tipo: ErrorLogico["tipo"] =
      c.id === "dominio"
        ? "dominio"
        : c.id === "nombres"
          ? "simbolo"
          : c.id.startsWith("s:")
            ? "entorno"
            : "tupla";
    errores.push({ tipo, mensaje: `${c.titulo}: ${c.detalle ?? "no se cumple"}` });
  }
  return errores;
}

// para que sirve: avisar que variables libres no tienen valor en el entorno
export function erroresDeEntorno(libres: string[], entorno: Entorno): ErrorLogico[] {
  return libres
    .filter((v) => entorno[v] === undefined || entorno[v] === "")
    .map((v) => ({
      tipo: "entorno" as const,
      mensaje: `La variable libre ${v} no tiene valor en el entorno.`,
    }));
}

// para que sirve: hacer todo el proceso desde el texto de la formula hasta el resultado
export function evaluar(
  texto: string,
  interp: Interpretacion,
  entorno: Entorno
): ResultadoEvaluacion {
  const sintaxis = analizarFormula(texto, interp);
  const errores: ErrorLogico[] = sintaxis.ok ? [] : [...sintaxis.errores];
  errores.push(...erroresDeInterpretacion(interp, entorno));

  const libres = sintaxis.ok ? variablesLibres(sintaxis.formula) : [];
  errores.push(...erroresDeEntorno(libres, entorno));

  if (!sintaxis.ok || errores.length > 0) return { ok: false, errores };

  const explicacion = evaluarFormula(sintaxis.formula, interp, entorno);
  return {
    ok: true,
    valor: explicacion.valor,
    etiqueta: explicacion.valor ? "Verdadero" : "Falso",
    formula: sintaxis.formula,
    variablesLibres: libres,
    explicacion,
  };
}
