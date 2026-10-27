"use client";

import React from "react";

// punto con luz parpadeante y texto que puede cambiar de estado
export type EstadoPunto = "cargando" | "exito" | "error" | "advertencia" | "neutro";

export interface StatusIndicatorProps {
  // mensaje que se muestra al lado del punto
  label?: string;
  // color y comportamiento del punto
  estado?: EstadoPunto;
  // si el punto debe palpitar
  pulsando?: boolean;
  className?: string;
}

export default function StatusIndicator({
  label = "evaluando",
  estado = "cargando",
  pulsando = true,
  className = "",
}: StatusIndicatorProps) {
  // colores del punto segun el estado
  const colorPunto = {
    cargando: "bg-emerald-500",
    exito: "bg-emerald-600",
    error: "bg-rose-500",
    advertencia: "bg-amber-500",
    neutro: "bg-neutral-400",
  }[estado];

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs text-neutral-500 select-none transition-all ${className}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${colorPunto} ${
          pulsando ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
