"use client";

import React, { useState } from "react";
import StatusIndicator from "@/components/StatusIndicator";
import ResolutionModal from "@/components/panels/ResolutionModal";
import { useSemanticsStore } from "@/store/useSemanticsStore";

// lista de tarjetas: cada una abre una modal con la resolucion completa
export default function EvaluationFeed() {
  const evaluationHistory = useSemanticsStore((s) => s.evaluationHistory);
  const [openId, setOpenId] = useState<string | null>(null);

  if (evaluationHistory.length === 0) return null;

  const openIdx = evaluationHistory.findIndex((i) => i.id === openId);

  return (
    <>
      <div className="space-y-2 my-2 flex-1 min-h-[96px] overflow-y-auto px-1 py-1">
        {evaluationHistory.map((item, idx) => {
          const ok = item.resultado?.ok;
          const verdadero = item.resultado?.ok && item.resultado.valor;
          const badge =
            ok === undefined
              ? "bg-neutral-100 text-neutral-700"
              : ok === false
                ? "bg-amber-100 text-amber-700"
                : verdadero
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-600";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(item.id)}
              className="chip-in group flex w-full items-center gap-3 rounded-2xl border border-neutral-400 bg-white/90 px-4 py-3 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md cursor-pointer"
            >
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                {ok === undefined ? "…" : ok === false ? "error" : verdadero ? "V" : "F"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm text-neutral-900">{item.formula}</span>
                <span className="flex items-center gap-2 text-[11px] text-neutral-600">
                  #{idx + 1} · {item.timestamp}
                  <StatusIndicator
                    label={item.statusLabel ?? "evaluando"}
                    estado={item.statusState ?? "cargando"}
                    pulsando={item.statusState === "cargando"}
                  />
                </span>
              </span>
              <span className="shrink-0 text-neutral-700 transition-colors group-hover:text-neutral-700">›</span>
            </button>
          );
        })}
      </div>

      {openIdx >= 0 && (
        <ResolutionModal
          item={evaluationHistory[openIdx]}
          numero={openIdx + 1}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
