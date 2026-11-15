// lector de archivos .txt o .toml para cargar dominio, funciones, relaciones, entorno y formulas

import type { FunctionDef, RelationDef } from "./tipos";

export interface DatosArchivo {
  dominio?: string[];
  funciones: Record<string, FunctionDef>;
  relaciones: Record<string, RelationDef>;
  entorno: Record<string, string>;
  formulas: string[];
}

function limpiarComillas(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

// extrae elementos de una lista simple como { 1, 2, 3 } o ["1", "2", "3"] o 1, 2, 3
function leerListaSimple(raw: string): string[] {
  const sinBordes = raw
    .trim()
    .replace(/^[\[{]/, "")
    .replace(/[\]}]$/, "");
  return sinBordes
    .split(/[,;\s]+/)
    .map(limpiarComillas)
    .filter(Boolean);
}

// extrae tuplas de relaciones como {(1, 2), (2, 3)} o [["1", "2"], ["2", "3"]] o {1, 2}
function leerTuplas(raw: string, aridadSugerida?: number): { arity: number; tuples: string[][] } {
  const texto = raw.trim();
  const grupos = [
    ...texto.matchAll(/\(([^()[\]{}]+)\)/g),
    ...texto.matchAll(/\[([^()[\]{}]+)\]/g),
  ];

  // si el texto entero empieza con [ y no tiene sub-corchetes ni parentesis internos, es 1-aria
  const tieneAnidados = /\([^)]*\)|\[[^\]]*\[/.test(texto);
  if (grupos.length > 0 && tieneAnidados) {
    const tuples = grupos
      .map((m) =>
        m[1]
          .split(",")
          .map(limpiarComillas)
          .filter(Boolean)
      )
      .filter((t) => t.length > 0);
    const arity = aridadSugerida ?? tuples[0]?.length ?? 1;
    return { arity, tuples };
  }

  // formato 1-ario: { 1, 2 } o [ "1", "2" ]
  const elems = leerListaSimple(texto);
  const tuples = elems.map((e) => [e]);
  return { arity: aridadSugerida ?? 1, tuples };
}

// extrae mapeo de funciones como { (1) -> 2, (2) -> 1 } o { "1": "2", "2": "1" } o constante "a"
function leerMapeoFuncion(raw: string, aridadSugerida?: number): { arity: number; mapping: Record<string, string> } {
  const texto = raw.trim();
  // si no tiene llaves ni flechas ni dos puntos, es una constante directa (aridad 0)
  if (!texto.includes("{") && !texto.includes("->") && !texto.includes("↦") && !texto.includes(":") && !texto.includes("=")) {
    return { arity: 0, mapping: { "": limpiarComillas(texto) } };
  }

  const sinLlaves = texto.replace(/^\{/, "").replace(/\}$/, "").trim();
  const mapping: Record<string, string> = {};
  let arity = aridadSugerida ?? 0;

  // separamos pares por punto y coma, o por comas que no esten dentro de parentesis
  const partes: string[] = [];
  let actual = "";
  let prof = 0;
  for (const ch of sinLlaves) {
    if (ch === "(" || ch === "[") prof++;
    else if (ch === ")" || ch === "]") prof = Math.max(0, prof - 1);
    if ((ch === "," || ch === ";") && prof === 0) {
      if (actual.trim()) partes.push(actual.trim());
      actual = "";
    } else {
      actual += ch;
    }
  }
  if (actual.trim()) partes.push(actual.trim());

  for (const p of partes) {
    const m = /^(.+?)\s*(?:->|↦|:|=)\s*(.+)$/.exec(p);
    if (!m) continue;
    const argsRaw = m[1].trim().replace(/^[([ ]+/, "").replace(/[)\]]+$/, "");
    const args = argsRaw
      .split(",")
      .map(limpiarComillas)
      .filter(Boolean);
    const val = limpiarComillas(m[2]);
    if (args.length > 0 && val) {
      arity = aridadSugerida ?? args.length;
      mapping[args.join(",")] = val;
    } else if (args.length === 0 && val) {
      mapping[""] = val;
    }
  }

  return { arity, mapping };
}

export function analizarArchivoAdjunto(contenido: string): DatosArchivo {
  const res: DatosArchivo = {
    funciones: {},
    relaciones: {},
    entorno: {},
    formulas: [],
  };

  let seccion: "ninguna" | "dominio" | "funciones" | "relaciones" | "entorno" | "formulas" = "ninguna";

  // unir arreglos multilinea tipo formulas = [ ... ]
  const lineasCrudas = contenido.split(/\r?\n/);
  const lineas: string[] = [];
  let acumulada = "";
  let corchetesAbiertos = 0;

  for (const raw of lineasCrudas) {
    // quitar comentario al final si no rompe nada o si empieza con # / //
    const t = raw.trim();
    if (!t || t.startsWith("#") || t.startsWith("//")) continue;

    if (corchetesAbiertos > 0) {
      acumulada += " " + t;
      for (const ch of t) {
        if (ch === "[" || ch === "{") corchetesAbiertos++;
        else if (ch === "]" || ch === "}") corchetesAbiertos--;
      }
      if (corchetesAbiertos <= 0) {
        lineas.push(acumulada);
        acumulada = "";
        corchetesAbiertos = 0;
      }
      continue;
    }

    let delta = 0;
    for (const ch of t) {
      if (ch === "[" || ch === "{") delta++;
      else if (ch === "]" || ch === "}") delta--;
    }
    // si es cabecera de seccion [dominio], no es arreglo multilinea
    if (/^\[[a-zA-Z_]+\]$/.test(t)) {
      lineas.push(t);
      continue;
    }
    if (delta > 0) {
      acumulada = t;
      corchetesAbiertos = delta;
    } else {
      lineas.push(t);
    }
  }
  if (acumulada) lineas.push(acumulada);

  for (const l of lineas) {
    // cabeceras TOML: [dominio], [relaciones], [funciones], [entorno], [formulas]
    const mSec = /^\[([a-zA-Z_]+)\]$/.exec(l);
    if (mSec) {
      const nom = mSec[1].toLowerCase();
      if (nom === "dominio" || nom === "domain" || nom === "d") seccion = "dominio";
      else if (nom === "funciones" || nom === "functions" || nom === "constantes") seccion = "funciones";
      else if (nom === "relaciones" || nom === "relations" || nom === "predicados") seccion = "relaciones";
      else if (nom === "entorno" || nom === "environment" || nom === "env" || nom === "s") seccion = "entorno";
      else if (nom === "formulas" || nom === "formula") seccion = "formulas";
      continue;
    }

    // directivas directas sin seccion: D = ..., dominio = ..., entorno: x = 1, etc.
    const mDominio = /^(?:\/?dominio|domain|D)\s*(?:=|:)\s*(.+)$/i.exec(l);
    if (mDominio) {
      const elems = leerListaSimple(mDominio[1]);
      if (elems.length > 0) res.dominio = elems;
      continue;
    }

    const mFormulasArr = /^(?:formulas|fórmulas)\s*(?:=|:)\s*\[(.*)\]$/i.exec(l);
    if (mFormulasArr) {
      const items = [...mFormulasArr[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((m) => m[1] ?? m[2]);
      for (const f of items) {
        if (f.trim()) res.formulas.push(f.trim());
      }
      continue;
    }

    const mEntornoLinea = /^(?:\/?entorno|env|s)\s*(?:=|:)\s*(.+)$/i.exec(l);
    if (mEntornoLinea) {
      const cuerpo = mEntornoLinea[1].replace(/^[\[{]/, "").replace(/[\]}]$/, "");
      for (const par of cuerpo.split(/[,;]+/)) {
        const mp = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|->|↦|:)\s*(.+)$/.exec(par.trim());
        if (mp) res.entorno[mp[1].trim()] = limpiarComillas(mp[2]);
      }
      continue;
    }

    const mConstante = /^(?:constante|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:)\s*(.+)$/i.exec(l);
    if (mConstante) {
      const name = mConstante[1].trim();
      res.funciones[name] = { name, arity: 0, mapping: { "": limpiarComillas(mConstante[2]) } };
      continue;
    }

    const mFuncionPrefijo = /^(?:\/?funcion|function|fn)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\/(\d+))?\s*(?:=|:)\s*(.+)$/i.exec(l);
    if (mFuncionPrefijo) {
      const name = mFuncionPrefijo[1].trim();
      const ar = mFuncionPrefijo[2] ? Number(mFuncionPrefijo[2]) : undefined;
      const { arity, mapping } = leerMapeoFuncion(mFuncionPrefijo[3], ar);
      res.funciones[name] = { name, arity, mapping };
      continue;
    }

    const mRelacionPrefijo = /^(?:\/?relacion|predicado|rel)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\/(\d+))?\s*(?:=|:)\s*(.+)$/i.exec(l);
    if (mRelacionPrefijo) {
      const name = mRelacionPrefijo[1].trim();
      const ar = mRelacionPrefijo[2] ? Number(mRelacionPrefijo[2]) : undefined;
      const { arity, tuples } = leerTuplas(mRelacionPrefijo[3], ar);
      res.relaciones[name] = { name, arity, tuples };
      continue;
    }

    // dentro de secciones o formato "P/1 = {1, 2}" / "R/2 = {(1, 2), (2, 3)}"
    const mConAridad = /^([a-zA-Z_][a-zA-Z0-9_]*)\/(\d+)\s*(?:=|:)\s*(.+)$/.exec(l);
    if (mConAridad) {
      const name = mConAridad[1].trim();
      const ar = Number(mConAridad[2]);
      const rhs = mConAridad[3].trim();
      if (seccion === "funciones" || rhs.includes("->") || rhs.includes("↦")) {
        const { arity, mapping } = leerMapeoFuncion(rhs, ar);
        res.funciones[name] = { name, arity, mapping };
      } else {
        const { arity, tuples } = leerTuplas(rhs, ar);
        res.relaciones[name] = { name, arity, tuples };
      }
      continue;
    }

    if (seccion === "dominio") {
      const m = /^(?:elementos|d|dominio|values)?\s*(?:=|:)?\s*(.+)$/i.exec(l);
      const elems = leerListaSimple(m ? m[1] : l);
      if (elems.length > 0) res.dominio = elems;
      continue;
    }

    if (seccion === "entorno") {
      for (const par of l.split(/[,;]+/)) {
        const mp = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|->|↦|:)\s*(.+)$/.exec(par.trim());
        if (mp) res.entorno[mp[1].trim()] = limpiarComillas(mp[2]);
      }
      continue;
    }

    if (seccion === "relaciones") {
      const m = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:)\s*(.+)$/.exec(l);
      if (m) {
        const name = m[1].trim();
        const { arity, tuples } = leerTuplas(m[2]);
        res.relaciones[name] = { name, arity, tuples };
        continue;
      }
    }

    if (seccion === "funciones") {
      const m = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:)\s*(.+)$/.exec(l);
      if (m) {
        const name = m[1].trim();
        const { arity, mapping } = leerMapeoFuncion(m[2]);
        res.funciones[name] = { name, arity, mapping };
        continue;
      }
    }

    // en [formulas] o sin seccion: si dice "lista = [...]"
    if (seccion === "formulas") {
      const mLista = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\[(.*)\]$/.exec(l);
      if (mLista) {
        const items = [...mLista[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((m) => m[1] ?? m[2]);
        for (const f of items) {
          if (f.trim()) res.formulas.push(f.trim());
        }
        continue;
      }
    }

    // fuera de seccion: si tiene forma P = {(1, 2)} con llaves o corchetes de tuplas
    const mAsignacion = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/.exec(l);
    if (mAsignacion && seccion === "ninguna") {
      const lhs = mAsignacion[1].trim();
      const rhs = mAsignacion[2].trim();
      if (rhs.startsWith("{") || rhs.startsWith("[")) {
        if (rhs.includes("->") || rhs.includes("↦") || rhs.includes(":")) {
          const { arity, mapping } = leerMapeoFuncion(rhs);
          res.funciones[lhs] = { name: lhs, arity, mapping };
        } else {
          const { arity, tuples } = leerTuplas(rhs);
          res.relaciones[lhs] = { name: lhs, arity, tuples };
        }
        continue;
      }
    }

    // por defecto la linea es una formula a evaluar
    res.formulas.push(limpiarComillas(l));
  }

  return res;
}
