"use client";

import React, { useEffect, useRef, useState } from "react";
import { normalizarDictado } from "@/lib/voz";

interface ReconocimientoVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: EventoReconocimiento) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ConstructorReconocimiento {
  new (): ReconocimientoVoz;
}

interface EventoReconocimiento {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
    length: number;
  }>;
}

type VentanaConVoz = Window & {
  SpeechRecognition?: ConstructorReconocimiento;
  webkitSpeechRecognition?: ConstructorReconocimiento;
};

export default function VoiceInputControls({
  onTranscript,
}: {
  onTranscript: (texto: string) => void;
}) {
  const reconocimientoRef = useRef<ReconocimientoVoz | null>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [compatible, setCompatible] = useState<boolean | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [previo, setPrevio] = useState("");

  useEffect(() => {
    const ventana = window as VentanaConVoz;
    setCompatible(Boolean(ventana.SpeechRecognition || ventana.webkitSpeechRecognition));
    return () => reconocimientoRef.current?.abort();
  }, []);

  const iniciarEscucha = () => {
    const ventana = window as VentanaConVoz;
    const Constructor = ventana.SpeechRecognition || ventana.webkitSpeechRecognition;
    if (!Constructor) {
      setCompatible(false);
      setEstado("tu navegador no permite reconocimiento de voz");
      return;
    }

    const reconocimiento = new Constructor();
    reconocimiento.lang = "es-SV";
    reconocimiento.continuous = false;
    reconocimiento.interimResults = true;
    reconocimiento.onresult = (evento) => {
      let provisional = "";
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        if (resultado.length > 0) {
          if (resultado.isFinal) onTranscript(normalizarDictado(resultado[0].transcript));
          else provisional += resultado[0].transcript;
        }
      }
      setPrevio(provisional);
    };
    reconocimiento.onerror = (evento) => {
      setEscuchando(false);
      setPrevio("");
      setEstado(evento.error === "not-allowed" ? "permiso de micrófono denegado" : "no se pudo reconocer la voz");
    };
    reconocimiento.onend = () => {
      setEscuchando(false);
      setPrevio("");
    };
    reconocimientoRef.current = reconocimiento;
    setEstado("escuchando…");
    setEscuchando(true);
    reconocimiento.start();
  };

  const detenerEscucha = () => {
    reconocimientoRef.current?.stop();
    setEscuchando(false);
    setPrevio("");
    setEstado(null);
  };

  return (
    <div className="ml-2 flex items-center gap-1.5 text-xs">
      <button
        type="button"
        onClick={escuchando ? detenerEscucha : iniciarEscucha}
        disabled={compatible === false}
        title={escuchando ? "detener dictado" : "dictar fórmula"}
        aria-label={escuchando ? "detener dictado" : "dictar fórmula"}
        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 transition-colors ${
          escuchando
            ? "border-rose-500 bg-rose-500 text-white"
            : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span aria-hidden>{escuchando ? "■" : "🎙"}</span>
        <span>{escuchando ? "detener" : "dictar"}</span>
      </button>
      {estado && <span className="text-neutral-600" role="status">{estado}</span>}
      {previo && <span className="max-w-32 truncate italic text-neutral-500" title={previo}>“{previo}”</span>}
    </div>
  );
}