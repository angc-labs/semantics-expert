// errores logicos
// una entrada con errores nunca recibe valor de verdad

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
  // posicion dentro de la formula
  // solo cuando el error viene del texto
  posicion?: number;
}
