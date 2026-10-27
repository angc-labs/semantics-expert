"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { revisarNombre } from "@/lib/logica/nombres";

// panel para asignar valores del dominio a las variables libres
export default function EnvironmentPanel() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);
  const saveEnvironmentDraft = useSemanticsStore((s) => s.saveEnvironmentDraft);
  const closeMode = useSemanticsStore((s) => s.closeMode);

  const [draft, setDraft] = useState<Record<string, string>>({ ...environment });
  const [varName, setVarName] = useState("x");
  const [varValue, setVarValue] = useState(domain[0] ?? "");
  const [envError, setEnvError] = useState<string | null>(null);

  const varInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    varInputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!varName.trim() || !varValue.trim()) return;
    const cleanVar = varName.trim();
    const err = revisarNombre(
      cleanVar,
      "variable",
      { funciones: functions, relaciones: relations }
    );
    if (err) {
      setEnvError(err);
      return;
    }
    setEnvError(null);
    setDraft((prev) => ({
      ...prev,
      [cleanVar]: varValue.trim(),
    }));
    setVarName("");
    varInputRef.current?.focus();
  };

  const handleSave = () => {
    const nextEnv = { ...draft };
    if (varName.trim() && varValue.trim()) {
      const cleanVar = varName.trim();
      const err = revisarNombre(
        cleanVar,
        "variable",
        { funciones: functions, relaciones: relations }
      );
      if (err) {
        setEnvError(err);
        return;
      }
      nextEnv[cleanVar] = varValue.trim();
    }
    saveEnvironmentDraft(nextEnv);
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
          /entorno · valores para variables libres en d
        </span>
        <button
          type="button"
          onClick={closeMode}
          className="text-neutral-500 hover:text-neutral-900"
        >
          esc para cancelar
        </button>
      </div>

      {Object.keys(draft).length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
          {Object.entries(draft).map(([v, val]) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-xs px-2.5 py-1 rounded-full"
            >
              <span>
                {v} ↦ {val}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => {
                    const copy = { ...prev };
                    delete copy[v];
                    return copy;
                  })
                }
                className="text-neutral-400 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap text-sm">
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-500">variable:</span>
          <input
            ref={varInputRef}
            type="text"
            value={varName}
            onChange={(e) => {
              setVarName(e.target.value);
              if (envError) setEnvError(null);
            }}
            placeholder="x"
            className="w-16 border border-neutral-300 rounded-xl px-2 py-1 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <span className="text-neutral-400">↦</span>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-neutral-500">valor en d:</span>
          {domain.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setVarValue(d);
                if (varName.trim()) {
                  const cleanVar = varName.trim();
                  const err = revisarNombre(
                    cleanVar,
                    "variable",
                    { funciones: functions, relaciones: relations }
                  );
                  if (err) {
                    setEnvError(err);
                    return;
                  }
                  setEnvError(null);
                  setDraft((prev) => ({
                    ...prev,
                    [cleanVar]: d,
                  }));
                }
              }}
              className={`px-2.5 py-1 text-xs rounded-xl border ${
                varValue === d
                  ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="text-xs px-2.5 py-1 border border-neutral-400 rounded-xl hover:bg-neutral-100 cursor-pointer"
        >
          + agregar asignacion
        </button>
      </div>

      {envError && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 p-2 rounded-xl">
          {envError}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>elige la variable y su valor dentro de d</span>
        <button
          type="button"
          onClick={handleSave}
          className="bg-neutral-900 text-white px-4 py-1.5 rounded-full font-semibold cursor-pointer"
        >
          guardar entorno
        </button>
      </div>
    </div>
  );
}
