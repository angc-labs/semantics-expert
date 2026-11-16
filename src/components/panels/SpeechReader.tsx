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
  const [modo, setModo] = useState<"completa" | "decisiva">("completa");

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
      {decisiveText && (
        <button
          type="button"
          onClick={() => setModo("decisiva")}
          disabled={!disponible || leyendo}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            modo === "decisiva" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          razón decisiva
        </button>
      )}
      <button
        type="button"
        onClick={alternarLectura}
        disabled={!disponible}
        aria-label={leyendo ? "detener lectura" : "leer explicación en voz alta"}
        title={disponible ? (leyendo ? "detener lectura" : "leer explicación en voz alta") : "lectura no disponible en este navegador"}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-400 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden>{leyendo ? "■" : "🔊"}</span>
        {leyendo ? "detener lectura" : modo === "decisiva" ? "leer razón" : "leer explicación"}
      </button>
      {decisiveText && (
        <button
          type="button"
          onClick={() => setModo("completa")}
          disabled={!disponible || leyendo}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            modo === "completa" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          explicación completa
        </button>
      )}
    </div>
  );
}
