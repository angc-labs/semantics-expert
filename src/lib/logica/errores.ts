// tipo de error que comparten todas las partes de la logica
// una entrada con errores nunca recibe valor de verdad (requisito 7 del proyecto)

export type TipoError =
  | "sintaxis"
  | "simbolo"
  | "aridad"
  | "dominio"
  | "tupla"
  | "entorno";

export interface ErrorLogico {
  tipo: TipoError;
  mensaje: string;
  // posicion dentro de la formula, solo cuando el error viene del texto
  posicion?: number;
}
