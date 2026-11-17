"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSemanticsStore, type ActiveMode } from "@/store/useSemanticsStore";
import { analizarArchivoAdjunto, erroresDeImportacion } from "@/lib/logica/archivo";
import { revisarInterpretacion } from "@/lib/logica/interpretacion";
import MenuDropdown, { type MenuItem } from "./MenuDropdown";
import VisualBuilder from "./VisualBuilder";
import { normalizarDictado } from "@/lib/voz";

const SYMBOL_ITEMS: MenuItem[] = [
  {
    id: "forall",
    trigger: "@",
    label: "∀ (Para todo)",
    insertText: "∀",
    description: "cuantificador para todo",
    aliases: ["forall", "paratodo", "universal", "todo", "∀", "a"],
  },
  {
    id: "exists",
    trigger: "@",
    label: "∃ (Existe)",
    insertText: "∃",
    description: "cuantificador existe",
    aliases: ["exists", "existe", "existencial", "∃", "e"],
  },
  {
    id: "not",
    trigger: "@",
    label: "¬ (Negacion)",
    insertText: "¬",
    description: "conector de negacion",
    aliases: ["not", "neg", "negacion", "no", "¬"],
  },
  {
    id: "and",
    trigger: "@",
    label: "∧ (Y)",
    insertText: "∧",
    description: "conector y",
    aliases: ["and", "conj", "conjuncion", "y", "∧"],
  },
  {
    id: "or",
    trigger: "@",
    label: "∨ (O)",
    insertText: "∨",
    description: "conector o",
    aliases: ["or", "disy", "disyuncion", "o", "∨"],
  },
  {
    id: "implies",
    trigger: "@",
    label: "→ (Entonces)",
    insertText: "→",
    description: "conector de implicacion",
    aliases: ["implies", "imp", "implica", "entonces", "→", "->"],
  },
  {
    id: "iff",
    trigger: "@",
    label: "↔ (Si y solo si)",
    insertText: "↔",
    description: "conector de equivalencia",
    aliases: ["iff", "bicond", "sii", "equivalencia", "↔", "<->"],
  },
  {
    id: "lparen",
    trigger: "@",
    label: "( (Parentesis izquierdo)",
    insertText: "(",
    description: "abrir grupo",
    aliases: ["(", "lparen", "abrir"],
  },
  {
    id: "rparen",
    trigger: "@",
    label: ") (Parentesis derecho)",
    insertText: ")",
    description: "cerrar grupo",
    aliases: [")", "rparen", "cerrar"],
  },
];

const COMMAND_ITEMS: MenuItem[] = [
  {
    id: "dominio",
    trigger: "/",
    label: "/dominio",
    mode: "dominio",
    description: "agrega o cambia los elementos del conjunto d",
    aliases: ["dominio", "domain", "d"],
  },
  {
    id: "constante",
    trigger: "/",
    label: "/constante",
    mode: "constante",
    description: "crea una constante (funcion 0-aria) y le asigna un elemento de d",
    aliases: ["constante", "const", "c"],
  },
  {
    id: "funcion",
    trigger: "/",
    label: "/funcion",
    mode: "funcion",
    description: "crea una funcion n-aria y le asigna resultados en d",
    aliases: ["funcion", "function", "func", "f"],
  },
  {
    id: "predicado",
    trigger: "/",
    label: "/predicado",
    mode: "predicado",
    description: "crea un predicado y elige sus tuplas",
    aliases: ["predicado", "relacion", "predicate", "relation", "rel", "p"],
  },
  {
    id: "variable",
    trigger: "/",
    label: "/variable",
    mode: "variable",
    description: "asigna un valor de d a una variable libre",
    aliases: ["variable", "var", "v", "x"],
  },
  {
    id: "entorno",
    trigger: "/",
    label: "/entorno",
    mode: "entorno",
    description: "asigna valores de d a las variables libres",
    aliases: ["entorno", "env", "variables", "asignacion"],
  },
  {
    id: "formula",
    trigger: "/",
    label: "/formula",
    mode: "formula",
    description: "escribe la formula con teclado o botones",
    aliases: ["formula", "eval", "formula"],
  },
  {
    id: "limpiar",
    trigger: "/",
    label: "/limpiar",
    insertText: "/limpiar",
    description: "borra todo lo guardado para empezar de nuevo",
    aliases: ["limpiar", "clear", "reset"],
  },
];

const MENU_ITEMS: MenuItem[] = [...SYMBOL_ITEMS, ...COMMAND_ITEMS];
const QUICK_SYMBOLS = ["¬", "∧", "∨", "→", "↔", "∀", "∃", "(", ")"];

