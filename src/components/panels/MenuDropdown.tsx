"use client";

import React, { useRef, useEffect } from "react";

export interface MenuItem {
  id: string;
  trigger: "@" | "/";
  label: string;
  insertText?: string;
  mode?: "dominio" | "funcion" | "relacion" | "entorno" | "formula";
  description: string;
  aliases: string[];
}

interface MenuDropdownProps {
  triggerType: "@" | "/";
  items: MenuItem[];
  selectedIndex: number;
  onSelect: (item: MenuItem) => void;
  onHoverIndex: (index: number) => void;
}

// menu flotante cuando se escribe @ o /
export default function MenuDropdown({
  triggerType,
  items,
  selectedIndex,
  onSelect,
  onHoverIndex,
}: MenuDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // hace scroll automatico para mantener la seleccion en pantalla
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const el = menu.querySelector<HTMLElement>(`[data-menu-idx="${selectedIndex}"]`);
    if (!el) return;
    const header = menu.querySelector<HTMLElement>("[data-menu-header]");
    const headerH = header?.offsetHeight ?? 0;
    const pad = 6;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top - headerH - pad < menu.scrollTop) {
      menu.scrollTop = top - headerH - pad;
    } else if (bottom + pad > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = bottom + pad - menu.clientHeight;
    }
  }, [selectedIndex, items]);

  return (
    <div
      ref={menuRef}
      role="listbox"
      className="panel-in absolute bottom-full left-0 mb-3 w-full max-h-64 overflow-y-auto rounded-3xl border border-neutral-200 bg-white/95 backdrop-blur p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-20"
    >
      <div
        data-menu-header
        className="sticky -top-1.5 z-10 -mt-1.5 pt-3 pb-1.5 px-3.5 rounded-t-2xl bg-white/95 backdrop-blur text-[11px] text-neutral-400 flex justify-between"
      >
        <span>
          {triggerType === "@"
            ? "simbolos logicos y cuantificadores (@)"
            : "comandos que abren editores (/)"}
        </span>
        <span>↑↓ mover · enter elegir · esc cerrar</span>
      </div>
      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={item.id}
            data-menu-idx={idx}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            onMouseEnter={() => onHoverIndex(idx)}
            className={`w-full text-left px-3.5 py-2 rounded-2xl flex items-center justify-between text-sm transition-colors cursor-pointer ${
              isSelected
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <span className="font-semibold">{item.label}</span>
            <span
              className={`text-xs truncate ml-4 ${
                isSelected ? "text-neutral-300" : "text-neutral-500"
              }`}
            >
              {item.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
