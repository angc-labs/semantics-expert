"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import { productoCartesiano, textoTupla } from "@/lib/logica/interpretacion";
import { revisarNombre } from "@/lib/logica/nombres";
import type { RelationDef } from "@/lib/logica/tipos";

// panel para crear o editar predicados y elegir sus tuplas
export default function RelationPanel() {
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const editingName = useSemanticsStore((s) => s.editingName);
  const saveRelationDef = useSemanticsStore((s) => s.saveRelationDef);
  const setDomainAndReconcile = useSemanticsStore((s) => s.setDomainAndReconcile);
  const closeMode = useSemanticsStore((s) => s.closeMode);

  const existing = editingName ? relations[editingName] : undefined;
  const [relName, setRelName] = useState(existing?.name ?? "P");
  const [relArity, setRelArity] = useState(existing?.arity ?? 2);
  const [relSelectedTuples, setRelSelectedTuples] = useState<Set<string>>(
    () => new Set(existing ? existing.tuples.map((t) => t.join(",")) : [])
  );
  const [relCustomTuple, setRelCustomTuple] = useState("");
  const [relBuilderTuple, setRelBuilderTuple] = useState<string[]>(() => [
    domain[0] ?? "1",
    domain[0] ?? "1",
  ]);
  const [relTupleError, setRelTupleError] = useState<string | null>(null);
  const [relPendingOutDomain, setRelPendingOutDomain] = useState<{
    tuples: string[][];
    missingElements: string[];
  } | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fallback = domain[0] ?? "1";
    setRelBuilderTuple((prev) =>
      Array.from({ length: relArity }, (_, idx) =>
        prev[idx] && domain.includes(prev[idx]) ? prev[idx] : fallback
      )
    );
  }, [relArity, domain]);

  const candidateTuples = useMemo(
    () => productoCartesiano(domain, relArity),
    [domain, relArity]
  );

  const parseAndAddCustomTuples = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setRelTupleError(null);
    setRelPendingOutDomain(null);

    let parsedTuples: string[][] = [];

    if (trimmed.includes("(") || trimmed.includes(")")) {
      const groupMatches = Array.from(trimmed.matchAll(/\(([^()]*)\)/g));
      const leftover = trimmed.replace(/\([^()]*\)/g, "").replace(/[,;\s]/g, "");
      if (groupMatches.length === 0 || leftover.length > 0) {
        setRelTupleError(
          `formato no reconocido. usa algo como ${
            relArity === 1 ? "a, b" : `(${Array.from({ length: relArity }, (_, i) => domain[i % Math.max(domain.length, 1)] ?? i + 1).join(", ")})`
          }`
        );
        return;
      }
      parsedTuples = groupMatches.map((m) =>
        m[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else if (relArity === 1) {
      parsedTuples = trimmed
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((el) => [el]);
    } else if (trimmed.includes(";")) {
      parsedTuples = trimmed
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) =>
          (part.includes(",") ? part.split(",") : part.split(/\s+/))
            .map((s) => s.trim())
            .filter(Boolean)
        );
    } else {
      const parts = (trimmed.includes(",") ? trimmed.split(",") : trimmed.split(/\s+/))
        .map((s) => s.trim())
        .filter(Boolean);
      parsedTuples = [parts];
    }

    if (parsedTuples.length === 0) return;

    for (const t of parsedTuples) {
      if (t.length !== relArity) {
        setRelTupleError(
          `la tupla (${t.join(", ")}) tiene ${t.length} elemento(s), pero ${
            relName || "P"
          } necesita ${relArity}`
        );
        return;
      }
    }

    const missing = Array.from(
      new Set(parsedTuples.flat().filter((el) => !domain.includes(el)))
    );

    if (missing.length > 0) {
      setRelPendingOutDomain({
        tuples: parsedTuples,
        missingElements: missing,
      });
      setRelTupleError(`elementos que no estan en d: ${missing.join(", ")}`);
      return;
    }

    setRelSelectedTuples((prev) => {
      const next = new Set(prev);
      for (const t of parsedTuples) {
        next.add(t.join(","));
      }
      return next;
    });
    setRelCustomTuple("");
  };

  const confirmAddMissingDomainAndTuples = () => {
    if (!relPendingOutDomain) return;
    const { tuples, missingElements } = relPendingOutDomain;
    const updatedDomain = [...domain, ...missingElements.filter((m) => !domain.includes(m))];
    setDomainAndReconcile(updatedDomain);
    setRelSelectedTuples((prev) => {
      const next = new Set(prev);
      for (const t of tuples) {
        next.add(t.join(","));
      }
      return next;
    });
    setRelPendingOutDomain(null);
    setRelTupleError(null);
    setRelCustomTuple("");
  };

  const addBuilderTupleToRelation = () => {
    const cleanTuple = relBuilderTuple.map((s) => s.trim());
    if (cleanTuple.length !== relArity || cleanTuple.some((s) => !s)) {
      setRelTupleError(`completa las ${relArity} posiciones de la tupla`);
      return;
    }
    parseAndAddCustomTuples(`(${cleanTuple.join(", ")})`);
  };

  const handleSave = () => {
    const cleanName = relName.trim();
    const error = revisarNombre(
      cleanName,
      "relacion",
      { funciones: functions, relaciones: relations },
      editingName ?? undefined
    );
    if (error) {
      setRelTupleError(error);
      return;
    }
    if (relSelectedTuples.size === 0) {
      setRelTupleError("no se admiten relaciones vacias");
      return;
    }

    const tuples = Array.from(relSelectedTuples).map((k) => k.split(","));
    const def: RelationDef = {
      name: cleanName,
      arity: relArity,
      tuples,
    };

    saveRelationDef(def, editingName);
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
          /relacion · predicado P^I ⊆ d^n (no vacio)
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
            value={relName}
            onChange={(e) => {
              setRelName(e.target.value);
              if (relTupleError) setRelTupleError(null);
            }}
            placeholder="P"
            className="w-20 border border-neutral-300 rounded-xl px-2 py-1 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">aridad (n):</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRelArity(n);
                  setRelSelectedTuples(new Set());
                  setRelTupleError(null);
                  setRelPendingOutDomain(null);
                }}
                className={`px-2.5 py-1 text-xs rounded-xl border ${
                  relArity === n
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {n}-aria
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={6}
              value={relArity}
              onChange={(e) => {
                const val = Math.max(1, Math.min(6, Number(e.target.value) || 1));
                setRelArity(val);
                setRelSelectedTuples(new Set());
                setRelTupleError(null);
                setRelPendingOutDomain(null);
              }}
              title="aridad personalizada (1 a 6)"
              className="w-14 border border-neutral-300 rounded-xl px-2 py-1 text-xs outline-none focus:border-neutral-900"
            />
          </div>
        </div>

        <div className="ml-auto flex gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              const all = new Set(candidateTuples.map((t) => t.join(",")));
              setRelSelectedTuples(all);
              setRelTupleError(null);
            }}
            className="px-2 py-1 border border-neutral-300 rounded-xl hover:bg-neutral-100"
          >
            todas d^{relArity}
          </button>
          <button
            type="button"
            onClick={() => {
              setRelSelectedTuples(new Set());
              setRelTupleError(null);
            }}
            className="px-2 py-1 border border-neutral-300 rounded-xl hover:bg-neutral-100"
          >
            limpiar
          </button>
        </div>
      </div>

      <div className="border border-neutral-300 rounded-xl p-2.5 bg-neutral-50/70 space-y-2.5">
        <div className="text-xs font-semibold text-neutral-700">
          armar tuplas personalizadas ({relArity}-tuplas)
        </div>

        {domain.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-neutral-500 mr-1">por posicion:</span>
            <span className="font-semibold text-neutral-600">
              {relArity > 1 ? "(" : ""}
            </span>
            {Array.from({ length: relArity }).map((_, idx) => (
              <React.Fragment key={idx}>
                <select
                  value={relBuilderTuple[idx] ?? domain[0] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRelBuilderTuple((prev) => {
                      const copy = [...prev];
                      copy[idx] = val;
                      return copy;
                    });
                  }}
                  className="border border-neutral-300 rounded-xl bg-white px-2 py-1 text-xs outline-none focus:border-neutral-900"
                >
                  {domain.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {idx < relArity - 1 && (
                  <span className="text-neutral-400 font-semibold">,</span>
                )}
              </React.Fragment>
            ))}
            <span className="font-semibold text-neutral-600">
              {relArity > 1 ? ")" : ""}
            </span>
            <button
              type="button"
              onClick={addBuilderTupleToRelation}
              className="ml-1 px-2.5 py-1 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 cursor-pointer"
            >
              + agregar tupla
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={relCustomTuple}
            onChange={(e) => {
              setRelCustomTuple(e.target.value);
              if (relTupleError) setRelTupleError(null);
              if (relPendingOutDomain) setRelPendingOutDomain(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                parseAndAddCustomTuples(relCustomTuple);
              }
            }}
            placeholder={
              relArity === 1
                ? "escribe elementos (ej. 1, 2) y presiona enter..."
                : `escribe una o varias tuplas (ej. (${Array.from(
                    { length: relArity },
                    (_, i) => domain[i % Math.max(domain.length, 1)] ?? i + 1
                  ).join(", ")}) o separadas por ;) y presiona enter...`
            }
            className="flex-1 border border-neutral-300 rounded-xl bg-white px-2.5 py-1.5 text-xs outline-none focus:border-neutral-900"
          />
          <button
            type="button"
            onClick={() => parseAndAddCustomTuples(relCustomTuple)}
            disabled={!relCustomTuple.trim()}
            className="px-3 py-1.5 text-xs border border-neutral-900 bg-white text-neutral-900 rounded-xl font-semibold hover:bg-neutral-900 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            agregar
          </button>
        </div>

        {relTupleError && (
          <div className="flex items-center justify-between gap-2 text-xs bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1.5 rounded-xl">
            <span>{relTupleError}</span>
            {relPendingOutDomain && (
              <button
                type="button"
                onClick={confirmAddMissingDomainAndTuples}
                className="shrink-0 bg-neutral-900 text-white px-2.5 py-1 rounded-xl font-semibold hover:bg-neutral-800 cursor-pointer"
              >
                agregar a d e incluir tupla
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 border border-neutral-300 rounded-xl bg-white min-h-[38px]">
        <span className="text-xs text-neutral-400 font-semibold mr-1">
          {relName || "P"}^I = {"{"}
        </span>
        {relSelectedTuples.size === 0 ? (
          <span className="text-xs text-neutral-400 italic">
            ninguna tupla agregada todavia
          </span>
        ) : (
          Array.from(relSelectedTuples).map((key) => {
            const parts = key.split(",");
            const label = textoTupla(parts);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 bg-neutral-900 text-white text-xs px-2 py-0.5 rounded-full"
              >
                {label}
                <button
                  type="button"
                  onClick={() =>
                    setRelSelectedTuples((prev) => {
                      const next = new Set(prev);
                      next.delete(key);
                      return next;
                    })
                  }
                  className="text-neutral-400 hover:text-white ml-0.5"
                >
                  ×
                </button>
              </span>
            );
          })
        )}
        <span className="text-xs text-neutral-400 font-semibold ml-1">{"}"}</span>
      </div>

      {candidateTuples.length > 0 && (
        <div className="border border-neutral-200 rounded-xl p-2.5 bg-neutral-50 space-y-2 max-h-40 overflow-y-auto">
          <div className="text-xs text-neutral-500">
            o elige directo del conjunto d^{relArity}:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidateTuples.map((tuple) => {
              const key = tuple.join(",");
              const isSelected = relSelectedTuples.has(key);
              const label = textoTupla(tuple);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRelSelectedTuples((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1 text-xs rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          seleccionadas: {relSelectedTuples.size} tupla(s) (no se admiten relaciones vacias)
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!relName.trim() || relSelectedTuples.size === 0}
          className="bg-neutral-900 text-white px-4 py-1.5 rounded-full font-semibold disabled:opacity-40 cursor-pointer"
        >
          guardar relacion
        </button>
      </div>
    </div>
  );
}