interface ActiveTrigger {
  type: "@" | "/";
  query: string;
  startIndex: number;
  endIndex: number;
}

function detectTrigger(
  text: string,
  cursorPosition: number,
  allowSlash: boolean
): ActiveTrigger | null {
  const textBeforeCursor = text.slice(0, cursorPosition);
  const lastNewline = textBeforeCursor.lastIndexOf("\n");
  const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;

  for (let i = cursorPosition - 1; i >= currentLineStart; i--) {
    const ch = textBeforeCursor[i];

    if (ch === " " || ch === "\t") {
      return null;
    }

    if (ch === "@") {
      const query = textBeforeCursor.slice(i + 1, cursorPosition);
      return {
        type: "@",
        query,
        startIndex: i,
        endIndex: cursorPosition,
      };
    }

    if (allowSlash && ch === "/") {
      const prevChar = i > currentLineStart ? textBeforeCursor[i - 1] : " ";
      if (prevChar === " " || prevChar === "\t") {
        const query = textBeforeCursor.slice(i + 1, cursorPosition);
        return {
          type: "/",
          query,
          startIndex: i,
          endIndex: cursorPosition,
        };
      }
    }
  }

  return null;
}

// barra principal de entrada con atajos y menu emergente
export default function FormulaInputBar() {
  const activeMode = useSemanticsStore((s) => s.activeMode);
  const formula = useSemanticsStore((s) => s.formula);
  const domain = useSemanticsStore((s) => s.domain);
  const functions = useSemanticsStore((s) => s.functions);
  const relations = useSemanticsStore((s) => s.relations);
  const environment = useSemanticsStore((s) => s.environment);

  const enterMode = useSemanticsStore((s) => s.enterMode);
  const closeMode = useSemanticsStore((s) => s.closeMode);
  const evaluateFormula = useSemanticsStore((s) => s.evaluateFormula);
  const importFromFile = useSemanticsStore((s) => s.importFromFile);
  const resetAll = useSemanticsStore((s) => s.resetAll);
  const notebooks = useSemanticsStore((s) => s.notebooks);
  const loadTemplate = useSemanticsStore((s) => s.loadTemplate);

  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [modoEntrada, setModoEntrada] = useState<"texto" | "visual">("texto");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [plantillasAbiertas, setPlantillasAbiertas] = useState(false);

  const reconocimientoRef = useRef<any>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [estadoVoz, setEstadoVoz] = useState<string | null>(null);
  const [previoVoz, setPrevioVoz] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const archivoRef = useRef<HTMLInputElement | null>(null);
  const [avisoArchivo, setAvisoArchivo] = useState<string | null>(null);

  // lee un .txt o .toml con dominio, funciones, relaciones, entorno y/o formulas
  const cargarArchivo = async (archivo: File) => {
    const texto = await archivo.text();
    const datos = analizarArchivoAdjunto(texto);
    const totalDefs =
      (datos.dominio !== undefined ? 1 : 0) +
      Object.keys(datos.funciones).length +
      Object.keys(datos.relaciones).length +
      Object.keys(datos.entorno).length;
    if (datos.errores.length > 0) {
      setAvisoArchivo(`${archivo.name}: importación rechazada — ${datos.errores.join(" | ")}`);
    } else if (totalDefs === 0 && datos.formulas.length === 0) {
      setAvisoArchivo(`${archivo.name}: archivo vacío`);
    } else {
      if (totalDefs > 0) {
        const errores = erroresDeImportacion(
          datos,
          { dominio: domain, funciones: functions, relaciones: relations },
          environment
        );
        if (errores.length > 0) {
          setAvisoArchivo(`${archivo.name}: importación rechazada — ${errores.join(" | ")}`);
          setTimeout(() => setAvisoArchivo(null), 7000);
          return;
        }
      }
      importFromFile(datos);
      const partes: string[] = [];
      if (totalDefs > 0) partes.push("interpretación cargada");
      if (datos.formulas.length > 0) partes.push(`${datos.formulas.length} fórmula(s)`);
      setAvisoArchivo(`${archivo.name}: ${partes.join(" · ")}`);
    }
    setTimeout(() => setAvisoArchivo(null), 4000);
  };

  // al entrar en modo formula cargamos la formula guardada
  useEffect(() => {
    if (activeMode === "formula") {
      setInput(formula);
      setCursorPos(formula.length);
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  }, [activeMode, formula]);

  const comprobaciones = useMemo(() => {
    return revisarInterpretacion(
      { dominio: domain, funciones: functions, relaciones: relations },
      environment
    );
  }, [domain, functions, relations, environment]);

  const interpretacionValida = useMemo(() => {
    return comprobaciones.every((c) => c.ok);
  }, [comprobaciones]);

  const activeTrigger = useMemo(() => {
    if (activeMode !== null && activeMode !== "formula") return null;
    const trigger = detectTrigger(input, cursorPos, activeMode === null);
    if (!trigger) return null;
    if (dismissedAt === trigger.startIndex) return null;
    return trigger;
  }, [input, cursorPos, dismissedAt, activeMode]);

  const filteredItems = useMemo(() => {
    if (!activeTrigger) return [];
    const q = activeTrigger.query.toLowerCase();
    return MENU_ITEMS.filter((item) => {
      if (item.trigger !== activeTrigger.type) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.aliases.some((alias) => alias.toLowerCase().includes(q))
      );
    });
  }, [activeTrigger]);

  const insertAtCursor = (textToInsert: string, replaceStart?: number, replaceEnd?: number) => {
    const start = replaceStart ?? cursorPos;
    const end = replaceEnd ?? cursorPos;
    const before = input.slice(0, start);
    const after = input.slice(end);
    const nextValue = `${before}${textToInsert}${after}`;
    const nextCursor = before.length + textToInsert.length;

    setInput(nextValue);
    setCursorPos(nextCursor);
    setSelectedIndex(0);
    setDismissedAt(null);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const applySelection = (item: MenuItem) => {
    if (!activeTrigger) return;

    if (item.mode) {
      // se borra el comando escrito para que no quede en el chat
      setInput("");
      setCursorPos(0);
      setDismissedAt(null);
      enterMode(item.mode);
      return;
    }

    if (item.id === "limpiar") {
      resetAll();
      setInput("");
      setCursorPos(0);
      return;
    }

    if (item.insertText) {
      insertAtCursor(item.insertText, activeTrigger.startIndex, activeTrigger.endIndex);
    }
  };

  useEffect(() => {
    return () => reconocimientoRef.current?.abort();
  }, []);

  const iniciarEscucha = () => {
    const ventana = typeof window !== "undefined" ? (window as any) : null;
    const Constructor = ventana?.SpeechRecognition || ventana?.webkitSpeechRecognition;
    if (!Constructor) {
      setEstadoVoz("navegador sin soporte de voz");
      setTimeout(() => setEstadoVoz(null), 3500);
      return;
    }

    const reconocimiento = new Constructor();
    reconocimiento.lang = "es-SV";
    reconocimiento.continuous = false;
    reconocimiento.interimResults = true;
    reconocimiento.onresult = (evento: any) => {
      let provisional = "";
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        if (resultado.length > 0) {
          if (resultado.isFinal) {
            const textoNorm = normalizarDictado(resultado[0].transcript);
            if (textoNorm) {
              insertAtCursor(`${input && cursorPos > 0 ? " " : ""}${textoNorm}`);
            }
          } else {
            provisional += resultado[0].transcript;
          }
        }
      }
      setPrevioVoz(provisional);
    };
    reconocimiento.onerror = (evento: any) => {
      setEscuchando(false);
      setPrevioVoz("");
      setEstadoVoz(evento?.error === "not-allowed" ? "micrófono denegado" : "no se pudo reconocer la voz");
      setTimeout(() => setEstadoVoz(null), 3500);
    };
    reconocimiento.onend = () => {
      setEscuchando(false);
      setPrevioVoz("");
      setEstadoVoz(null);
    };
    reconocimientoRef.current = reconocimiento;
    setEstadoVoz("escuchando…");
    setEscuchando(true);
    reconocimiento.start();
  };

  const detenerEscucha = () => {
    reconocimientoRef.current?.stop();
    setEscuchando(false);
    setPrevioVoz("");
    setEstadoVoz(null);
  };

  const toggleVoz = () => {
    if (escuchando) detenerEscucha();
    else iniciarEscucha();
  };

  const handleEvaluateOrSubmit = () => {
    if (!interpretacionValida) {
      setAvisoArchivo("corrige la interpretación antes de evaluar una fórmula");
      setTimeout(() => setAvisoArchivo(null), 4000);
      return;
    }
    const rawTrimmed = input.trim();
    if (!rawTrimmed) {
      if (formula) evaluateFormula(formula);
      return;
    }
    const trimmed = rawTrimmed;

    if (activeMode === "formula") {
      evaluateFormula(trimmed);
      closeMode();
      return;
    }

    const directCmd = COMMAND_ITEMS.find(
      (c) => c.label === trimmed.toLowerCase() && c.mode
    );
    if (directCmd && directCmd.mode) {
      setInput("");
      setCursorPos(0);
      enterMode(directCmd.mode);
      return;
    }

    evaluateFormula(trimmed);
    setInput("");
    setCursorPos(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeTrigger && filteredItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const chosen = filteredItems[selectedIndex] ?? filteredItems[0];
        if (chosen) {
          applySelection(chosen);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissedAt(activeTrigger.startIndex);
        return;
      }
    }

    if (e.key === "Escape" && activeMode === "formula") {
      e.preventDefault();
      closeMode();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEvaluateOrSubmit();
    }
  };

  return (
    <div className="relative w-full" data-particle-block>
      {activeTrigger && filteredItems.length > 0 && (
        <MenuDropdown
          triggerType={activeTrigger.type}
          items={filteredItems}
          selectedIndex={selectedIndex}
          onSelect={applySelection}
          onHoverIndex={setSelectedIndex}
        />
      )}

      {(activeMode === null || activeMode === "formula") && (
        <div
          className={`rounded-[28px] border bg-white px-5 pt-3 pb-4 transition-all ${
            interpretacionValida
              ? "border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.22)] focus-within:shadow-[0_0_35px_rgba(16,185,129,0.35)]"
              : "border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.20)] focus-within:shadow-[0_0_35px_rgba(244,63,94,0.32)]"
          } ${activeMode === "formula" ? "panel-in" : ""}`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-1 flex-wrap">
            <div className="flex items-center gap-0.5 flex-wrap">
              {activeMode === "formula" && (
                <span className="bg-neutral-900 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold mr-1">
                  /formula
                </span>
              )}
              {QUICK_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertAtCursor(sym);
                  }}
                  className="h-7 min-w-[28px] px-2 text-xs rounded-full text-neutral-700 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 text-xs flex-wrap">
              {(["dominio", "constante", "funcion", "predicado", "variable", "entorno"] as ActiveMode[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => enterMode(m)}
                    className="px-2 py-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                  >
                    /{m}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <span className="text-neutral-700 select-none text-base font-mono">&gt;</span>
            <textarea
              ref={textareaRef}
              aria-label="fórmula lógica"
              aria-describedby="formula-ayuda"
              aria-invalid={!interpretacionValida}
              rows={1}
              value={input}
              onChange={(e) => {
                const rawVal = e.target.value;
                setInput(rawVal);
                const pos = e.target.selectionStart ?? rawVal.length;
                setCursorPos(pos);
                setSelectedIndex(0);
                setDismissedAt(null);
              }}
              onKeyDown={handleKeyDown}
              onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              placeholder={
                activeMode === "formula"
                  ? "escribe la formula con botones o simbolos (@) y enter..."
                  : "escribe / para abrir un editor o @ para simbolos logicos..."
              }
              className="flex-1 resize-none outline-none bg-transparent placeholder:text-neutral-600 text-sm leading-normal py-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleEvaluateOrSubmit}
              disabled={(!input.trim() && !formula) || !interpretacionValida}
              title="evaluar formula (enter)"
              aria-label="evaluar formula"
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition-all hover:bg-neutral-800 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:scale-100 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
          <span id="formula-ayuda" className="sr-only">
            Escribe una fórmula usando los botones, el teclado o dictado por voz.
          </span>
          <div className="mt-2 flex flex-wrap items-center pl-1">
            <div className="relative z-40 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (escuchando) {
                    detenerEscucha();
                  } else {
                    setSelectorAbierto((v) => !v);
                  }
                }}
                className={`group flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-200 ease-out active:translate-y-0 active:scale-95 cursor-pointer ${
                  escuchando
                    ? "border-rose-500 bg-rose-500 text-white animate-pulse"
                    : "border-neutral-400 bg-white text-neutral-800 hover:-translate-y-0.5 hover:scale-105 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
                }`}
                title={escuchando ? "detener dictado" : "cambiar modo de entrada o dictar"}
                aria-label={escuchando ? "detener dictado" : "selector de entrada"}
              >
                {escuchando ? (
                  <>
                    <span aria-hidden className="text-[10px]">■</span>
                    <span>detener</span>
                  </>
                ) : (
                  <>
                    <span>{modoEntrada === "texto" ? "Texto" : "Visual"}</span>
                    <span
                      aria-hidden
                      className={`inline-block transition-transform duration-200 ${
                        selectorAbierto ? "rotate-180" : "group-hover:translate-y-0.5"
                      }`}
                    >
                      ▾
                    </span>
                  </>
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
              {selectorAbierto && (
                <div className="panel-in absolute bottom-full left-0 z-40 mb-1.5 w-36 overflow-hidden rounded-xl border border-neutral-400 bg-white p-1 text-xs shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectorAbierto(false);
                      setModoEntrada("texto");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium transition-all duration-150 hover:bg-neutral-900 hover:text-white cursor-pointer"
                  >
                    <span>Texto</span>
                    {modoEntrada === "texto" && !escuchando && <span>✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectorAbierto(false);
                      setModoEntrada("visual");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium transition-all duration-150 hover:bg-neutral-900 hover:text-white cursor-pointer"
                  >
                    <span>Visual</span>
                    {modoEntrada === "visual" && <span>✓</span>}
                  </button>
                  <div className="my-1 border-t border-neutral-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectorAbierto(false);
                      toggleVoz();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-neutral-800 transition-all duration-150 hover:bg-neutral-900 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden>🎙</span>
                      <span>Dictar</span>
                    </span>
                    {escuchando && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                  </button>
                </div>
              )}
            </div>

            <div className="relative z-40 ml-2">
              <button
                type="button"
                onClick={() => setPlantillasAbiertas((abierto) => !abierto)}
                aria-expanded={plantillasAbiertas}
                className="group flex items-center gap-1.5 rounded-full border border-neutral-400 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-95 cursor-pointer"
                title="cargar plantillas (notebooks marcados con bookmark)"
                aria-label="plantillas de notebooks"
              >
                <svg
                  className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span>plantillas</span>
              </button>
              {plantillasAbiertas && (
                <button
                  type="button"
                  aria-label="cerrar plantillas"
                  tabIndex={-1}
                  onClick={() => setPlantillasAbiertas(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
              )}
              {plantillasAbiertas && (
                <div className="panel-in absolute bottom-full left-0 z-40 mb-1.5 w-72 overflow-hidden rounded-2xl border border-neutral-400 bg-white p-1.5 text-xs shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-2.5 py-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    <span>Plantillas ({notebooks.filter((nb) => nb.isTemplate).length})</span>
                  </div>
                  {notebooks.filter((nb) => nb.isTemplate).length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-xs font-semibold text-neutral-800">Sin plantillas guardadas</p>
                      <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                        Marca cualquier notebook con el icono de bookmark (marcador) en la barra lateral para usarlo aquí como plantilla.
                      </p>
                    </div>
                  ) : (
                    notebooks
                      .filter((nb) => nb.isTemplate)
                      .map((plantilla) => (
                        <button
                          key={plantilla.id}
                          type="button"
                          onClick={() => {
                            loadTemplate(plantilla.id);
                            setPlantillasAbiertas(false);
                            setInput("");
                            setCursorPos(0);
                          }}
                          className="group/item flex w-full flex-col rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-neutral-900 hover:text-white cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-neutral-900 group-hover/item:text-white truncate">
                              {plantilla.title}
                            </span>
                            <span className="text-[10px] text-neutral-400 group-hover/item:text-neutral-300 ml-2 shrink-0">
                              cargar
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-600 group-hover/item:text-neutral-300 truncate">
                            D = {`{${plantilla.domain.join(", ")}}`} · {plantilla.evaluationHistory.length} fórm.
                          </span>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
            <input
              ref={archivoRef}
              type="file"
              accept=".txt,.toml,text/plain,application/toml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void cargarArchivo(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => archivoRef.current?.click()}
              title="adjuntar .txt o .toml (dominio, predicados, funciones, entorno y fórmulas)"
              aria-label="adjuntar archivo"
              className="group ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-400 bg-white text-neutral-800 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-110 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-90 cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.5l-8.5 8.5a5 5 0 01-7-7L14 5.5a3.5 3.5 0 015 5L10.5 19a2 2 0 01-3-3L15 8.5" />
              </svg>
            </button>
            {estadoVoz && <span className="ml-2 text-xs text-neutral-600 animate-pulse">{estadoVoz}</span>}
            {previoVoz && <span className="ml-2 max-w-40 truncate text-xs italic text-neutral-500" title={previoVoz}>“{previoVoz}”</span>}
            {avisoArchivo && <span className="ml-3 text-xs text-neutral-700">{avisoArchivo}</span>}
          </div>
        </div>
      )}

      {modoEntrada === "visual" && (
        <VisualBuilder
          initialFormula={input.trim() || formula}
          onClose={() => {
            setModoEntrada("texto");
            if (activeMode === "formula") closeMode();
          }}
        />
      )}
    </div>
  );
}
