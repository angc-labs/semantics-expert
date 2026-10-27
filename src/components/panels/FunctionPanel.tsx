"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { productoCartesiano } from "@/lib/logica/interpretacion";
import { revisarNombre } from "@/lib/logica/nombres";
import type { FunctionDef } from "@/lib/logica/tipos";

// panel para crear o editar simbolos de funcion y constantes
export default function FunctionPanel() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const editingName = useSemanticsStore((s) => s.editingName);
  const saveFunctionDef = useSemanticsStore((s) => s.saveFunctionDef);
  const closeMode = useSemanticsStore((s) => s.closeMode);

  const existing = editingName ? functions[editingName] : undefined;
  const [funcName, setFuncName] = useState(existing?.name ?? "f");
  const [funcArity, setFuncArity] = useState(existing?.arity ?? 1);
  const [funcMapping, setFuncMapping] = useState<Record<string, string>>(() => {
    if (existing) return { ...existing.mapping };
    const init: Record<string, string> = {};
    if (domain.length > 0) {
      for (const t of productoCartesiano(domain, 1)) {
        init[t.join(",")] = domain[0];
      }
    }
    return init;
  });
  const [funcError, setFuncError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // actualiza combinaciones al cambiar la aridad
  useEffect(() => {
    const tuples = productoCartesiano(domain, funcArity);
    setFuncMapping((prev) => {
      const next: Record<string, string> = {};
      for (const t of tuples) {
        const key = t.join(",");
        next[key] = prev[key] && domain.includes(prev[key]) ? prev[key] : (domain[0] ?? "");
      }
      return next;
    });
  }, [funcArity, domain]);

  const candidateTuples = useMemo(
    () => productoCartesiano(domain, funcArity),
    [domain, funcArity]
  );

  const handleSave = () => {
    const cleanName = funcName.trim();
    const error = revisarNombre(
      cleanName,
      "funcion",
      { funciones: functions, relaciones: relations },
      editingName ?? undefined
    );
    if (error) {
      setFuncError(error);
      return;
    }
    if (domain.length === 0) return;

    const def: FunctionDef = {
      name: cleanName,
      arity: funcArity,
      mapping: { ...funcMapping },
    };

    saveFunctionDef(def, editingName);
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") closeMode();
      }}
      className="panel-in rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 space-y-4"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="bg-neutral-900 text-white px-2.5 py-0.5 rounded-full font-semibold">
          /funcion · {funcArity === 0 ? "constante c en d" : `simbolo de funcion f^I : d^${funcArity} → d`}
        </span>
        <button
          type="button"
          onClick={closeMode}
          className="text-neutral-500 hover:text-neutral-900"
        >
          esc para cancelar
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm flex-wrap">
        <label className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">nombre:</span>
          <input
            ref={nameInputRef}
            type="text"
            value={funcName}
            onChange={(e) => {
              setFuncName(e.target.value);
              if (funcError) setFuncError(null);
            }}
            placeholder="f"
            className="w-20 border border-neutral-300 rounded-xl px-2 py-1 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">aridad (n):</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setFuncArity(n);
                  if (funcError) setFuncError(null);
                }}
                className={`px-2.5 py-1 text-xs rounded-xl border ${
                  funcArity === n
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {n === 0 ? "0 (constante)" : `${n}-aria`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {funcError && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 p-2 rounded-xl">
          {funcError}
        </div>
      )}

      {domain.length === 0 ? (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">
          primero define un dominio d que no este vacio con /dominio
        </div>
      ) : funcArity === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
          <span className="font-semibold text-neutral-700">{funcName || "c"} =</span>
          <div className="flex items-center gap-1 flex-wrap">
            {domain.map((d) => {
              const isSel = (funcMapping[""] ?? domain[0]) === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFuncMapping({ "": d })}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isSel
                      ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto border border-neutral-200 rounded-xl p-2 bg-neutral-50">
          <div className="text-xs text-neutral-500 mb-1">
            elige que valor de d da cada combinacion de {funcName || "f"}:
          </div>
          {candidateTuples.map((tuple) => {
            const key = tuple.join(",");
            const currentVal = funcMapping[key] ?? domain[0];
            return (
              <div
                key={key}
                className="flex items-center justify-between text-sm bg-white px-2.5 py-1.5 rounded-xl border border-neutral-200"
              >
                <span className="font-semibold">
                  {funcName || "f"}({tuple.join(", ")}) ↦
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {domain.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setFuncMapping((prev) => ({ ...prev, [key]: d }))
                      }
                      className={`px-2 py-0.5 text-xs rounded-xl border transition-colors ${
                        currentVal === d
                          ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {funcArity === 0
            ? "las constantes se evaluan como elementos fijos en d"
            : `cada combinacion en d^${funcArity} debe tener un valor en d`}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!funcName.trim() || domain.length === 0}
          className="bg-neutral-900 text-white px-4 py-1.5 rounded-full font-semibold disabled:opacity-40 cursor-pointer"
        >
          guardar {funcArity === 0 ? "constante" : "funcion"}
        </button>
      </div>
    </div>
  );
}
