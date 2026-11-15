// revisiones de la interpretacion (dominio, funciones, relaciones y entorno)
// aqui no se evalua ninguna formula, solo se confirma que lo ingresado tenga sentido

import type { Entorno, Interpretacion, FunctionDef, RelationDef } from "./tipos";
import { NOMBRES_RESERVADOS } from "./nombres";

// arma todas las tuplas posibles de tamano n con elementos de d (es decir d^n)
// d^0 tiene una sola tupla vacia, que es la que usan las constantes
export function productoCartesiano(dominio: string[], aridad: number): string[][] {
  if (aridad < 0) return [];
  if (aridad === 0) return [[]];
  if (dominio.length === 0) return [];
  let resultado: string[][] = [[]];
  for (let i = 0; i < aridad; i++) {
    const siguiente: string[][] = [];
    for (const tupla of resultado) {
      for (const elemento of dominio) {
        siguiente.push([...tupla, elemento]);
      }
    }
    resultado = siguiente;
  }
  return resultado;
}

// texto corto para mostrar una aplicacion de funcion, por ejemplo f(1, 2) o c
export function textoAplicacion(nombre: string, argumentos: string[]): string {
  return argumentos.length === 0 ? nombre : `${nombre}(${argumentos.join(", ")})`;
}

// texto corto para mostrar una tupla, por ejemplo 1 o (1, 2)
export function textoTupla(tupla: string[]): string {
  return tupla.length === 1 ? tupla[0] : `(${tupla.join(", ")})`;
}

// cuando el dominio cambia, quita las combinaciones que usan elementos que ya no estan
// esto no cambia el significado: esas combinaciones ya no existen en d^n
// los valores que faltan o que salen de d no se arreglan solos, se marcan como problema
export function ajustarAlDominio(
  dominio: string[],
  funciones: Record<string, FunctionDef>,
  relaciones: Record<string, RelationDef>
) {
  const dentro = (e: string) => dominio.includes(e);
  const avisos: string[] = [];

  const nuevasFunciones: Record<string, FunctionDef> = {};
  for (const fn of Object.values(funciones)) {
    const mapping: Record<string, string> = {};
    for (const [llave, valor] of Object.entries(fn.mapping)) {
      const args = fn.arity === 0 ? [] : llave.split(",");
      if (args.every(dentro)) mapping[llave] = valor;
    }
    nuevasFunciones[fn.name] = { ...fn, mapping };
  }

  const nuevasRelaciones: Record<string, RelationDef> = {};
  for (const rel of Object.values(relaciones)) {
    const tuples = rel.tuples.filter((t) => t.every(dentro));
    const quitadas = rel.tuples.length - tuples.length;
    if (quitadas > 0) {
      avisos.push(`Se quitaron ${quitadas} tupla(s) de ${rel.name} con elementos fuera de D`);
    }
    nuevasRelaciones[rel.name] = { ...rel, tuples };
  }

  return { funciones: nuevasFunciones, relaciones: nuevasRelaciones, avisos };
}

// una revision: que se comprobo, si salio bien y el detalle si salio mal
export interface Comprobacion {
  id: string;
  ok: boolean;
  titulo: string;
  detalle?: string;
  // llave del chip al que pertenece: "d", "f:nombre", "r:nombre" o "s:variable"
  simbolo: string;
}

const MAX_DETALLES = 4;

const PATRON_NOMBRE = /^[A-Za-z][A-Za-z0-9_]*$/;

function resumir(lista: string[]): string {
  if (lista.length <= MAX_DETALLES) return lista.join("; ");
  return `${lista.slice(0, MAX_DETALLES).join("; ")}; y ${lista.length - MAX_DETALLES} más`;
}

