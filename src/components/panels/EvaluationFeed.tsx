"use client";

import React from "react";
import StatusIndicator from "@/components/StatusIndicator";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import type { Explicacion } from "@/lib/logica/semantica";

// un paso de la explicacion con sus pasos hijos anidados
// las comprobaciones completas quedan plegadas hasta que se abren
function PasoExplicacion({ paso }: { paso: Explicacion }) {
  const color = paso.valor ? "text-emerald-700" : "text-rose-600";
  const cabecera = (
    <span>
      <span className="font-mono text-neutral-800">{paso.formula}</span>{" "}
      <span className={`font-semibold ${color}`}>{paso.valor ? "V" : "F"}</span>
      <span className="text-neutral-500"> · {paso.razon}</span>
    </span>
  );

  if (paso.hijos.length === 0) return <div className="py-0.5">{cabecera}</div>;

  return (
    <details open={paso.justificacion !== "completa"} className="py-0.5">
      <summary className="cursor-pointer">{cabecera}</summary>
      <div className="ml-4 border-l border-neutral-200 pl-3">
        {paso.hijos.map((h, i) => (
          <PasoExplicacion key={i} paso={h} />
        ))}
      </div>
    </details>
  );
}

// lista de formulas que se han evaluado, se expande como un chat
export default function EvaluationFeed() {
  const evaluationHistory = useSemanticsStore((s) => s.evaluationHistory);

  if (evaluationHistory.length === 0) return null;

  return (
    <div className="space-y-3 my-2 max-h-[46vh] overflow-y-auto px-1">
      {evaluationHistory.map((item, idx) => (
        <div
          key={item.id}
          className="chip-in rounded-3xl border border-neutral-200 bg-white/90 backdrop-blur p-4 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-semibold text-neutral-600">formula #{idx + 1}</span>
            <span>{item.timestamp}</span>
          </div>
          <div className="font-mono text-sm text-neutral-900 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
            {item.formula}
          </div>
          <div className="pt-1">
            <StatusIndicator
              label={item.statusLabel ?? "evaluando"}
              estado={item.statusState ?? "cargando"}
              pulsando={item.statusState === "cargando"}
            />
          </div>
          {item.resultado?.ok === false && (
            <ul className="text-xs text-rose-600 space-y-0.5 list-disc pl-5">
              {item.resultado.errores.map((e, i) => (
                <li key={i}>
                  <span className="font-semibold">{e.tipo}:</span> {e.mensaje}
                </li>
              ))}
            </ul>
          )}
          {item.resultado?.ok && (
            <div className="text-xs">
              <PasoExplicacion paso={item.resultado.explicacion} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
