// parte 2 del analisis: sintaxis
// convierte los tokens en un arbol de formula (tipos.ts) y revisa simbolos y aridades
// gramatica (de la que ata menos a la que ata mas, ver PRECEDENCIA en tipos.ts):
//   bicondicional := implicacion ( ↔ implicacion )*     agrupa a la derecha
//   implicacion   := disyuncion ( → implicacion )?      agrupa a la derecha
//   disyuncion    := conjuncion ( ∨ conjuncion )*       agrupa a la izquierda
//   conjuncion    := unario ( ∧ unario )*               agrupa a la izquierda
//   unario        := ¬ unario | (∀|∃) variable unario | primario
//   primario      := ( bicondicional ) | predicado [ ( terminos ) ]
//   termino       := nombre [ ( terminos ) ]

import type { Formula, Interpretacion, Termino } from "./tipos";
import type { ErrorLogico } from "./errores";
import { NOMBRES_RESERVADOS } from "./nombres";
import { tokenizar, type Token, type TipoToken } from "./lexico";

export type Lenguaje = Pick<Interpretacion, "funciones" | "relaciones">;

export type ResultadoSintaxis =
  | { ok: true; formula: Formula; texto: string }
  | { ok: false; errores: ErrorLogico[] };

// error interno para cortar el analisis cuando ya no se puede seguir leyendo
class CorteSintaxis extends Error {
  constructor(public readonly detalle: ErrorLogico) {
    super(detalle.mensaje);
  }
}

const NOMBRES_TOKEN: Record<TipoToken, string> = {
  nombre: "un nombre",
  negacion: "¬",
  conjuncion: "∧",
  disyuncion: "∨",
  implicacion: "→",
  bicondicional: "↔",
  universal: "∀",
  existencial: "∃",
  abre: "(",
  cierra: ")",
  coma: ",",
  fin: "el final de la fórmula",
};

class Lector {
  private indice = 0;
  // errores de simbolo y aridad: no impiden seguir leyendo, se juntan todos
  readonly avisos: ErrorLogico[] = [];

  constructor(
    private readonly tokens: Token[],
    private readonly lenguaje: Lenguaje
  ) {}

  private actual(): Token {
    return this.tokens[this.indice];
  }

  private avanzar(): Token {
    const t = this.tokens[this.indice];
    if (t.tipo !== "fin") this.indice++;
    return t;
  }

  private esperar(tipo: TipoToken, contexto: string): Token {
    const t = this.actual();
    if (t.tipo !== tipo) {
      throw new CorteSintaxis({
        tipo: "sintaxis",
        mensaje: `Se esperaba ${NOMBRES_TOKEN[tipo]} ${contexto} pero se encontró ${
          t.tipo === "fin" ? NOMBRES_TOKEN.fin : `"${t.texto}"`
        }.`,
        posicion: t.posicion,
      });
    }
    return this.avanzar();
  }

  private avisar(tipo: ErrorLogico["tipo"], mensaje: string, posicion: number) {
    this.avisos.push({ tipo, mensaje, posicion });
  }

  // para que sirve: leer la formula completa y confirmar que no sobran tokens
  leerFormulaCompleta(): Formula {
    if (this.actual().tipo === "fin") {
      throw new CorteSintaxis({
        tipo: "sintaxis",
        mensaje: "La fórmula está vacía.",
        posicion: 0,
      });
    }
    const f = this.bicondicional();
    const t = this.actual();
    if (t.tipo !== "fin") {
      throw new CorteSintaxis({
        tipo: "sintaxis",
        mensaje:
          t.tipo === "cierra"
            ? `Paréntesis ")" sin pareja en la posición ${t.posicion + 1}.`
            : `Sobra "${t.texto}" en la posición ${t.posicion + 1}; falta un conectivo antes.`,
        posicion: t.posicion,
      });
    }
    return f;
  }

  private bicondicional(): Formula {
    const izquierda = this.implicacion();
    if (this.actual().tipo === "bicondicional") {
      this.avanzar();
      return { tipo: "binaria", conectivo: "↔", izquierda, derecha: this.bicondicional() };
    }
    return izquierda;
  }

  private implicacion(): Formula {
    const izquierda = this.disyuncion();
    if (this.actual().tipo === "implicacion") {
      this.avanzar();
      return { tipo: "binaria", conectivo: "→", izquierda, derecha: this.implicacion() };
    }
    return izquierda;
  }

  private disyuncion(): Formula {
    let izquierda = this.conjuncion();
    while (this.actual().tipo === "disyuncion") {
      this.avanzar();
      izquierda = { tipo: "binaria", conectivo: "∨", izquierda, derecha: this.conjuncion() };
    }
    return izquierda;
  }

  private conjuncion(): Formula {
    let izquierda = this.unario();
    while (this.actual().tipo === "conjuncion") {
      this.avanzar();
      izquierda = { tipo: "binaria", conectivo: "∧", izquierda, derecha: this.unario() };
    }
    return izquierda;
  }

  private unario(): Formula {
    const t = this.actual();
    if (t.tipo === "negacion") {
      this.avanzar();
      return { tipo: "negacion", formula: this.unario() };
    }
    if (t.tipo === "universal" || t.tipo === "existencial") {
      this.avanzar();
      const v = this.esperar("nombre", `después de ${t.texto}`);
      this.revisarVariableLigada(v);
      return {
        tipo: "cuantificador",
        cuantificador: t.tipo === "universal" ? "∀" : "∃",
        variable: v.texto,
        // el cuantificador solo abarca lo que tiene justo despues
        formula: this.unario(),
      };
    }
    return this.primario();
  }