// revisa toda la interpretacion y el entorno segun las reglas del proyecto
export function revisarInterpretacion(interp: Interpretacion, entorno: Entorno): Comprobacion[] {
  const { dominio, funciones, relaciones } = interp;
  const lista: Comprobacion[] = [];
  const enD = (e: string) => dominio.includes(e);

  // 1. el dominio no puede estar vacio y no debe repetir elementos
  const repetidos = dominio.filter((e, i) => dominio.indexOf(e) !== i);
  lista.push({
    id: "dominio",
    simbolo: "D",
    ok: dominio.length > 0 && repetidos.length === 0,
    titulo: "D es finito y no vacío",
    detalle:
      dominio.length === 0
        ? "D está vacío."
        : repetidos.length > 0
          ? `Elementos repetidos: ${repetidos.join(", ")}.`
          : undefined,
  });

  // 2. cada funcion debe dar un valor de d para cada tupla de d^n (funcion total)
  for (const fn of Object.values(funciones)) {
    const problemas: string[] = [];
    const aridadValida = Number.isInteger(fn.arity) && fn.arity >= 0;
    if (!aridadValida) {
      problemas.push("la aridad debe ser un entero mayor o igual que 0");
    }
    if (fn.name !== undefined && !PATRON_NOMBRE.test(fn.name)) {
      problemas.push("el nombre no cumple el formato de símbolo");
    }
    const mapping = fn.mapping && typeof fn.mapping === "object" ? fn.mapping : {};
    const clavesVistas = new Set<string>();
    for (const [clave, valor] of Object.entries(mapping)) {
      const argumentos = clave === "" ? [] : clave.split(",");
      if (aridadValida && argumentos.length !== fn.arity) {
        problemas.push(`${fn.name} tiene la clave (${clave}) con ${argumentos.length} argumento(s), no ${fn.arity}`);
      } else if (aridadValida && argumentos.some((e) => !enD(e) || e === "")) {
        problemas.push(`${fn.name} usa una entrada fuera de D en (${clave})`);
      }
      if (clavesVistas.has(clave)) problemas.push(`${fn.name} repite la entrada (${clave})`);
      clavesVistas.add(clave);
      if (valor === "") problemas.push(`falta el valor de ${textoAplicacion(fn.name, argumentos)}`);
    }
    for (const tupla of aridadValida ? productoCartesiano(dominio, fn.arity) : []) {
      const valor = mapping[tupla.join(",")];
      const app = textoAplicacion(fn.name, tupla);
      if (valor === undefined || valor === "") problemas.push(`falta ${app}`);
      else if (!enD(valor)) problemas.push(`${app} = ${valor} no está en D`);
    }
    lista.push({
      id: `f:${fn.name}`,
      simbolo: `f:${fn.name}`,
      ok: dominio.length > 0 && problemas.length === 0,
      titulo:
        fn.arity === 0
          ? `Constante ${fn.name} tiene valor en D`
          : `${fn.name}ᴵ : D${fn.arity > 1 ? `^${fn.arity}` : ""} → D está definida en todo D${fn.arity > 1 ? `^${fn.arity}` : ""}`,
      detalle: problemas.length > 0 ? resumir(problemas) + "." : undefined,
    });
  }

  // 3. cada relacion debe ser un subconjunto no vacio de d^n
  for (const rel of Object.values(relaciones)) {
    const problemas: string[] = [];
    const aridadValida = Number.isInteger(rel.arity) && rel.arity >= 0;
    const tuplas = Array.isArray(rel.tuples) ? rel.tuples : [];
    if (!aridadValida) problemas.push("la aridad debe ser un entero mayor o igual que 0");
    if (rel.name !== undefined && !PATRON_NOMBRE.test(rel.name)) {
      problemas.push("el nombre no cumple el formato de símbolo");
    }
    if (tuplas.length === 0) problemas.push("no tiene tuplas (no se admiten relaciones vacías)");
    const clavesVistas = new Set<string>();
    for (const t of tuplas) {
      const etiqueta = Array.isArray(t) ? textoTupla(t) : "<tupla inválida>";
      const clave = Array.isArray(t) ? t.join(",") : "<inválida>";
      if (clavesVistas.has(clave)) problemas.push(`${etiqueta} está repetida`);
      clavesVistas.add(clave);
      if (!Array.isArray(t)) {
        problemas.push("hay una tupla con formato inválido");
      } else if (!aridadValida || t.length !== rel.arity) {
        problemas.push(`${etiqueta} no tiene ${rel.arity} elemento(s)`);
      }
      if (Array.isArray(t) && t.some((e) => e === "")) problemas.push(`${etiqueta} contiene elementos vacíos`);
      if (Array.isArray(t) && t.every((e) => e !== "") && !t.every(enD)) {
        problemas.push(`${etiqueta} usa elementos fuera de D`);
      }
    }
    lista.push({
      id: `r:${rel.name}`,
      simbolo: `r:${rel.name}`,
      ok: problemas.length === 0,
      titulo: `${rel.name}ᴵ ⊆ D${rel.arity > 1 ? `^${rel.arity}` : ""} y no es vacía`,
      detalle: problemas.length > 0 ? resumir(problemas) + "." : undefined,
    });
  }

  // 4. ningun nombre puede repetirse entre funciones y relaciones, ni usar a o e
  const choques: string[] = [];
  for (const nombre of Object.keys(funciones)) {
    if (relaciones[nombre]) choques.push(`${nombre} es función y relación a la vez`);
  }
  for (const nombre of [...Object.keys(funciones), ...Object.keys(relaciones)]) {
    if (NOMBRES_RESERVADOS.includes(nombre)) choques.push(`${nombre} está reservado`);
    if (!PATRON_NOMBRE.test(nombre)) choques.push(`${nombre} no es un nombre válido`);
  }
  if (choques.length > 0) {
    lista.push({
      id: "nombres",
      simbolo: "",
      ok: false,
      titulo: "Cada símbolo tiene un nombre único",
      detalle: resumir(choques) + ".",
    });
  }

  // 5. cada variable del entorno debe apuntar a un elemento de d y no chocar con otro simbolo
  for (const [variable, valor] of Object.entries(entorno)) {
    let detalle: string | undefined;
    if (!PATRON_NOMBRE.test(variable)) detalle = `${variable} no es un nombre válido de variable.`;
    else if (!valor || !enD(valor)) detalle = `${valor} no está en D.`;
    else if (funciones[variable] || relaciones[variable]) {
      detalle = `${variable} ya es el nombre de otro símbolo.`;
    } else if (NOMBRES_RESERVADOS.includes(variable)) {
      detalle = `${variable} está reservado.`;
    }
    lista.push({
      id: `s:${variable}`,
      simbolo: `s:${variable}`,
      ok: !detalle,
      titulo: `s(${variable}) = ${valor} ∈ D`,
      detalle,
    });
  }

  return lista;
}
