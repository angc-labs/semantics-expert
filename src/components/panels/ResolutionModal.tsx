"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import StatusIndicator from "@/components/StatusIndicator";
import SyntaxTree from "@/components/panels/SyntaxTree";
import type { EvaluationItem } from "@/store/useSemanticsStore";
import Demostracion, { FUENTE_CLASICA } from "@/components/panels/Demostracion";
import SpeechReader from "@/components/panels/SpeechReader";

function textoParaLeer(item: EvaluationItem): string {
  const resultado = item.resultado;
  if (!resultado?.ok) {
    return `La fórmula ${item.formula} no tiene valor de verdad. ${
      resultado?.errores.map((error) => error.mensaje).join(". ") ?? "Hay errores de validación."
    }`;
  }

  const razones: string[] = [];
  const recorrer = (explicacion: typeof resultado.explicacion) => {
    razones.push(`${explicacion.formula}: ${explicacion.razon}.`);
    explicacion.hijos.forEach(recorrer);
  };
  recorrer(resultado.explicacion);
  return `La fórmula ${item.formula} es ${resultado.etiqueta}. ${razones.join(" ")}`.slice(0, 5000);
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">{titulo}</h3>
      {children}
    </section>
  );
}

export default function ResolutionModal({
  item,
  numero,
  onClose,
}: {
  item: EvaluationItem;
  numero: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const r = item.resultado;
  const cabecera = !r?.ok
    ? "bg-amber-100 border-amber-400"
    : r.valor
      ? "bg-emerald-100 border-emerald-500"
      : "bg-rose-100 border-rose-500";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel-in relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`flex items-start justify-between gap-4 border-b-2 px-6 py-4 ${cabecera}`}>
          <div className="min-w-0 space-y-1">
            <div className="text-[11px] text-neutral-600">
              formula #{numero} · {item.timestamp}
            </div>
            <div style={{ fontFamily: FUENTE_CLASICA }} className="text-xl text-neutral-900 break-words">{item.formula}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="cerrar"
            className="shrink-0 h-8 w-8 rounded-full text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="min-h-0 space-y-4 px-6 py-5 md:w-3/5 md:overflow-y-auto md:border-r md:border-neutral-300">
            <StatusIndicator
              label={item.statusLabel ?? "evaluando"}
              estado={item.statusState ?? "cargando"}
              pulsando={item.statusState === "cargando"}
            />
            <SpeechReader text={textoParaLeer(item)} />
            {r?.ok === false && (
              <Seccion titulo="errores">
                <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
                  {r.errores.map((e, i) => (
                    <li key={i}>
                      <span className="font-semibold">{e.tipo}:</span> {e.mensaje}
                    </li>
                  ))}
                </ul>
              </Seccion>
            )}
            {r?.ok && (
              <Seccion titulo="evaluación">
                <Demostracion explicacion={r.explicacion} />
              </Seccion>
            )}
          </div>
          <div className="flex min-h-[300px] flex-col px-4 py-5 md:w-2/5">
            <h3 className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              árbol sintáctico
            </h3>
            <div className="min-h-0 flex-1">
              {r?.ok ? (
                <SyntaxTree formula={r.formula} />
              ) : (
                <p className="px-2 text-sm text-neutral-600">sin árbol: la fórmula tiene errores</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
