"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSemanticsStore } from "@/store/useSemanticsStore";

// panel para agregar o quitar elementos del conjunto d
export default function DomainPanel() {
  const domain = useSemanticsStore((s) => s.domain);
  const setDomainAndReconcile = useSemanticsStore((s) => s.setDomainAndReconcile);
  const closeMode = useSemanticsStore((s) => s.closeMode);

  const [draft, setDraft] = useState<string[]>([...domain]);
  const [elemInput, setElemInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    const finalDomain = [...draft];
    const pending = elemInput.trim();
    if (pending && !finalDomain.includes(pending)) {
      finalDomain.push(pending);
    }
    if (finalDomain.length === 0) return;
    setDomainAndReconcile(finalDomain);
  };

  return (
    <div className="panel-in rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="bg-neutral-900 text-white px-2.5 py-0.5 rounded-full font-semibold">
          /dominio · conjunto d finito y no vacio
        </span>
        <button
          type="button"
          onClick={closeMode}
          className="text-neutral-500 hover:text-neutral-900"
        >
          esc para cancelar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 border border-neutral-300 rounded-xl bg-neutral-50 min-h-[42px]">
        <span className="text-neutral-400 font-semibold mr-1">D = {"{"}</span>
        {draft.map((el) => (
          <span
            key={el}
            className="inline-flex items-center gap-1 bg-neutral-900 text-white text-xs px-2 py-1 rounded-full"
          >
            {el}
            <button
              type="button"
              onClick={() => setDraft((prev) => prev.filter((item) => item !== el))}
              className="text-neutral-400 hover:text-white ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={elemInput}
          onChange={(e) => setElemInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closeMode();
              return;
            }
            if (e.key === " " || e.key === "," || e.key === "Tab") {
              const val = elemInput.replace(",", "").trim();
              if (val) {
                e.preventDefault();
                if (!draft.includes(val)) {
                  setDraft((prev) => [...prev, val]);
                }
                setElemInput("");
              }
              return;
            }
            if (e.key === "Backspace" && !elemInput && draft.length > 0) {
              setDraft((prev) => prev.slice(0, -1));
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const val = elemInput.trim();
              if (val) {
                if (!draft.includes(val)) {
                  setDraft((prev) => [...prev, val]);
                }
                setElemInput("");
              } else {
                handleSave();
              }
            }
          }}
          placeholder="escribe un elemento y presiona espacio, coma o enter..."
          className="flex-1 min-w-[180px] bg-transparent text-sm outline-none"
        />
        <span className="text-neutral-400 font-semibold ml-1">{"}"}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>espacio, coma o enter agrega · backspace borra el ultimo</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={draft.length === 0 && !elemInput.trim()}
          className="bg-neutral-900 text-white px-4 py-1.5 rounded-full font-semibold disabled:opacity-40 cursor-pointer"
        >
          guardar dominio (enter)
        </button>
      </div>
    </div>
  );
}
