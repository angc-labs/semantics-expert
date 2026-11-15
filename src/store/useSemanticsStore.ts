// almacen global de zustand para todo el estado semantico de la aplicacion
// incluye soporte multi-notebook aislado y persistencia local-first en localStorage

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FunctionDef, RelationDef } from "@/lib/logica/tipos";
import { ajustarAlDominio } from "@/lib/logica/interpretacion";
import { evaluar, type ResultadoEvaluacion } from "@/lib/logica/evaluador";
import { buscarEjemplo } from "@/lib/logica/ejemplos";
import type { DatosArchivo } from "@/lib/logica/archivo";
import type { EstadoPunto } from "@/components/StatusIndicator";

export type ActiveMode =
  | null
  | "dominio"
  | "constante"
  | "funcion"
  | "relacion"
  | "entorno"
  | "variable"
  | "formula";

export interface EvaluationItem {
  id: string;
  formula: string;
  timestamp: string;
  statusLabel?: string;
  statusState?: EstadoPunto;
  // resultado completo de la logica: valor y explicacion, o errores
  resultado?: ResultadoEvaluacion;
}

export interface Notebook {
  id: string;
  title: string;
  updatedAt: string;
  domain: string[];
  functions: Record<string, FunctionDef>;
  relations: Record<string, RelationDef>;
  environment: Record<string, string>;
  formula: string;
  logs: string[];
  evaluationHistory: EvaluationItem[];
}

// para que sirve: evaluar una formula y dejarla lista para el historial
// una entrada con errores queda marcada como error y no recibe valor de verdad
function crearEvaluacion(
  texto: string,
  state: Pick<SemanticsStore, "domain" | "functions" | "relations" | "environment">
): EvaluationItem {
  const resultado = evaluar(
    texto,
    { dominio: state.domain, funciones: state.functions, relaciones: state.relations },
    state.environment
  );
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formula: texto,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    resultado,
    statusLabel: resultado.ok ? resultado.etiqueta : `${resultado.errores.length} error(es), sin valor de verdad`,
    statusState: resultado.ok ? (resultado.valor ? "exito" : "neutro") : "error",
  };
}

function nuevoNotebook(titulo = "Notebook 1"): Notebook {
  return {
    id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: titulo,
    updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    domain: ["1", "2"],
    functions: {},
    relations: {},
    environment: {},
    formula: "",
    logs: [],
    evaluationHistory: [],
  };
}

const NOTEBOOK_INICIAL: Notebook = {
  id: "nb-default",
  title: "Notebook 1",
  updatedAt: "ahora",
  domain: ["1", "2"],
  functions: {},
  relations: {},
  environment: {},
  formula: "",
  logs: [],
  evaluationHistory: [],
};

// sincroniza los campos activos dentro del arreglo de notebooks
function sincronizarActivo(
  state: SemanticsStore,
  cambios: Partial<
    Pick<
      SemanticsStore,
      "domain" | "functions" | "relations" | "environment" | "formula" | "logs" | "evaluationHistory" | "activeMode" | "editingName"
    >
  >
): Partial<SemanticsStore> {
  const nextDomain = cambios.domain ?? state.domain;
  const nextFunctions = cambios.functions ?? state.functions;
  const nextRelations = cambios.relations ?? state.relations;
  const nextEnvironment = cambios.environment ?? state.environment;
  const nextFormula = cambios.formula ?? state.formula;
  const nextLogs = cambios.logs ?? state.logs;
  const nextHistory = cambios.evaluationHistory ?? state.evaluationHistory;
  const ahora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const notebooks = state.notebooks.map((nb) =>
    nb.id === state.activeNotebookId
      ? {
          ...nb,
          updatedAt: ahora,
          domain: nextDomain,
          functions: nextFunctions,
          relations: nextRelations,
          environment: nextEnvironment,
          formula: nextFormula,
          logs: nextLogs,
          evaluationHistory: nextHistory,
        }
      : nb
  );

  return {
    ...cambios,
    notebooks,
  };
}

interface SemanticsStore {
  // lista de notebooks aislados
  notebooks: Notebook[];
  activeNotebookId: string;

  // estado de la interpretacion del notebook activo
  domain: string[];
  functions: Record<string, FunctionDef>;
  relations: Record<string, RelationDef>;
  environment: Record<string, string>;
  formula: string;
  logs: string[];

  // modo activo de edicion
  activeMode: ActiveMode;
  editingName: string | null;

  // historial de evaluaciones del notebook activo
  evaluationHistory: EvaluationItem[];

  // acciones de notebooks
  createNotebook: (title?: string) => void;
  selectNotebook: (id: string) => void;
  renameNotebook: (id: string, title: string) => void;
  deleteNotebook: (id: string) => void;

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

