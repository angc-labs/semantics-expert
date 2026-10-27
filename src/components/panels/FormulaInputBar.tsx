"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSemanticsStore, type ActiveMode } from "@/store/useSemanticsStore";
import { normalizarAtajos } from "@/lib/logica/atajos";
import { revisarInterpretacion } from "@/lib/logica/interpretacion";
import MenuDropdown, { type MenuItem } from "./MenuDropdown";
import ShortcutsFooter from "./ShortcutsFooter";

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
    id: "funcion",
    trigger: "/",
    label: "/funcion",
    mode: "funcion",
    description: "crea una constante o funcion y le asigna resultados en d",
    aliases: ["funcion", "function", "func", "f", "constante"],
  },
  {
    id: "relacion",
    trigger: "/",
    label: "/relacion",
    mode: "relacion",
    description: "crea una relacion o predicado y elige sus tuplas",
    aliases: ["relacion", "predicado", "relation", "predicate", "rel", "p"],
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
  const setFormula = useSemanticsStore((s) => s.setFormula);
  const addLog = useSemanticsStore((s) => s.addLog);
  const addEvaluation = useSemanticsStore((s) => s.addEvaluation);
  const updateEvaluation = useSemanticsStore((s) => s.updateEvaluation);
  const resetAll = useSemanticsStore((s) => s.resetAll);

  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const copyShortcutToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShortcut(text);
      setTimeout(() => {
        setCopiedShortcut((prev) => (prev === text ? null : prev));
      }, 1500);
    } catch {
      // si el navegador bloquea el portapapeles no hacemos nada
    }
  };

  const handleEvaluateOrSubmit = () => {
    const rawTrimmed = input.trim();
    if (!rawTrimmed) {
      if (formula) {
        const newId = String(Date.now());
        addEvaluation({
          id: newId,
          formula,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          statusLabel: "evaluando",
          statusState: "cargando",
        });
        setTimeout(() => {
          updateEvaluation(newId, {
            statusLabel: "evaluacion lista para conectarse al modulo de logica",
            statusState: "exito",
          });
        }, 1200);
        addLog(`evaluar formula actual: ${formula}`);
      }
      return;
    }
    const trimmed = normalizarAtajos(rawTrimmed);

    if (activeMode === "formula") {
      setFormula(trimmed);
      const newId = String(Date.now());
      addEvaluation({
        id: newId,
        formula: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        statusLabel: "evaluando",
        statusState: "cargando",
      });
      setTimeout(() => {
        updateEvaluation(newId, {
          statusLabel: "evaluacion lista para conectarse al modulo de logica",
          statusState: "exito",
        });
      }, 1200);
      addLog(`formula guardada: ${trimmed}`);
      addLog(`evaluar formula: ${trimmed}`);
      closeMode();
      return;
    }

    const directCmd = COMMAND_ITEMS.find(
      (c) => c.label === trimmed.toLowerCase() && c.mode
    );
    if (directCmd && directCmd.mode) {
      enterMode(directCmd.mode);
      return;
    }

    setFormula(trimmed);
    const newId = String(Date.now());
    addEvaluation({
      id: newId,
      formula: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      statusLabel: "evaluando",
      statusState: "cargando",
    });
    setTimeout(() => {
      updateEvaluation(newId, {
        statusLabel: "evaluacion lista para conectarse al modulo de logica",
        statusState: "exito",
      });
    }, 1200);
    addLog(`formula guardada: ${trimmed}`);
    addLog(`evaluar formula: ${trimmed}`);
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
                  className="h-7 min-w-[28px] px-2 text-xs rounded-full text-neutral-500 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 text-xs">
              {(["dominio", "funcion", "relacion", "entorno"] as ActiveMode[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => enterMode(m)}
                    className="px-2 py-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                  >
                    /{m}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <span className="text-neutral-300 select-none text-base font-mono">&gt;</span>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                const rawVal = e.target.value;
                const norm = normalizarAtajos(rawVal);
                setInput(norm);
                const pos = e.target.selectionStart ?? rawVal.length;
                const diff = norm.length - rawVal.length;
                setCursorPos(Math.max(0, pos + diff));
                setSelectedIndex(0);
                setDismissedAt(null);
              }}
              onKeyDown={handleKeyDown}
              onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              placeholder={
                activeMode === "formula"
                  ? "escribe la formula con botones o atajos (->, <->, E x) y enter..."
                  : "escribe / para abrir un editor o @ para simbolos logicos..."
              }
              className="flex-1 resize-none outline-none bg-transparent text-sm leading-normal py-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleEvaluateOrSubmit}
              disabled={!input.trim() && !formula}
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
        </div>
      )}

      <ShortcutsFooter
        copiedShortcut={copiedShortcut}
        onCopy={copyShortcutToClipboard}
      />
    </div>
  );
}
