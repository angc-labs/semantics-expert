"use client";

import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { analizarFormula } from "@/lib/logica/sintaxis";
import { textoFormula, variablesLibres } from "@/lib/logica/formulas";
import { evaluarFormula, evaluarTermino } from "@/lib/logica/semantica";
import { NOMBRES_RESERVADOS } from "@/lib/logica/nombres";
import type { Formula, Termino } from "@/lib/logica/tipos";

const FUENTE = '"Times New Roman", Times, serif';

type Clase = "atomo" | "termino" | "neg" | "bin" | "cuant";
type Info = { error?: string; valor?: boolean; valorTermino?: string; libres?: string[] };
type NodoData = {
  clase: Clase;
  op: string;
  texto: string;
  aridad?: number;
  info?: Info;
  onTexto?: (id: string, t: string) => void;
  onBorrar?: (id: string) => void;
};
type LNode = Node<NodoData>;

const PALETA: { clase: Clase; op: string; etiqueta: string; ayuda: string }[] = [
  { clase: "neg", op: "¬", etiqueta: "¬", ayuda: "negación" },
  { clase: "bin", op: "∧", etiqueta: "∧", ayuda: "y" },
  { clase: "bin", op: "∨", etiqueta: "∨", ayuda: "o" },
  { clase: "bin", op: "→", etiqueta: "→", ayuda: "implica" },
  { clase: "bin", op: "↔", etiqueta: "↔", ayuda: "si y solo si" },
];

// simbolos del menu @, con los mismos alias que el input de texto
const SIMBOLOS: { clase: Clase; op: string; etiqueta: string; alias: string[] }[] = [
  { clase: "cuant", op: "∀", etiqueta: "∀ para todo", alias: ["forall", "paratodo", "universal", "todo", "∀", "a", "v"] },
  { clase: "cuant", op: "∃", etiqueta: "∃ existe", alias: ["exists", "existe", "existencial", "∃", "e"] },
  { clase: "neg", op: "¬", etiqueta: "¬ negación", alias: ["not", "neg", "negacion", "no", "¬"] },
  { clase: "bin", op: "∧", etiqueta: "∧ y", alias: ["and", "conj", "conjuncion", "y", "∧"] },
  { clase: "bin", op: "∨", etiqueta: "∨ o", alias: ["or", "disy", "disyuncion", "o", "∨"] },
  { clase: "bin", op: "→", etiqueta: "→ entonces", alias: ["implies", "imp", "implica", "entonces", "→"] },
  { clase: "bin", op: "↔", etiqueta: "↔ si y solo si", alias: ["iff", "bicond", "sii", "equivalencia", "↔"] },
];

const colorValor = (i?: Info) =>
  i?.error
    ? "#b45309"
    : i?.valor !== undefined
      ? i.valor
        ? "#047857"
        : "#be123c"
      : i?.valorTermino !== undefined
        ? "#1d4ed8"
        : "#737373";
const fondoValor = (i?: Info) =>
  i?.error
    ? "#fef3c7"
    : i?.valor !== undefined
      ? i.valor
        ? "#d1fae5"
        : "#ffe4e6"
      : i?.valorTermino !== undefined
        ? "#eff6ff"
        : "#f5f5f5";

// input con estado propio: escribir nunca espera a la evaluacion en tiempo real
// y las teclas no suben al lienzo (atajos de shift, borrar, etc.)
function CampoNodo({
  valor,
  onCambio,
  estilo,
}: {
  valor: string;
  onCambio: (t: string) => void;
  estilo: React.CSSProperties;
}) {
  const [local, setLocal] = useState(valor);
  return (
    <input
      className="nodrag nopan nowheel"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onCambio(e.target.value);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      spellCheck={false}
      style={estilo}
    />
  );
}

