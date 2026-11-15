"use client";

import React, { useMemo } from "react";
import type { Explicacion } from "@/lib/logica/semantica";

export const FUENTE_CLASICA = '"Times New Roman", Times, serif';

interface Linea {
  n: number;
  prof: number;
  texto: string;
  just: string;
  suposicion?: boolean;
  valor?: boolean;
}

const vf = (b: boolean) => (b ? "V" : "F");

// aplana la explicacion en lineas numeradas al estilo de deduccion natural:
// cada elemento de D que se revisa abre una subdemostracion con su suposicion
function aplanar(raiz: Explicacion): Linea[] {
  const lineas: Linea[] = [];
  const agregar = (prof: number, texto: string, just: string, suposicion = false, valor?: boolean) => {
    lineas.push({ n: lineas.length + 1, prof, texto, just, suposicion, valor });
    return lineas.length;
  };

  function visitar(e: Explicacion, prof: number): number {
    if (e.hijos.length === 0) {
      return agregar(prof, `${e.formula}  =  ${vf(e.valor)}`, `Interpretación: ${e.razon}`, false, e.valor);
    }
    if (e.variable !== undefined && e.elementos) {
      const rangos: string[] = [];
      e.hijos.forEach((h, i) => {
        const ini = agregar(prof + 1, `${e.variable} = ${e.elementos![i]}`, "Asignación en D", true);
        visitar(h, prof + 1);
        rangos.push(`${ini}–${lineas.length}`);
      });
      return agregar(prof, `${e.formula}  =  ${vf(e.valor)}`, `${e.razon}, ${rangos.join(", ")}`, false, e.valor);
    }
    const refs = e.hijos.map((h) => visitar(h, prof));
    return agregar(prof, `${e.formula}  =  ${vf(e.valor)}`, `${e.razon}, ${refs.join(", ")}`, false, e.valor);
  }

  visitar(raiz, 0);
  return lineas;
}

// demostracion numerada con barras verticales para las subdemostraciones
export default function Demostracion({ explicacion }: { explicacion: Explicacion }) {
  const lineas = useMemo(() => aplanar(explicacion), [explicacion]);
  return (
    <div
      style={{ fontFamily: FUENTE_CLASICA, gridTemplateColumns: "auto max-content 1fr" }}
      className="grid overflow-hidden rounded-lg border border-neutral-300 text-[17px] leading-7 text-neutral-900"
    >
      {lineas.map((l) => {
        // estilo diff de git: verde si la linea es verdadera, rojo si es falsa
        const fondo =
          l.valor === undefined ? "bg-white" : l.valor ? "bg-emerald-100" : "bg-rose-100";
        const marca =
          l.valor === undefined ? "text-neutral-500" : l.valor ? "text-emerald-800" : "text-rose-800";
        const borde =
          l.valor === undefined
            ? "border-l-4 border-transparent"
            : l.valor
              ? "border-l-4 border-emerald-600"
              : "border-l-4 border-rose-600";
        return (
          <React.Fragment key={l.n}>
            <span className={`${fondo} ${borde} flex gap-2 py-0.5 pl-2 pr-3`}>
              <span className={`w-3 text-center font-bold ${marca}`}>
                {l.valor === undefined ? "" : l.valor ? "+" : "−"}
              </span>
              <span className="w-6 text-right tabular-nums">{l.n}.</span>
            </span>
            <div className={`${fondo} flex items-stretch py-0.5 pr-8`}>
              {Array.from({ length: l.prof }).map((_, i) => (
                <span key={i} className="mr-2 w-2 shrink-0 border-l border-neutral-900" />
              ))}
              <span className={l.suposicion ? "border-b border-neutral-900 pr-3" : ""}>{l.texto}</span>
            </div>
            <span className={`${fondo} py-0.5 pr-3 text-neutral-800`}>{l.just}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