  private revisarVariableLigada(v: Token) {
    const { funciones, relaciones } = this.lenguaje;
    if (NOMBRES_RESERVADOS.includes(v.texto)) {
      this.avisar("simbolo", `${v.texto} está reservado y no puede ser variable.`, v.posicion);
    } else if (funciones[v.texto] || relaciones[v.texto]) {
      this.avisar(
        "simbolo",
        `${v.texto} ya es el nombre de un símbolo y no puede ser variable.`,
        v.posicion
      );
    }
  }

  private primario(): Formula {
    const t = this.actual();
    if (t.tipo === "abre") {
      this.avanzar();
      const f = this.bicondicional();
      this.esperar("cierra", "para cerrar el paréntesis");
      return f;
    }
    if (t.tipo === "nombre") return this.atomo();
    throw new CorteSintaxis({
      tipo: "sintaxis",
      mensaje:
        t.tipo === "fin"
          ? "La fórmula termina antes de tiempo; falta una fórmula."
          : `No se esperaba "${t.texto}" en la posición ${t.posicion + 1}; falta una fórmula.`,
      posicion: t.posicion,
    });
  }

  private atomo(): Formula {
    const nombre = this.avanzar();
    const { funciones, relaciones } = this.lenguaje;
    const rel = relaciones[nombre.texto];
    const tieneParentesis = this.actual().tipo === "abre";
    const argumentos = tieneParentesis ? this.argumentos() : [];

    if (!rel) {
      if (funciones[nombre.texto]) {
        this.avisar(
          "simbolo",
          `${nombre.texto} es una función, no un predicado; no puede ser una fórmula por sí sola.`,
          nombre.posicion
        );
      } else if (NOMBRES_RESERVADOS.includes(nombre.texto)) {
        this.avisar("simbolo", `${nombre.texto} está reservado.`, nombre.posicion);
      } else {
        this.avisar(
          "simbolo",
          `${nombre.texto} no está declarado como predicado.`,
          nombre.posicion
        );
      }
    } else if (rel.arity !== argumentos.length) {
      this.avisar(
        "aridad",
        `${nombre.texto} recibe ${rel.arity} argumento(s) pero se le dieron ${argumentos.length}.`,
        nombre.posicion
      );
    }
    return { tipo: "atomo", predicado: nombre.texto, argumentos };
  }

  // lee ( termino , termino ... ) incluyendo los parentesis
  private argumentos(): Termino[] {
    this.esperar("abre", "para abrir los argumentos");
    const lista: Termino[] = [this.termino()];
    while (this.actual().tipo === "coma") {
      this.avanzar();
      lista.push(this.termino());
    }
    this.esperar("cierra", "para cerrar los argumentos");
    return lista;
  }

  private termino(): Termino {
    const nombre = this.esperar("nombre", "como término");
    const { funciones, relaciones } = this.lenguaje;
    const fn = funciones[nombre.texto];
    const tieneParentesis = this.actual().tipo === "abre";

    if (tieneParentesis) {
      const argumentos = this.argumentos();
      if (!fn) {
        this.avisar(
          "simbolo",
          relaciones[nombre.texto]
            ? `${nombre.texto} es un predicado y no puede usarse como término.`
            : `${nombre.texto} no está declarado como función.`,
          nombre.posicion
        );
      } else if (fn.arity !== argumentos.length) {
        this.avisar(
          "aridad",
          `${nombre.texto} recibe ${fn.arity} argumento(s) pero se le dieron ${argumentos.length}.`,
          nombre.posicion
        );
      }
      return { tipo: "funcion", nombre: nombre.texto, argumentos };
    }

    if (fn) {
      if (fn.arity !== 0) {
        this.avisar(
          "aridad",
          `${nombre.texto} recibe ${fn.arity} argumento(s) pero se usó sin argumentos.`,
          nombre.posicion
        );
      }
      return { tipo: "funcion", nombre: nombre.texto, argumentos: [] };
    }
    if (relaciones[nombre.texto]) {
      this.avisar(
        "simbolo",
        `${nombre.texto} es un predicado y no puede usarse como término.`,
        nombre.posicion
      );
    } else if (NOMBRES_RESERVADOS.includes(nombre.texto)) {
      this.avisar("simbolo", `${nombre.texto} está reservado.`, nombre.posicion);
    }
    return { tipo: "variable", nombre: nombre.texto };
  }
}

// para que sirve: leer el texto de una formula y devolver su arbol
// si hay cualquier error (sintaxis, simbolo o aridad) no devuelve formula
export function analizarFormula(entrada: string, lenguaje: Lenguaje): ResultadoSintaxis {
  const { tokens, texto, errores } = tokenizar(entrada);
  if (errores.length > 0) return { ok: false, errores };

  const lector = new Lector(tokens, lenguaje);
  try {
    const formula = lector.leerFormulaCompleta();
    if (lector.avisos.length > 0) return { ok: false, errores: lector.avisos };
    return { ok: true, formula, texto };
  } catch (e) {
    if (e instanceof CorteSintaxis) {
      // los avisos anteriores tambien se muestran junto al error que corto la lectura
      return { ok: false, errores: [...lector.avisos, e.detalle] };
    }
    throw e;
  }
}
