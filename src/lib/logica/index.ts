// mapa de la logica del proyecto, para que se sepa que archivo sirve para que
//   tipos.ts           tipos de datos y reglas de lectura acordadas
//   errores.ts         tipo de error comun
//   atajos.ts          atajos de teclado (->, <->, E x)
//   nombres.ts         validacion de nombres de simbolos y variables
//   lexico.ts          texto -> tokens
//   sintaxis.ts        tokens -> arbol, con revision de simbolos y aridades
//   formulas.ts        texto de formulas y variables libres
//   interpretacion.ts  revision del dominio, funciones, relaciones y entorno
//   semantica.ts       valor de verdad y explicacion (testigo, contraejemplo, comprobacion)
//   evaluador.ts       evaluar(): todo el proceso en un solo paso
//   ejemplos.ts        interpretaciones y formulas de ejemplo de las presentaciones

export * from "./tipos";
export * from "./errores";
export * from "./atajos";
export * from "./nombres";
export * from "./lexico";
export * from "./sintaxis";
export * from "./formulas";
export * from "./interpretacion";
export * from "./semantica";
export * from "./evaluador";
export * from "./ejemplos";
