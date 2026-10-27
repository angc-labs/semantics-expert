"use client";

import React, { useMemo } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { revisarInterpretacion, textoTupla } from "@/lib/logica/interpretacion";

// fila de etiquetas arriba del input que representan lo definido actualmente
export default function DefinitionChips() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);
  const formula = useSemanticsStore((s) => s.formula);
  const enterMode = useSemanticsStore((s) => s.enterMode);
  const deleteFunction = useSemanticsStore((s) => s.deleteFunction);
  const deleteRelation = useSemanticsStore((s) => s.deleteRelation);
  const deleteEnvironmentVar = useSemanticsStore((s) => s.deleteEnvironmentVar);
  const setFormula = useSemanticsStore((s) => s.setFormula);

  const comprobaciones = useMemo(() => {
    return revisarInterpretacion(
      { dominio: domain, funciones: functions, relaciones: relations },
      environment
    );
  }, [domain, functions, relations, environment]);

  const chips = [
    ...(domain.length > 0
      ? [
          {
            key: `D:${domain.join(",")}`,
            label: "D",
            value: `{ ${domain.join(", ")} }`,
            hasError: !comprobaciones.find((c) => c.simbolo === "D")?.ok,
            onClick: () => enterMode("dominio"),
          },
        ]
      : []),
    ...Object.values(functions).map((fn) => ({
      key: `f:${fn.name}:${JSON.stringify(fn.mapping)}`,
      label: fn.arity === 0 ? `constante ${fn.name}` : `${fn.name}/${fn.arity}`,
      value:
        fn.arity === 0
          ? (fn.mapping[""] ?? domain[0] ?? "?")
          : Object.entries(fn.mapping)
              .map(([k, v]) => `${fn.name}(${k})=${v}`)
              .join(", "),
      hasError: !comprobaciones.find((c) => c.simbolo === `f:${fn.name}`)?.ok,
      onClick: () => enterMode("funcion", fn.name),
      onRemove: () => deleteFunction(fn.name),
    })),
    ...Object.values(relations).map((rel) => ({
      key: `r:${rel.name}:${JSON.stringify(rel.tuples)}`,
      label: `${rel.name}/${rel.arity}`,
      value: `{ ${rel.tuples.map((t) => textoTupla(t)).join(", ")} }`,
      hasError: !comprobaciones.find((c) => c.simbolo === `r:${rel.name}`)?.ok,
      onClick: () => enterMode("relacion", rel.name),
      onRemove: () => deleteRelation(rel.name),
    })),
    ...Object.entries(environment).map(([v, val]) => ({
      key: `s:${v}:${val}`,
      label: "s",
      value: `${v} ↦ ${val}`,
      hasError: !comprobaciones.find((c) => c.simbolo === `s:${v}`)?.ok,
      onClick: () => enterMode("entorno"),
      onRemove: () => deleteEnvironmentVar(v),
    })),
    ...(formula
      ? [
          {
            key: `phi:${formula}`,
            label: "φ",
            value: formula,
            onClick: () => enterMode("formula"),
            onRemove: () => setFormula(""),
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      {chips.map((chip) => (
        <div
          key={chip.key}
          data-particle-block
          role="button"
          tabIndex={0}
          title={`${chip.label}: ${chip.value} - clic para editar`}
          onClick={chip.onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              chip.onClick();
            }
          }}
          className={`chip-in group inline-flex items-center gap-2 max-w-full rounded-full border bg-white/90 backdrop-blur pl-3 pr-3 py-1.5 text-xs shadow-sm cursor-pointer transition-all hover:border-neutral-900 hover:shadow-md focus:outline-none focus-visible:border-neutral-900 ${
            chip.hasError ? "border-amber-400 bg-amber-50/50" : "border-neutral-200"
          }`}
        >
          <span className="text-neutral-400 font-semibold">{chip.label}</span>
          <span className="text-neutral-800 truncate max-w-[240px]">{chip.value}</span>
          {chip.hasError && <span className="text-amber-600 font-bold">!</span>}
          {chip.onRemove && (
            <button
              type="button"
              aria-label={`eliminar ${chip.label}`}
              onClick={(e) => {
                e.stopPropagation();
                chip.onRemove?.();
              }}
              className="-mr-1 flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-900 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
