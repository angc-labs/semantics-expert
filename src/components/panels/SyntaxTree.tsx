"use client";

import React, { useMemo } from "react";
import { ReactFlow, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Formula } from "@/lib/logica/tipos";
import { textoFormula } from "@/lib/logica/formulas";

const FUENTE = '"Times New Roman", Times, serif';

interface N {
  etiqueta: string;
  hijos: N[];
}

// los atomos son las hojas del arbol, igual que en los apuntes
function deFormula(f: Formula): N {
  switch (f.tipo) {
    case "atomo":
      return { etiqueta: textoFormula(f), hijos: [] };
    case "negacion":
      return { etiqueta: "¬", hijos: [deFormula(f.formula)] };
    case "binaria":
      return { etiqueta: f.conectivo, hijos: [deFormula(f.izquierda), deFormula(f.derecha)] };
    case "cuantificador":
      return { etiqueta: `${f.cuantificador}${f.variable}`, hijos: [deFormula(f.formula)] };
  }
}

const SEP_X = 28;
const SEP_Y = 78;
const ancho = (t: string) => Math.max(36, t.length * 10 + 12);

// las hojas van de izquierda a derecha y cada padre se centra sobre sus hijos
function construir(raiz: N) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let cursor = 0;
  let contador = 0;
  let maxNivel = 0;

  function visitar(n: N, nivel: number): { id: string; cx: number } {
    maxNivel = Math.max(maxNivel, nivel);
    const id = `n${contador++}`;
    const w = ancho(n.etiqueta);
    const hijos = n.hijos.map((h) => visitar(h, nivel + 1));
    let cx: number;
    if (hijos.length) cx = (hijos[0].cx + hijos[hijos.length - 1].cx) / 2;
    else {
      cx = cursor + w / 2;
      cursor += w + SEP_X;
    }
    nodes.push({
      id,
      position: { x: cx - w / 2, y: nivel * SEP_Y },
      data: { label: n.etiqueta },
      draggable: false,
      connectable: false,
      selectable: false,
      className: "arbol-nodo",
      style: {
        width: w,
        fontFamily: FUENTE,
        fontSize: 20,
        color: "#111",
        background: "#fff",
        border: "none",
        padding: "2px 0",
        textAlign: "center",
        boxShadow: "none",
      },
    });
    hijos.forEach((h) =>
      edges.push({
        id: `${id}-${h.id}`,
        source: id,
        target: h.id,
        type: "straight",
        style: { stroke: "#111", strokeWidth: 1 },
      })
    );
    return { id, cx };
  }

  visitar(raiz, 0);
  return { nodes, edges };
}

// arbol sintactico clasico con React Flow
export default function SyntaxTree({ formula }: { formula: Formula }) {
  const { nodes, edges } = useMemo(() => construir(deFormula(formula)), [formula]);
  return (
    <div className="h-full min-h-[280px] w-full bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