  // evalua una formula con la interpretacion actual y la agrega al historial
  evaluateFormula: (texto: string) => void;
  // reemplaza la interpretacion por un ejemplo de las presentaciones y evalua sus formulas
  loadExample: (id: string) => void;
  // importa dominio, funciones, relaciones, entorno y formulas desde un archivo .txt o .toml
  importFromFile: (datos: DatosArchivo) => void;

  // acciones para evaluaciones y registros
  addLog: (text: string) => void;
  addEvaluation: (item: EvaluationItem) => void;
  updateEvaluation: (id: string, updates: Partial<EvaluationItem>) => void;
  clearEvaluations: () => void;
  resetAll: () => void;
}

export const useSemanticsStore = create<SemanticsStore>()(
  persist(
    (set) => ({
      notebooks: [NOTEBOOK_INICIAL],
      activeNotebookId: NOTEBOOK_INICIAL.id,
      domain: NOTEBOOK_INICIAL.domain,
      functions: NOTEBOOK_INICIAL.functions,
      relations: NOTEBOOK_INICIAL.relations,
      environment: NOTEBOOK_INICIAL.environment,
      formula: NOTEBOOK_INICIAL.formula,
      logs: NOTEBOOK_INICIAL.logs,
      activeMode: null,
      editingName: null,
      evaluationHistory: NOTEBOOK_INICIAL.evaluationHistory,

      createNotebook: (title) =>
        set((state) => {
          const guardado = sincronizarActivo(state, {});
          const listaActual = guardado.notebooks ?? state.notebooks;
          const nb = nuevoNotebook(title?.trim() || `Notebook ${listaActual.length + 1}`);
          return {
            notebooks: [...listaActual, nb],
            activeNotebookId: nb.id,
            domain: nb.domain,
            functions: nb.functions,
            relations: nb.relations,
            environment: nb.environment,
            formula: nb.formula,
            logs: nb.logs,
            evaluationHistory: nb.evaluationHistory,
            activeMode: null,
            editingName: null,
          };
        }),

      selectNotebook: (id) =>
        set((state) => {
          if (id === state.activeNotebookId) return {};
          const guardado = sincronizarActivo(state, {});
          const listaActual = guardado.notebooks ?? state.notebooks;
          const destino = listaActual.find((n) => n.id === id);
          if (!destino) return {};
          return {
            notebooks: listaActual,
            activeNotebookId: destino.id,
            domain: destino.domain,
            functions: destino.functions,
            relations: destino.relations,
            environment: destino.environment,
            formula: destino.formula,
            logs: destino.logs,
            evaluationHistory: destino.evaluationHistory,
            activeMode: null,
            editingName: null,
          };
        }),

      renameNotebook: (id, title) =>
        set((state) => {
          const limpio = title.trim();
          if (!limpio) return {};
          return {
            notebooks: state.notebooks.map((nb) => (nb.id === id ? { ...nb, title: limpio } : nb)),
          };
        }),

      deleteNotebook: (id) =>
        set((state) => {
          if (state.notebooks.length <= 1) {
            // si solo queda uno, lo reiniciamos en blanco
            const limpio = nuevoNotebook(state.notebooks[0]?.title || "Notebook 1");
            return {
              notebooks: [limpio],
              activeNotebookId: limpio.id,
              domain: limpio.domain,
              functions: limpio.functions,
              relations: limpio.relations,
              environment: limpio.environment,
              formula: limpio.formula,
              logs: limpio.logs,
              evaluationHistory: limpio.evaluationHistory,
              activeMode: null,
              editingName: null,
            };
          }
          const restantes = state.notebooks.filter((nb) => nb.id !== id);
          if (state.activeNotebookId !== id) {
            return { notebooks: restantes };
          }
          const siguiente = restantes[0];
          return {
            notebooks: restantes,
            activeNotebookId: siguiente.id,
            domain: siguiente.domain,
            functions: siguiente.functions,
            relations: siguiente.relations,
            environment: siguiente.environment,
            formula: siguiente.formula,
            logs: siguiente.logs,
            evaluationHistory: siguiente.evaluationHistory,
            activeMode: null,
            editingName: null,
          };
        }),

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

          return sincronizarActivo(state, {
            domain: newDomain,
            functions: fnAjustadas,
            relations: relAjustadas,
            environment: envAjustado,
            logs: [...state.logs, ...logList],
            activeMode: null,
            editingName: null,
          });
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

          return sincronizarActivo(state, {
            functions: copy,
            logs: [...state.logs, logMsg],
            activeMode: null,
            editingName: null,
          });
        }),

      deleteFunction: (name) =>
        set((state) => {
          const copy = { ...state.functions };
          delete copy[name];
          return sincronizarActivo(state, { functions: copy });
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

          return sincronizarActivo(state, {
            relations: copy,
            logs: [...state.logs, logMsg],
            activeMode: null,
            editingName: null,
          });
        }),

      deleteRelation: (name) =>
        set((state) => {
          const copy = { ...state.relations };
          delete copy[name];
          return sincronizarActivo(state, { relations: copy });
        }),

      saveEnvironmentDraft: (env) =>
        set((state) => {
          const formatted = Object.entries(env)
            .map(([k, v]) => `${k} ↦ ${v}`)
            .join(", ");
          return sincronizarActivo(state, {
            environment: env,
            logs: [...state.logs, `entorno s = [${formatted}]`],
            activeMode: null,
            editingName: null,
          });
        }),

      deleteEnvironmentVar: (varName) =>
        set((state) => {
          const copy = { ...state.environment };
          delete copy[varName];
          return sincronizarActivo(state, { environment: copy });
        }),

      setFormula: (formula) => set((state) => sincronizarActivo(state, { formula })),

      evaluateFormula: (texto) =>
        set((state) =>
          sincronizarActivo(state, {
            formula: texto,
            evaluationHistory: [...state.evaluationHistory, crearEvaluacion(texto, state)],
            logs: [...state.logs, `evaluar formula: ${texto}`],
          })
        ),

      loadExample: (id) =>
        set((state) => {
          const ejemplo = buscarEjemplo(id);
          if (!ejemplo) return {};
          const { interpretacion: interp, entorno, formulas } = ejemplo;
          const base = {
            domain: interp.dominio,
            functions: interp.funciones,
            relations: interp.relaciones,
            environment: entorno,
          };
          return sincronizarActivo(state, {
            ...base,
            formula: formulas[0],
            evaluationHistory: formulas.map((f) => crearEvaluacion(f, base)),
            logs: [`ejemplo cargado: ${ejemplo.titulo} (${ejemplo.fuente})`],
            activeMode: null,
            editingName: null,
          });
        }),

      importFromFile: (datos) =>
        set((state) => {
          const nuevoDominio =
            datos.dominio && datos.dominio.length > 0 ? datos.dominio : state.domain;
          const tieneDefiniciones =
            Boolean(datos.dominio?.length) ||
            Object.keys(datos.funciones).length > 0 ||
            Object.keys(datos.relaciones).length > 0 ||
            Object.keys(datos.entorno).length > 0;

          const baseFunctions = tieneDefiniciones
            ? { ...state.functions, ...datos.funciones }
            : state.functions;
          const baseRelations = tieneDefiniciones
            ? { ...state.relations, ...datos.relaciones }
            : state.relations;
          const baseEnv = tieneDefiniciones
            ? { ...state.environment, ...datos.entorno }
            : state.environment;

          const { funciones: fnAjustadas, relaciones: relAjustadas } = ajustarAlDominio(
            nuevoDominio,
            baseFunctions,
            baseRelations
          );

          const envAjustado: Record<string, string> = {};
          for (const [v, val] of Object.entries(baseEnv)) {
            if (nuevoDominio.includes(val)) envAjustado[v] = val;
          }

          const base = {
            domain: nuevoDominio,
            functions: fnAjustadas,
            relations: relAjustadas,
            environment: envAjustado,
          };

          const nuevasEvals = datos.formulas.map((f) => crearEvaluacion(f, base));

          return sincronizarActivo(state, {
            ...base,
            formula: datos.formulas[datos.formulas.length - 1] ?? state.formula,
            evaluationHistory: [...state.evaluationHistory, ...nuevasEvals],
            activeMode: null,
            editingName: null,
          });
        }),

      addLog: (text) =>
        set((state) => sincronizarActivo(state, { logs: [...state.logs, text] })),

      addEvaluation: (item) =>
        set((state) =>
          sincronizarActivo(state, {
            evaluationHistory: [...state.evaluationHistory, item],
          })
        ),

      updateEvaluation: (id, updates) =>
        set((state) =>
          sincronizarActivo(state, {
            evaluationHistory: state.evaluationHistory.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          })
        ),

      clearEvaluations: () =>
        set((state) => sincronizarActivo(state, { evaluationHistory: [] })),

      resetAll: () =>
        set((state) =>
          sincronizarActivo(state, {
            domain: [],
            functions: {},
            relations: {},
            environment: {},
            formula: "",
            logs: [],
            activeMode: null,
            editingName: null,
            evaluationHistory: [],
          })
        ),
    }),
    {
      name: "semantics-expert-notebooks-v1",
      partialize: (state) => ({
        notebooks: state.notebooks,
        activeNotebookId: state.activeNotebookId,
        domain: state.domain,
        functions: state.functions,
        relations: state.relations,
        environment: state.environment,
        formula: state.formula,
        logs: state.logs,
        evaluationHistory: state.evaluationHistory,
      }),
    }
  )
);
