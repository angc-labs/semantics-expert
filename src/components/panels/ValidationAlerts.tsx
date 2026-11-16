"use client";

import React, { useMemo } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { advertenciasRendimiento, revisarInterpretacion } from "@/lib/logica/interpretacion";

// Muestra errores que bloquean la evaluación y advertencias de rendimiento que no invalidan D.
export default function ValidationAlerts() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);

  const comprobaciones = useMemo(
    () => revisarInterpretacion({ dominio: domain, funciones: functions, relaciones: relations }, environment),
    [domain, functions, relations, environment]
  );
  const errores = comprobaciones.filter((c) => !c.ok);
  const advertencias = useMemo(
    () => advertenciasRendimiento({ dominio: domain, funciones: functions, relaciones: relations }),
    [domain, functions, relations]
  );

  if (errores.length === 0 && advertencias.length === 0) return null;

  return (
    <div className="space-y-2">
      {errores.length > 0 && (
        <div role="alert" aria-live="assertive" className="border border-amber-200 bg-amber-50/70 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
          <div className="font-semibold text-amber-950 flex items-center gap-1.5">
            <span aria-hidden="true">⚠</span>
            <span>revisiones teóricas pendientes:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-neutral-700">
            {errores.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.titulo}</span>
                {c.detalle && <span> — {c.detalle}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {advertencias.length > 0 && (
        <div role="status" aria-live="polite" className="border border-blue-200 bg-blue-50/70 rounded-2xl p-3 text-xs text-blue-900 space-y-1">
          <div className="font-semibold text-blue-950">aviso de rendimiento:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {advertencias.map((advertencia) => <li key={advertencia}>{advertencia}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
