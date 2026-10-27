// almacen global de zustand para todo el estado semantico de la aplicacion

import { create } from "zustand";
import type { FunctionDef, RelationDef } from "@/lib/logica/tipos";
import { ajustarAlDominio } from "@/lib/logica/interpretacion";
import type { EstadoPunto } from "@/components/StatusIndicator";

export type ActiveMode = null | "dominio" | "funcion" | "relacion" | "entorno" | "formula";

export interface EvaluationItem {
  id: string;
  formula: string;
  timestamp: string;
  statusLabel?: string;
  statusState?: EstadoPunto;
}

interface SemanticsStore {
  // estado de la interpretacion
  domain: string[];
  functions: Record<string, FunctionDef>;
  relations: Record<string, RelationDef>;
  environment: Record<string, string>;
  formula: string;
  logs: string[];

  // modo activo de edicion
  activeMode: ActiveMode;
  editingName: string | null;

  // historial de evaluaciones
  evaluationHistory: EvaluationItem[];

  // acciones para cambiar el modo
  enterMode: (mode: ActiveMode, editName?: string) => void;
  closeMode: () => void;

  // acciones para guardar definiciones
  setDomainAndReconcile: (newDomain: string[]) => void;
  saveFunctionDef: (def: FunctionDef, oldName?: string | null) => void;
  deleteFunction: (name: string) => void;
  saveRelationDef: (def: RelationDef, oldName?: string | null) => void;
  deleteRelation: (name: string) => void;
  saveEnvironmentDraft: (env: Record<string, string>) => void;
  deleteEnvironmentVar: (varName: string) => void;
  setFormula: (formula: string) => void;

  // acciones para evaluaciones y registros
  addLog: (text: string) => void;
  addEvaluation: (item: EvaluationItem) => void;
  updateEvaluation: (id: string, updates: Partial<EvaluationItem>) => void;
  clearEvaluations: () => void;
  resetAll: () => void;
}

export const useSemanticsStore = create<SemanticsStore>((set) => ({
  domain: ["1", "2"],
  functions: {},
  relations: {},
  environment: {},
  formula: "",
  logs: [],
  activeMode: null,
  editingName: null,
  evaluationHistory: [],

  enterMode: (mode, editName) =>
    set({
      activeMode: mode,
      editingName: editName ?? null,
    }),

  closeMode: () =>
    set({
      activeMode: null,
      editingName: null,
    }),

  setDomainAndReconcile: (newDomain) =>
    set((state) => {
      const { funciones: fnAjustadas, relaciones: relAjustadas, avisos } = ajustarAlDominio(
        newDomain,
        state.functions,
        state.relations
      );

      const envAjustado: Record<string, string> = {};
      for (const [v, val] of Object.entries(state.environment)) {
        if (newDomain.includes(val)) envAjustado[v] = val;
      }

      const logList = [`dominio d = {${newDomain.join(", ")}}`];
      for (const a of avisos) logList.push(a);

      return {
        domain: newDomain,
        functions: fnAjustadas,
        relations: relAjustadas,
        environment: envAjustado,
        logs: [...state.logs, ...logList],
        activeMode: null,
        editingName: null,
      };
    }),

  saveFunctionDef: (def, oldName) =>
    set((state) => {
      const copy = { ...state.functions };
      if (oldName && oldName !== def.name) {
        delete copy[oldName];
      }
      copy[def.name] = def;

      let logMsg = "";
      if (def.arity === 0) {
        const val = def.mapping[""] ?? state.domain[0];
        logMsg = `constante ${def.name} = ${val}`;
      } else {
        const pairs = Object.entries(def.mapping)
          .map(([k, v]) => `(${k}) ↦ ${v}`)
          .join(", ");
        logMsg = `funcion ${def.name}/${def.arity}: {${pairs}}`;
      }

      return {
        functions: copy,
        logs: [...state.logs, logMsg],
        activeMode: null,
        editingName: null,
      };
    }),

  deleteFunction: (name) =>
    set((state) => {
      const copy = { ...state.functions };
      delete copy[name];
      return { functions: copy };
    }),

  saveRelationDef: (def, oldName) =>
    set((state) => {
      const copy = { ...state.relations };
      if (oldName && oldName !== def.name) {
        delete copy[oldName];
      }
      copy[def.name] = def;

      const formatted = def.tuples
        .map((t) => (t.length === 1 ? t[0] : `(${t.join(", ")})`))
        .join(", ");
      const logMsg = `relacion ${def.name}/${def.arity} = {${formatted}}`;

      return {
        relations: copy,
        logs: [...state.logs, logMsg],
        activeMode: null,
        editingName: null,
      };
    }),

  deleteRelation: (name) =>
    set((state) => {
      const copy = { ...state.relations };
      delete copy[name];
      return { relations: copy };
    }),

  saveEnvironmentDraft: (env) =>
    set((state) => {
      const formatted = Object.entries(env)
        .map(([k, v]) => `${k} ↦ ${v}`)
        .join(", ");
      return {
        environment: env,
        logs: [...state.logs, `entorno s = [${formatted}]`],
        activeMode: null,
        editingName: null,
      };
    }),

  deleteEnvironmentVar: (varName) =>
    set((state) => {
      const copy = { ...state.environment };
      delete copy[varName];
      return { environment: copy };
    }),

  setFormula: (formula) => set({ formula }),

  addLog: (text) => set((state) => ({ logs: [...state.logs, text] })),

  addEvaluation: (item) =>
    set((state) => ({
      evaluationHistory: [...state.evaluationHistory, item],
    })),

  updateEvaluation: (id, updates) =>
    set((state) => ({
      evaluationHistory: state.evaluationHistory.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  clearEvaluations: () => set({ evaluationHistory: [] }),

  resetAll: () =>
    set({
      domain: [],
      functions: {},
      relations: {},
      environment: {},
      formula: "",
      logs: [],
      activeMode: null,
      editingName: null,
      evaluationHistory: [],
    }),
}));
