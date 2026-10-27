"use client";

import React from "react";
import StatusIndicator from "@/components/StatusIndicator";
import { useSemanticsStore } from "@/store/useSemanticsStore";

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
        </div>
      ))}
    </div>
  );
}