function Nodo({ id, data }: NodeProps<LNode>) {
  const { clase, op, texto, aridad = 0, info } = data;
  const esHojaConParentesis = (clase === "atomo" || clase === "termino") && texto.includes("(");
  const numSalidas =
    clase === "bin"
      ? 2
      : clase === "neg" || clase === "cuant"
        ? 1
        : esHojaConParentesis
          ? 0
          : aridad;

  return (
    <div
      style={{
        fontFamily: FUENTE,
        border: `2px solid ${colorValor(info)}`,
        background: fondoValor(info),
        borderRadius: 10,
        padding: "6px 10px",
        minWidth: Math.max(96, numSalidas * 36),
        textAlign: "center",
        fontSize: 18,
        color: "#111",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <button
        type="button"
        onClick={() => data.onBorrar?.(id)}
        title="quitar nodo"
        className="nodrag"
        style={{ position: "absolute", top: -9, right: -9, width: 18, height: 18, fontSize: 11, lineHeight: "16px", borderRadius: 9, border: "1px solid #111", background: "#fff", cursor: "pointer" }}
      >
        ×
      </button>
      {clase === "atomo" || clase === "termino" ? (
        <CampoNodo
          valor={texto}
          onCambio={(t) => data.onTexto?.(id, t)}
          estilo={{ width: esHojaConParentesis ? 110 : 72, textAlign: "center", background: "transparent", border: "none", borderBottom: "1px dotted #111", outline: "none", fontFamily: FUENTE, fontSize: 18 }}
        />
      ) : clase === "cuant" ? (
        <span>
          {op}
          <CampoNodo
            valor={texto}
            onCambio={(t) => data.onTexto?.(id, t)}
            estilo={{ width: 34, textAlign: "center", background: "transparent", border: "none", borderBottom: "1px dotted #111", outline: "none", fontFamily: FUENTE, fontSize: 18, fontStyle: "italic" }}
          />
        </span>
      ) : (
        <span style={{ fontSize: 22 }}>{op}</span>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: colorValor(info), marginTop: 2 }}>
        {info?.error
          ? info.error
          : info?.valor !== undefined
            ? info.valor
              ? "Verdadero"
              : "Falso"
            : info?.valorTermino !== undefined
              ? `= ${info.valorTermino}`
              : info?.libres?.length
                ? `depende de ${info.libres.join(", ")}`
                : clase === "termino"
                  ? "término"
                  : "?"}
      </div>
      {clase === "bin" ? (
        <>
          <Handle type="source" id="l" position={Position.Bottom} style={{ left: "25%" }} />
          <Handle type="source" id="r" position={Position.Bottom} style={{ left: "75%" }} />
        </>
      ) : clase === "neg" || clase === "cuant" ? (
        <Handle type="source" id="c" position={Position.Bottom} />
      ) : (
        Array.from({ length: numSalidas }).map((_, idx) => (
          <Handle
            key={`a${idx}`}
            type="source"
            id={`a${idx}`}
            position={Position.Bottom}
            style={{ left: `${((idx + 1) / (numSalidas + 1)) * 100}%` }}
          />
        ))
      )}
    </div>
  );
}

const nodeTypes = { logico: Nodo };

const ANCHO_NODO = 140;
const SEP_X = 40;
const SEP_Y = 110;

// extrae variables que aparecen en un termino
function variablesEnTermino(t: Termino): string[] {
  if (t.tipo === "variable") return [t.nombre];
  const out: string[] = [];
  for (const a of t.argumentos) {
    for (const v of variablesEnTermino(a)) {
      if (!out.includes(v)) out.push(v);
    }
  }
  return out;
}

// convierte una Formula ya parseada en nodos y aristas con posiciones en arbol
function deFormulaAGrafo(raiz: Formula): { nodos: LNode[]; aristas: Edge[]; siguienteId: number } {
  const nodos: LNode[] = [];
  const aristas: Edge[] = [];
  let cursor = 0;
  let contador = 1;

  function visitarTermino(t: Termino, nivel: number): { id: string; cx: number } {
    const id = `v${contador++}`;
    const args = t.tipo === "funcion" ? t.argumentos : [];
    const hijos = args.map((a, idx) => ({
      handle: `a${idx}`,
      res: visitarTermino(a, nivel + 1),
    }));

    let cx: number;
    if (hijos.length > 0) {
      cx = (hijos[0].res.cx + hijos[hijos.length - 1].res.cx) / 2;
    } else {
      cx = cursor + ANCHO_NODO / 2;
      cursor += ANCHO_NODO + SEP_X;
    }

    nodos.push({
      id,
      type: "logico",
      position: { x: cx - ANCHO_NODO / 2, y: nivel * SEP_Y },
      data: { clase: "termino", op: "", texto: t.nombre, aridad: args.length },
    });

    hijos.forEach((h) => {
      aristas.push({
        id: `${id}-${h.handle}-${h.res.id}`,
        source: id,
        sourceHandle: h.handle,
        target: h.res.id,
      });
    });

    return { id, cx };
  }

  function visitar(f: Formula, nivel: number): { id: string; cx: number } {
    const id = `v${contador++}`;
    let clase: Clase;
    let op = "";
    let texto = "";
    let aridad = 0;
    const hijos: { handle: string; res: { id: string; cx: number } }[] = [];

    switch (f.tipo) {
      case "atomo":
        clase = "atomo";
        texto = f.predicado;
        aridad = f.argumentos.length;
        f.argumentos.forEach((a, idx) => {
          hijos.push({ handle: `a${idx}`, res: visitarTermino(a, nivel + 1) });
        });
        break;
      case "negacion":
        clase = "neg";
        op = "¬";
        hijos.push({ handle: "c", res: visitar(f.formula, nivel + 1) });
        break;
      case "cuantificador":
        clase = "cuant";
        op = f.cuantificador;
        texto = f.variable;
        hijos.push({ handle: "c", res: visitar(f.formula, nivel + 1) });
        break;
      case "binaria":
        clase = "bin";
        op = f.conectivo;
        hijos.push({ handle: "l", res: visitar(f.izquierda, nivel + 1) });
        hijos.push({ handle: "r", res: visitar(f.derecha, nivel + 1) });
        break;
    }

    let cx: number;
    if (hijos.length > 0) {
      cx = (hijos[0].res.cx + hijos[hijos.length - 1].res.cx) / 2;
    } else {
      cx = cursor + ANCHO_NODO / 2;
      cursor += ANCHO_NODO + SEP_X;
    }

    nodos.push({
      id,
      type: "logico",
      position: { x: cx - ANCHO_NODO / 2, y: nivel * SEP_Y },
      data: { clase, op, texto, aridad },
    });

    hijos.forEach((h) => {
      aristas.push({
        id: `${id}-${h.handle}-${h.res.id}`,
        source: id,
        sourceHandle: h.handle,
        target: h.res.id,
      });
    });

    return { id, cx };
  }

  visitar(raiz, 0);
  return { nodos, aristas, siguienteId: contador };
}

function Constructor({ initialFormula, onClose }: { initialFormula?: string; onClose: () => void }) {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);
  const storeFormula = useSemanticsStore((s) => s.formula);
  const evaluateFormula = useSemanticsStore((s) => s.evaluateFormula);
  const setFormula = useSemanticsStore((s) => s.setFormula);
  const { screenToFlowPosition } = useReactFlow();

  const grafoInicial = useMemo(() => {
    const texto = (initialFormula?.trim() || storeFormula.trim());
    if (!texto) return { nodos: [] as LNode[], aristas: [] as Edge[], siguienteId: 1 };
    const r = analizarFormula(texto, { funciones: functions, relaciones: relations });
    if (!r.ok) return { nodos: [] as LNode[], aristas: [] as Edge[], siguienteId: 1 };
    return deFormulaAGrafo(r.formula);
    // solo al montar el constructor visual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodos, setNodos] = useState<LNode[]>(grafoInicial.nodos);
  const [aristas, setAristas] = useState<Edge[]>(grafoInicial.aristas);
  const [contador, setContador] = useState(grafoInicial.siguienteId);
  const [entrada, setEntrada] = useState("");
  const [errorEntrada, setErrorEntrada] = useState(false);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [sel, setSel] = useState(0);

  // menu @: se abre cuando lo escrito empieza con @
  const consultaArroba = entrada.startsWith("@") ? entrada.slice(1).toLowerCase() : null;
  const sugerencias =
    consultaArroba === null
      ? []
      : SIMBOLOS.filter(
          (x) =>
            !consultaArroba ||
            x.etiqueta.toLowerCase().includes(consultaArroba) ||
            x.alias.some((a) => a.toLowerCase().includes(consultaArroba))
        );
  const elegirSimbolo = (x: (typeof SIMBOLOS)[number]) => {
    crear(x, { x: 40 + nodos.length * 24, y: 40 + nodos.length * 24 }, x.clase === "cuant" ? "x" : "");
    setEntrada("");
    setSel(0);
  };

  // interpreta lo escrito: ∀x, un predicado R o R(x,y), o un termino/variable x, f, f(x)
  const agregarTexto = () => {
    const t = entrada.trim();
    const pos = { x: 40 + nodos.length * 24, y: 40 + nodos.length * 24 };
    const q = /^([∀∃VA])\s*([A-Za-z_][A-Za-z0-9_]*)$/.exec(t);
    if (q) {
      crear({ clase: "cuant", op: q[1] === "∃" ? "∃" : "∀" }, pos, q[2]);
    } else if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(.*\)$/.test(t)) {
      const mNombre = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(t);
      const nom = mNombre ? mNombre[1] : "";
      if (functions[nom]) {
        crear({ clase: "termino", op: "" }, pos, t, 0);
      } else {
        crear({ clase: "atomo", op: "" }, pos, t, 0);
      }
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) {
      if (relations[t]) {
        crear({ clase: "atomo", op: "" }, pos, t, relations[t].arity);
      } else if (functions[t]) {
        crear({ clase: "termino", op: "" }, pos, t, functions[t].arity);
      } else {
        // si no esta en funciones ni relaciones: variable/termino (o predicado si empieza en mayuscula y no es variable tipica)
        crear({ clase: "termino", op: "" }, pos, t, 0);
      }
    } else if (t === "¬") {
      crear({ clase: "neg", op: "¬" }, pos);
    } else if (["∧", "∨", "→", "↔"].includes(t)) {
      crear({ clase: "bin", op: t }, pos);
    } else {
      setErrorEntrada(true);
      return;
    }
    setErrorEntrada(false);
    setEntrada("");
  };

  const crear = useCallback(
    (p: { clase: Clase; op: string }, pos: { x: number; y: number }, texto = "", aridad = 0) => {
      const id = `v${contador}`;
      setContador((c) => c + 1);
      setNodos((ns) => [
        ...ns,
        { id, type: "logico", position: pos, data: { clase: p.clase, op: p.op, texto, aridad } },
      ]);
    },
    [contador]
  );

  const onTexto = useCallback(
    (id: string, t: string) => {
      const limpio = t.trim();
      setNodos((ns) =>
        ns.map((n) => {
          if (n.id !== id) return n;
          if (n.data.clase === "cuant" || n.data.clase === "neg" || n.data.clase === "bin") {
            return { ...n, data: { ...n.data, texto: t } };
          }
          // actualiza clase y aridad si el usuario escribe el nombre de una relacion, funcion o termino
          if (limpio.includes("(")) {
            const m = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(limpio);
            const nom = m ? m[1] : "";
            const nuevaClase: Clase = functions[nom] ? "termino" : "atomo";
            return { ...n, data: { ...n.data, clase: nuevaClase, texto: t, aridad: 0 } };
          }
          if (relations[limpio]) {
            return {
              ...n,
              data: { ...n.data, clase: "atomo", texto: t, aridad: relations[limpio].arity },
            };
          }
          if (functions[limpio]) {
            return {
              ...n,
              data: { ...n.data, clase: "termino", texto: t, aridad: functions[limpio].arity },
            };
          }
          return { ...n, data: { ...n.data, texto: t, aridad: 0 } };
        })
      );
    },
    [relations, functions]
  );
  const onBorrar = useCallback((id: string) => {
    setNodos((ns) => ns.filter((n) => n.id !== id));
    setAristas((es) => es.filter((e) => e.source !== id && e.target !== id));
  }, []);

  // evaluacion en tiempo real de cada nodo con la interpretacion actual
  const nodosDif = useDeferredValue(nodos);
  const aristasDif = useDeferredValue(aristas);
  const { infos, raices, formulaRaiz } = useMemo(() => {
    const lenguaje = { funciones: functions, relaciones: relations };
    const interp = { dominio: domain, funciones: functions, relaciones: relations };
    const infos = new Map<string, Info>();
    const hijoDe = (id: string, h: string) => aristasDif.find((e) => e.source === id && e.sourceHandle === h)?.target;

    // construye un Termino a partir de un nodo (ej. variable x, constante c, o funcion f con hijos)
    function construirTermino(id: string, visto: Set<string>): Termino | null {
      const n = nodosDif.find((x) => x.id === id);
      if (!n) return null;
      if (visto.has(id)) {
        infos.set(id, { error: "ciclo" });
        return null;
      }
      const v = new Set(visto).add(id);
      const texto = n.data.texto.trim();
      let term: Termino | null = null;
      let error: string | undefined;

      if (n.data.clase !== "termino" && n.data.clase !== "atomo") {
        infos.set(id, { error: "se esperaba un término" });
        return null;
      }

      if (texto.includes("(")) {
        // truco: envolvemos en un predicado ficticio para usar el parser de terminos
        const relAux = "__T__";
        const r = analizarFormula(`${relAux}(${texto})`, {
          funciones: functions,
          relaciones: { ...relations, [relAux]: { name: relAux, arity: 1, tuples: [] } },
        });
        if (r.ok && r.formula.tipo === "atomo" && r.formula.argumentos.length === 1) {
          term = r.formula.argumentos[0];
        } else {
          error = r.ok ? "término inválido" : r.errores[0]?.mensaje ?? "término inválido";
        }
      } else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(texto)) {
        error = "nombre inválido";
      } else if (relations[texto]) {
        error = `${texto} es predicado, no término`;
      } else if (NOMBRES_RESERVADOS.includes(texto)) {
        error = `${texto} está reservado`;
      } else if (functions[texto]) {
        const fn = functions[texto];
        const args: Termino[] = [];
        let faltan = false;
        for (let i = 0; i < fn.arity; i++) {
          const hid = hijoDe(id, `a${i}`);
          const ht = hid ? construirTermino(hid, v) : null;
          if (!hid) faltan = true;
          if (ht) args.push(ht);
        }
        if (faltan) error = fn.arity === 1 ? "falta argumento" : "faltan argumentos";
        else if (args.length === fn.arity) {
          term = { tipo: "funcion", nombre: texto, argumentos: args };
        }
      } else {
        term = { tipo: "variable", nombre: texto };
      }

      if (!term) {
        infos.set(id, { error: error ?? "término incompleto" });
        return null;
      }

      const libres = variablesEnTermino(term);
      const sinValor = libres.filter((x) => environment[x] === undefined);
      if (sinValor.length) {
        infos.set(id, { libres: sinValor });
      } else {
        try {
          infos.set(id, { valorTermino: evaluarTermino(term, interp, environment) });
        } catch (e) {
          infos.set(id, { error: e instanceof Error ? e.message : "no se pudo evaluar" });
        }
      }
      return term;
    }

    function construir(id: string, visto: Set<string>): Formula | null {
      const n = nodosDif.find((x) => x.id === id);
      if (!n) return null;
      if (visto.has(id)) {
        infos.set(id, { error: "ciclo" });
        return null;
      }
      const v = new Set(visto).add(id);
      let f: Formula | null = null;
      let error: string | undefined;
      const { clase, op } = n.data;
      const texto = n.data.texto.trim();

      if (clase === "termino" && !relations[texto] && !texto.includes("(")) {
        // es un nodo de termino suelto o raiz: evaluamos su valor como termino pero no es formula
        construirTermino(id, visto);
        return null;
      }

      if (clase === "atomo" || clase === "termino") {
        if (texto.includes("(")) {
          const r = analizarFormula(texto, lenguaje);
          if (r.ok && r.formula.tipo === "atomo") f = r.formula;
          else error = r.ok ? "no es un predicado" : r.errores[0]?.mensaje ?? "predicado inválido";
        } else {
          const rel = relations[texto];
          if (!rel) {
            error = texto ? `${texto} no es un predicado` : "predicado vacío";
          } else {
            const args: Termino[] = [];
            let faltan = false;
            for (let i = 0; i < rel.arity; i++) {
              const hid = hijoDe(id, `a${i}`);
              const ht = hid ? construirTermino(hid, v) : null;
              if (!hid) faltan = true;
              if (ht) args.push(ht);
            }
            if (faltan) error = rel.arity === 1 ? "falta hijo" : "faltan hijos";
            else if (args.length === rel.arity) {
              f = { tipo: "atomo", predicado: texto, argumentos: args };
            }
          }
        }
      } else if (clase === "bin") {
        const hl = hijoDe(id, "l");
        const hr = hijoDe(id, "r");
        const l = hl ? construir(hl, v) : null;
        const r = hr ? construir(hr, v) : null;
        if (!hl || !hr) error = "faltan hijos";
        else if (l && r) f = { tipo: "binaria", conectivo: op as "∧", izquierda: l, derecha: r };
      } else {
        const hc = hijoDe(id, "c");
        const c = hc ? construir(hc, v) : null;
        if (clase === "cuant" && !/^[a-z][a-z0-9_]*$/i.test(texto)) error = "variable inválida";
        else if (!hc) error = "falta hijo";
        else if (c)
          f =
            clase === "neg"
              ? { tipo: "negacion", formula: c }
              : { tipo: "cuantificador", cuantificador: op as "∀", variable: texto, formula: c };
      }

      if (!f) {
        infos.set(id, { error: error ?? "incompleto" });
        return null;
      }
      const libres = variablesLibres(f);
      const sinValor = libres.filter((x) => environment[x] === undefined);
      if (sinValor.length) infos.set(id, { libres: sinValor });
      else {
        try {
          infos.set(id, { valor: evaluarFormula(f, interp, environment).valor });
        } catch (e) {
          infos.set(id, { error: e instanceof Error ? e.message : "no se pudo evaluar" });
        }
      }
      return f;
    }

    const conPadre = new Set(aristasDif.map((e) => e.target));
    const todosRaices = nodosDif.filter((n) => !conPadre.has(n.id)).map((n) => n.id);
    const formulas = new Map<string, Formula | null>();
    todosRaices.forEach((r) => formulas.set(r, construir(r, new Set())));
    const raices = todosRaices;
    const formulaRaiz = raices.length === 1 ? formulas.get(raices[0]) ?? null : null;
    return { infos, raices, formulaRaiz };
  }, [nodosDif, aristasDif, domain, functions, relations, environment]);

  const nodosVista = useMemo<LNode[]>(
    () => nodos.map((n) => ({ ...n, data: { ...n.data, info: infos.get(n.id), onTexto, onBorrar } })),
    [nodos, infos, onTexto, onBorrar]
  );

  const aristasVista = useMemo<Edge[]>(
    () =>
      aristas.map((e) => ({
        ...e,
        type: "smoothstep",
        style: { stroke: colorValor(infos.get(e.target)), strokeWidth: 2 },
      })),
    [aristas, infos]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      const origen = nodos.find((n) => n.id === c.source);
      const destino = nodos.find((n) => n.id === c.target);
      if (!origen || !destino) return;

      const claseOrigen = origen.data.clase;
      const necesitaFormula = claseOrigen === "bin" || claseOrigen === "neg" || claseOrigen === "cuant";
      const destinoEsFormula = destino.data.clase === "atomo" || destino.data.clase === "bin" || destino.data.clase === "neg" || destino.data.clase === "cuant";
      const destinoEsTermino = destino.data.clase === "termino";

      if (necesitaFormula && !destinoEsFormula) {
        setErrorConexion("ese nodo necesita recibir otra fórmula, no un término");
        return;
      }
      if (!necesitaFormula && !destinoEsTermino) {
        setErrorConexion("ese argumento necesita un término o una variable");
        return;
      }
      if ((claseOrigen === "atomo" || claseOrigen === "termino") && c.sourceHandle?.startsWith("a")) {
        const posicion = Number(c.sourceHandle.slice(1));
        if (!Number.isInteger(posicion) || posicion < 0 || posicion >= (origen.data.aridad ?? 0)) {
          setErrorConexion("esa posición no existe en la aridad del símbolo");
          return;
        }
      }
      setAristas((es) => {
        // evita ciclos: el destino no puede ser ancestro del origen
        const alcanza = (desde: string, meta: string): boolean =>
          desde === meta || es.filter((e) => e.source === desde).some((e) => alcanza(e.target, meta));
        if (alcanza(c.target!, c.source!)) {
          setErrorConexion("la conexión formaría un ciclo");
          return es;
        }
        const limpias = es.filter(
          (e) => !(e.source === c.source && e.sourceHandle === c.sourceHandle) && e.target !== c.target
        );
        setErrorConexion(null);
        return addEdge(c, limpias);
      });
    },
    [nodos]
  );

  const textoFinal = formulaRaiz ? textoFormula(formulaRaiz) : null;
  const rootInfo = raices.length === 1 ? infos.get(raices[0]) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ fontFamily: FUENTE }}>
      <div className="flex min-h-0 flex-1">
        <aside
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className="relative z-20 flex w-36 shrink-0 flex-col gap-2 border-r border-neutral-400 bg-neutral-50 p-3">
          <div className="relative">
          <input
            aria-label="agregar elemento al constructor visual"
            value={entrada}
            onChange={(e) => {
              setEntrada(e.target.value);
              setErrorEntrada(false);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (consultaArroba !== null && sugerencias.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSel((v) => (v + 1) % sugerencias.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSel((v) => (v - 1 + sugerencias.length) % sugerencias.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  elegirSimbolo(sugerencias[sel] ?? sugerencias[0]);
                  return;
                }
              }
              if (e.key === "Escape" && consultaArroba !== null) {
                setEntrada("");
                return;
              }
              if (e.key === "Enter") agregarTexto();
            }}
            placeholder="@, ∀x, R, x, P(x)…"
            spellCheck={false}
            title="escribe @ para el menú de símbolos, o ∀x, R, x, P(x) y enter"
            className={`w-full rounded-lg border bg-white px-2 py-1.5 text-base outline-none focus:border-neutral-900 ${
              errorEntrada ? "border-rose-500" : "border-neutral-500"
            }`}
          />
          {sugerencias.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-44 w-60 overflow-y-auto overscroll-contain rounded-lg border border-neutral-500 bg-white text-sm shadow-xl">
              {sugerencias.map((x, i) => (
                <button
                  key={x.op}
                  ref={i === sel ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => elegirSimbolo(x)}
                  className={`block w-full px-2 py-1 text-left cursor-pointer ${i === sel ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
                >
                  {x.etiqueta}
                </button>
              ))}
            </div>
          )}
          </div>
          {PALETA.map((p, i) => (
            <button
              key={i}
              type="button"
              draggable
              title={p.ayuda}
              onDragStart={(e) => e.dataTransfer.setData("application/x-logico", String(i))}
              onClick={() => crear(p, { x: 40 + nodos.length * 24, y: 40 + nodos.length * 24 })}
              className="cursor-grab rounded-lg border border-neutral-500 bg-white px-2 py-1.5 text-lg hover:bg-neutral-900 hover:text-white"
            >
              {p.etiqueta}
            </button>
          ))}
        </aside>
        <div className="min-w-0 flex-1 bg-white">
          <ReactFlow
            nodes={nodosVista}
            edges={aristasVista}
            nodeTypes={nodeTypes}
            onNodesChange={(c: NodeChange<LNode>[]) => setNodos((ns) => applyNodeChanges(c, ns))}
            onEdgesChange={(c: EdgeChange[]) => setAristas((es) => applyEdgeChanges(c, es))}
            onConnect={onConnect}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const i = e.dataTransfer.getData("application/x-logico");
              if (i === "") return;
              crear(PALETA[Number(i)], screenToFlowPosition({ x: e.clientX - 60, y: e.clientY - 20 }));
            }}
            deleteKeyCode={["Backspace", "Delete"]}
            selectionKeyCode={null}
            multiSelectionKeyCode={null}
            panActivationKeyCode={null}
            zoomActivationKeyCode={null}
            disableKeyboardA11y
            proOptions={{ hideAttribution: true }}
            fitView
          >
            <Background gap={22} color="#d4d4d4" />
          </ReactFlow>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-400 bg-white px-5 py-3">
        <div className="min-w-0">
          {errorConexion && (
            <div role="alert" className="mb-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-800">
              {errorConexion}
            </div>
          )}
          {textoFinal ? (
            <span className="text-xl">
              {textoFinal}
              {" "}
              <strong style={{ color: colorValor(rootInfo) }}>
                {rootInfo?.valor === undefined
                  ? rootInfo?.libres?.length
                    ? `(variables libres sin valor: ${rootInfo.libres.join(", ")})`
                    : ""
                  : rootInfo.valor
                    ? "= V"
                    : "= F"}
              </strong>
            </span>
          ) : (
            <span className="text-neutral-700">
              {nodos.length === 0
                ? "agrega nodos desde la paleta"
                : raices.length > 1
                  ? `${raices.length} árboles sueltos: conéctalos bajo un solo nodo`
                  : "fórmula incompleta o con errores"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setNodos([]);
              setAristas([]);
            }}
            className="rounded-full border border-neutral-500 px-4 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer"
          >
            limpiar
          </button>
          <button
            type="button"
            disabled={!textoFinal}
            onClick={() => {
              if (textoFinal) {
                setFormula(textoFinal);
                onClose();
              }
            }}
            className="rounded-full border border-neutral-900 px-4 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
          >
            usar fórmula
          </button>
          <button
            type="button"
            disabled={!textoFinal}
            onClick={() => {
              if (textoFinal) evaluateFormula(textoFinal);
              onClose();
            }}
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white disabled:opacity-30 cursor-pointer"
          >
            evaluar en el chat
          </button>
        </div>
      </footer>
    </div>
  );
}

// modal para construir formulas arrastrando y conectando nodos del arbol sintactico
export default function VisualBuilder({
  initialFormula,
  onClose,
}: {
  initialFormula?: string;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-builder-title"
    >
      <div
        className="panel-in flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-neutral-400 px-6 py-3">
          <h2 id="visual-builder-title" className="text-2xl" style={{ fontFamily: FUENTE }}>
            Constructor visual de fórmulas
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="cerrar"
            className="h-8 w-8 rounded-full text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1">
          <ReactFlowProvider>
            <Constructor initialFormula={initialFormula} onClose={onClose} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>,
    document.body
  );
}
