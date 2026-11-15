import { describe, expect, it } from "vitest";
import { analizarArchivoAdjunto, erroresDeImportacion } from "../archivo";
import { INTERP } from "./ayuda";

describe("importación y validación de archivos", () => {
  it("conserva un dominio explícitamente vacío para poder rechazarlo", () => {
    const datos = analizarArchivoAdjunto("D = {}");
    expect(datos.dominio).toEqual([]);
  });

  it("rechaza una función con una entrada fuera del dominio", () => {
    const datos = analizarArchivoAdjunto("D = {1, 2}\ns/1 = {(9) -> 1}");
    const errores = erroresDeImportacion(datos, INTERP, {});
    expect(errores.some((error) => error.includes("fuera de D"))).toBe(true);
  });

  it("rechaza relaciones vacías y tuplas con aridad incorrecta", () => {
    const datos = analizarArchivoAdjunto("D = {1, 2}\nP/2 = {(1)}");
    const errores = erroresDeImportacion(datos, INTERP, {});
    expect(errores.length).toBeGreaterThan(0);
    expect(errores.join(" ")).toMatch(/elemento|vacía/);
  });
});

