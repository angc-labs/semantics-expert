"use client";

import React, { useState } from "react";

interface ShortcutsFooterProps {
  copiedShortcut: string | null;
  onCopy: (shortcut: string) => void;
}

const SHORTCUTS = [
  { label: "->", val: "->" },
  { label: "<->", val: "<->" },
  { label: "E x", val: "E x" },
];

// pie de texto debajo del input con los atajos copiables
export default function ShortcutsFooter({ copiedShortcut, onCopy }: ShortcutsFooterProps) {
  return (
    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 px-4 flex-wrap gap-y-1">
      <span className="flex items-center gap-1 flex-wrap">
        <strong className="text-neutral-600">/</strong> comandos ·{" "}
        <strong className="text-neutral-600">@</strong> simbolos ·{" "}
        <span>atajos:</span>
        {SHORTCUTS.map((s) => {
          const isCopied = copiedShortcut === s.val;
          return (
            <button
              key={s.val}
              type="button"
              onClick={() => onCopy(s.val)}
              title={`clic para copiar ${s.val} al portapapeles`}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] transition-all cursor-pointer ${
                isCopied
                  ? "bg-emerald-100 text-emerald-800 font-semibold"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white"
              }`}
            >
              <span>{s.label}</span>
              {isCopied && <span className="text-[9px]">✓</span>}
            </button>
          );
        })}
      </span>
      <span>enter confirmar · esc cancelar</span>
    </div>
  );
}
