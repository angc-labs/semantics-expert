"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FUENTE_CLASICA } from "./Demostracion";

const INTEGRANTES = ["Sarah Estrada", "Tiffany Salazar", "Angel Chavez"];

export default function CreditsModal({ onClose }: { onClose: () => void }) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel-in relative w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-400 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="cerrar"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-5 text-center">
          <div className="space-y-1">
            <span className="inline-block rounded-full border border-neutral-400 bg-neutral-100 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Curso: Lógica matemática
            </span>
            <h2
              style={{ fontFamily: FUENTE_CLASICA }}
              className="pt-2 text-3xl text-neutral-900"
            >
              Créditos
            </h2>
          </div>

          <div className="space-y-2 rounded-2xl border border-neutral-300 bg-neutral-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Integrantes
            </p>
            <ul className="space-y-1.5 pt-1 text-base font-medium text-neutral-900">
              {INTEGRANTES.map((nombre) => (
                <li
                  key={nombre}
                  style={{ fontFamily: FUENTE_CLASICA }}
                  className="text-xl tracking-wide"
                >
                  {nombre}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
