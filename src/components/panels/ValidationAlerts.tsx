"use client";

import React, { useMemo } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { revisarInterpretacion } from "@/lib/logica/interpretacion";

// muestra advertencias teoricas si la interpretacion no cumple las reglas
export default function ValidationAlerts() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);

  const comprobaciones = useMemo(() => {
    return revisarInterpretacion(
      { dominio: domain, funciones: functions, relaciones: relations },
      environment
    );
  }, [domain, functions, relations, environment]);

  const errores = comprobaciones.filter((c) => !c.ok);

  if (errores.length === 0) return null;

  return (
    <div className="border border-amber-200 bg-amber-50/70 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
      <div className="font-semibold text-amber-950 flex items-center gap-1.5">
        <span>⚠</span>
        <span>revisiones teoricas pendientes:</span>
      </div>
      <ul className="list-disc pl-5 space-y-0.5 text-neutral-700">
        {errores.map((c) => (
          <li key={c.id}>
            <span className="font-medium">{c.titulo}</span>
            {c.detalle && <span className="text-neutral-500"> — {c.detalle}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
