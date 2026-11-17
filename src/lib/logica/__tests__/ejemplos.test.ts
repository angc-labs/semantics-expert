import { describe, it, expect } from "vitest";
import { EJEMPLOS } from "../ejemplos";

describe("ejemplos", () => {
  it("no tiene ejemplos hardcodeados en el proyecto", () => {
    expect(EJEMPLOS).toHaveLength(0);
  });
});
