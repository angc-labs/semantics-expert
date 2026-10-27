"use client";

import React from "react";
import ParticleField from "@/components/ParticleField";
import DefinitionChips from "@/components/panels/DefinitionChips";
import DomainPanel from "@/components/panels/DomainPanel";
import FunctionPanel from "@/components/panels/FunctionPanel";
import RelationPanel from "@/components/panels/RelationPanel";
import EnvironmentPanel from "@/components/panels/EnvironmentPanel";
import FormulaInputBar from "@/components/panels/FormulaInputBar";
import EvaluationFeed from "@/components/panels/EvaluationFeed";
import ValidationAlerts from "@/components/panels/ValidationAlerts";
import { useSemanticsStore } from "@/store/useSemanticsStore";

export default function HomePage() {
  const activeMode = useSemanticsStore((s) => s.activeMode);
  const logs = useSemanticsStore((s) => s.logs);
  const evaluationHistory = useSemanticsStore((s) => s.evaluationHistory);
  const clearEvaluations = useSemanticsStore((s) => s.clearEvaluations);

  const hasEvaluations = evaluationHistory.length > 0;

  return (
    <main
      className={`relative min-h-screen bg-white text-neutral-900 flex flex-col p-6 overflow-x-hidden transition-all duration-500 ${
        hasEvaluations ? "items-center justify-between pb-8 pt-8" : "items-center justify-center"
      }`}
    >
      <ParticleField />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-4">
        {/* cabecera y chips de definiciones */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 pb-1">
            <h1 className="text-3xl sm:text-5xl font-normal font-serif tracking-tight text-neutral-900 select-none">
              Evaluador semántico
            </h1>
            {hasEvaluations && (
              <button
                type="button"
                onClick={clearEvaluations}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                limpiar historial
              </button>
            )}
          </div>

          <DefinitionChips />
        </div>

        {/* historial de formulas evaluadas */}
        <EvaluationFeed />

        {/* constructores interactivos que transforman la entrada */}
        {activeMode === "dominio" && <DomainPanel />}
        {activeMode === "funcion" && <FunctionPanel />}
        {activeMode === "relacion" && <RelationPanel />}
        {activeMode === "entorno" && <EnvironmentPanel />}

        {/* input general y modo formula */}
        <FormulaInputBar />

        {/* alertas si hay errores en la interpretacion */}
        <ValidationAlerts />

        {/* historial de acciones */}
        {logs.length > 0 && (
          <div className="text-[11px] text-neutral-400 space-y-0.5 px-4 pt-1">
            {logs.slice(-3).map((log, i) => (
              <div key={`${logs.length}-${i}`} className="chip-in truncate">
                ✓ {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
