"use client";

import React, { useState } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";
import CreditsModal from "./CreditsModal";
import { FUENTE_CLASICA } from "./Demostracion";

export default function NotebookSidebar() {
  const notebooks = useSemanticsStore((s) => s.notebooks);
  const activeNotebookId = useSemanticsStore((s) => s.activeNotebookId);
  const createNotebook = useSemanticsStore((s) => s.createNotebook);
  const selectNotebook = useSemanticsStore((s) => s.selectNotebook);
  const renameNotebook = useSemanticsStore((s) => s.renameNotebook);
  const deleteNotebook = useSemanticsStore((s) => s.deleteNotebook);

  const [abierto, setAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [borradorNombre, setBorradorNombre] = useState("");
  const [creditosAbiertos, setCreditosAbiertos] = useState(false);

  const iniciarEdicion = (id: string, actual: string) => {
    setEditandoId(id);
    setBorradorNombre(actual);
  };

  const guardarEdicion = (id: string) => {
    if (borradorNombre.trim()) {
      renameNotebook(id, borradorNombre);
    }
    setEditandoId(null);
  };

  return (
    <>
      {/* boton flotante en la esquina superior izquierda */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title={abierto ? "ocultar notebooks" : "abrir notebooks"}
        aria-label={abierto ? "ocultar notebooks" : "abrir notebooks"}
        className="fixed left-5 top-5 z-40 flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-400 bg-white/95 text-neutral-900 shadow-md backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-lg active:scale-95 cursor-pointer"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.9}
        >
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path strokeLinecap="round" d="M9 4v16" />
        </svg>
      </button>

      {/* backdrop para cerrar al hacer clic fuera */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-30 bg-neutral-900/20 backdrop-blur-[1px] transition-opacity"
        />
      )}

      {/* panel lateral deslizable */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-neutral-400 bg-white/95 pt-16 shadow-2xl backdrop-blur transition-transform duration-300 ease-out ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <h2
            style={{ fontFamily: FUENTE_CLASICA }}
            className="text-xl font-normal text-neutral-900"
          >
            Notebooks
          </h2>
          <button
            type="button"
            onClick={() => createNotebook()}
            title="nuevo notebook aislado"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-neutral-800 active:scale-95 cursor-pointer"
          >
            <span>+</span> nuevo
          </button>
        </div>

        {/* lista de notebooks con scroll */}
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {notebooks.map((nb) => {
            const activo = nb.id === activeNotebookId;
            const enEdicion = editandoId === nb.id;
            return (
              <div
                key={nb.id}
                onClick={() => {
                  if (!enEdicion) selectNotebook(nb.id);
                }}
                className={`group flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition-all cursor-pointer ${
                  activo
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  {enEdicion ? (
                    <input
                      autoFocus
                      value={borradorNombre}
                      onChange={(e) => setBorradorNombre(e.target.value)}
                      onBlur={() => guardarEdicion(nb.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardarEdicion(nb.id);
                        if (e.key === "Escape") setEditandoId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-neutral-400 bg-white px-1.5 py-0.5 text-xs font-medium text-neutral-900 outline-none"
                    />
                  ) : (
                    <div className="truncate text-sm font-medium">{nb.title}</div>
                  )}
                  <div
                    className={`mt-0.5 truncate text-[11px] ${
                      activo ? "text-neutral-300" : "text-neutral-600"
                    }`}
                  >
                    D = {`{${nb.domain.join(", ")}}`} · {nb.evaluationHistory.length} fórm.
                  </div>
                </div>

                {!enEdicion && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      title="renombrar"
                      aria-label="renombrar notebook"
                      onClick={(e) => {
                        e.stopPropagation();
                        iniciarEdicion(nb.id, nb.title);
                      }}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors cursor-pointer ${
                        activo
                          ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                          : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                      }`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      title="eliminar notebook"
                      aria-label="eliminar notebook"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotebook(nb.id);
                      }}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors cursor-pointer ${
                        activo
                          ? "text-neutral-300 hover:bg-rose-600 hover:text-white"
                          : "text-neutral-600 hover:bg-rose-100 hover:text-rose-700"
                      }`}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* pie del sidebar: apartado de creditos */}
        <div className="border-t border-neutral-300 p-3">
          <button
            type="button"
            onClick={() => setCreditosAbiertos(true)}
            className="group flex w-full items-center justify-between rounded-2xl border border-neutral-400 bg-neutral-50 px-3.5 py-2.5 text-left text-xs font-medium text-neutral-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-md cursor-pointer"
          >
            <div>
              <div className="font-semibold">Créditos</div>
              <div className="text-[11px] text-neutral-600 group-hover:text-neutral-300">
                Curso: Lógica matemática
              </div>
            </div>
            <span className="text-sm transition-transform group-hover:translate-x-0.5">›</span>
          </button>
        </div>
      </aside>

      {creditosAbiertos && (
        <CreditsModal onClose={() => setCreditosAbiertos(false)} />
      )}
    </>
  );
}
