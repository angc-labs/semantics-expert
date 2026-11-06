// parte 4 del analisis: semantica
// evalua una formula ya leida y validada, y arma la explicacion de las razones decisivas
// aqui se asume que la interpretacion y el entorno ya pasaron las revisiones

import type { Entorno, Formula, Interpretacion, Termino } from "./tipos";
import { textoAplicacion } from "./interpretacion";
import { textoFormula } from "./formulas";

// como se justifica el valor de un cuantificador
//   testigo: un existencial verdadero se justifica con un elemento que lo cumple
//   contraejemplo: un universal falso se justifica con un elemento que lo rompe
//   completa: un universal verdadero o un existencial falso se justifican revisando todo d
export type TipoJustificacion = "testigo" | "contraejemplo" | "completa";

// un paso de la explicacion: una subformula, su valor y por que vale eso
export interface Explicacion {
  formula: string;
  valor: boolean;
  razon: string;
  // elemento elegido para el testigo o contraejemplo
  elemento?: string;
  justificacion?: TipoJustificacion;
  // pasos mas pequenos que sostienen este
  hijos: Explicacion[];
}

// para que sirve: calcular el valor de un termino (un elemento de d) bajo un entorno
// falla si falta un valor, eso no pasa cuando todo se valido antes
export function evaluarTermino(t: Termino, interp: Interpretacion, entorno: Entorno): string {
  if (t.tipo === "variable") {
    const valor = entorno[t.nombre];
    if (valor === undefined) throw new Error(`la variable ${t.nombre} no tiene valor`);
    return valor;
  }
  const fn = interp.funciones[t.nombre];
  if (!fn) throw new Error(`la funcion ${t.nombre} no existe`);
  const args = t.argumentos.map((a) => evaluarTermino(a, interp, entorno));
  const valor = fn.mapping[args.join(",")];
  if (valor === undefined) throw new Error(`falta ${textoAplicacion(t.nombre, args)}`);
  return valor;
}

// para que sirve: evaluar una formula bajo una interpretacion y un entorno
// devuelve el valor de verdad y el arbol de explicacion
export function evaluarFormula(f: Formula, interp: Interpretacion, entorno: Entorno): Explicacion {
  const texto = textoFormula(f);

  switch (f.tipo) {
    case "atomo": {
      const rel = interp.relaciones[f.predicado];
      if (!rel) throw new Error(`la relacion ${f.predicado} no existe`);
      const valores = f.argumentos.map((a) => evaluarTermino(a, interp, entorno));
      const pertenece = rel.tuples.some(
        (t) => t.length === valores.length && t.every((e, i) => e === valores[i])
      );
      const tupla = valores.length === 1 ? valores[0] : `(${valores.join(", ")})`;
      return {
        formula: texto,
        valor: pertenece,
        razon: `${tupla} ${pertenece ? "∈" : "∉"} ${f.predicado}ᴵ`,
        hijos: [],
      };
    }

    case "negacion": {
      const hijo = evaluarFormula(f.formula, interp, entorno);
      return {
        formula: texto,
        valor: !hijo.valor,
        razon: `${hijo.formula} es ${hijo.valor ? "verdadera" : "falsa"}, así que su negación es ${hijo.valor ? "falsa" : "verdadera"}`,
        hijos: [hijo],
      };
    }

    case "binaria": {
      const izq = evaluarFormula(f.izquierda, interp, entorno);
      const der = evaluarFormula(f.derecha, interp, entorno);
      const a = izq.valor;
      const b = der.valor;
      const valor =
        f.conectivo === "∧" ? a && b : f.conectivo === "∨" ? a || b : f.conectivo === "→" ? !a || b : a === b;
      const v = (x: boolean) => (x ? "verdadero" : "falso");
      return {
        formula: texto,
        valor,
        razon: `lado izquierdo ${v(a)} y lado derecho ${v(b)} con ${f.conectivo} da ${v(valor)}`,
        hijos: [izq, der],
      };
    }

    case "cuantificador": {
      const instancias = interp.dominio.map((elemento) => ({
        elemento,
        explicacion: evaluarFormula(f.formula, interp, { ...entorno, [f.variable]: elemento }),
      }));
      const x = f.variable;

      if (f.cuantificador === "∃") {
        const testigo = instancias.find((i) => i.explicacion.valor);
        if (testigo) {
          return {
            formula: texto,
            valor: true,
            razon: `testigo: con ${x} = ${testigo.elemento} se cumple`,
            elemento: testigo.elemento,
            justificacion: "testigo",
            hijos: [testigo.explicacion],
          };
        }
        return {
          formula: texto,
          valor: false,
          razon: `ningún elemento de D cumple (se revisaron ${instancias.length})`,
          justificacion: "completa",
          hijos: instancias.map((i) => i.explicacion),
        };
      }

      const contra = instancias.find((i) => !i.explicacion.valor);
      if (contra) {
        return {
          formula: texto,
          valor: false,
          razon: `contraejemplo: con ${x} = ${contra.elemento} no se cumple`,
          elemento: contra.elemento,
          justificacion: "contraejemplo",
          hijos: [contra.explicacion],
        };
      }
      return {
        formula: texto,
        valor: true,
        razon: `todos los elementos de D cumplen (se revisaron ${instancias.length})`,
        justificacion: "completa",
        hijos: instancias.map((i) => i.explicacion),
      };
    }
  }
}
