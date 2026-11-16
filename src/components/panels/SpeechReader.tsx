"use client";

import React, { useEffect, useState } from "react";

export default function SpeechReader({
  text,
  decisiveText,
}: {
  text: string;
  decisiveText?: string;
}) {
  const [disponible, setDisponible] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [modo, setModo] = useState<"decisiva" | "completa">(
    decisiveText ? "decisiva" : "completa"
  );
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  useEffect(() => {
    setDisponible(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const alternarLectura = () => {
    if (!disponible) return;
    if (leyendo) {
      window.speechSynthesis.cancel();
      setLeyendo(false);
      return;
    }

    const contenido = modo === "decisiva" && decisiveText ? decisiveText : text;
    const utterance = new SpeechSynthesisUtterance(contenido);
    utterance.lang = "es-SV";
    utterance.rate = 0.9;
    utterance.onend = () => setLeyendo(false);
    utterance.onerror = () => setLeyendo(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setLeyendo(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Selector de contenido a leer */}
      <div className="relative z-20">
        <button
          type="button"
          onClick={() => setSelectorAbierto((v) => !v)}
          disabled={!disponible || !decisiveText}
          aria-expanded={selectorAbierto}
          className="group flex items-center gap-1.5 rounded-full border border-neutral-400 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          <span>{modo === "decisiva" && decisiveText ? "Razón decisiva" : "Explicación completa"}</span>
          {decisiveText && (
            <span
              aria-hidden
              className={`inline-block text-[10px] transition-transform duration-200 ${
                selectorAbierto ? "rotate-180" : "group-hover:translate-y-0.5"
              }`}
            >
              ▾
            </span>
          )}
        </button>

        {selectorAbierto && (
          <button
            type="button"
            aria-label="cerrar selector"
            tabIndex={-1}
            onClick={() => setSelectorAbierto(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
        )}

        {selectorAbierto && decisiveText && (
          <div className="panel-in absolute top-full left-0 z-40 mt-1.5 w-44 overflow-hidden rounded-xl border border-neutral-300 bg-white p-1 text-xs shadow-xl">
            <button
              type="button"
              onClick={() => {
                setModo("decisiva");
                setSelectorAbierto(false);
                if (leyendo) {
                  window.speechSynthesis.cancel();
                  setLeyendo(false);
                }
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium transition-colors hover:bg-neutral-900 hover:text-white cursor-pointer"
            >
              <span>Razón decisiva</span>
              {modo === "decisiva" && <span>✓</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                setModo("completa");
                setSelectorAbierto(false);
                if (leyendo) {
                  window.speechSynthesis.cancel();
                  setLeyendo(false);
                }
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium transition-colors hover:bg-neutral-900 hover:text-white cursor-pointer"
            >
              <span>Explicación completa</span>
              {modo === "completa" && <span>✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* Botón de reproducción */}
      <button
        type="button"
        onClick={alternarLectura}
        disabled={!disponible}
        aria-label={leyendo ? "detener lectura" : "reproducir lectura en voz alta"}
        title={
          disponible
            ? leyendo
              ? "detener lectura"
              : `leer ${modo === "decisiva" ? "razón decisiva" : "explicación completa"} en voz alta`
            : "lectura no disponible en este navegador"
        }
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 ease-out active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${
          leyendo
            ? "border border-rose-500 bg-rose-500 text-white animate-pulse"
            : "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md"
        }`}
      >
        {leyendo ? (
          <>
            <span aria-hidden className="text-[10px]">■</span>
            <span>detener</span>
          </>
        ) : (
          <>
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>reproducir</span>
          </>
        )}
      </button>
    </div>
  );
}
