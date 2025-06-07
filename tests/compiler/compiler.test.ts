import { Compiler } from "../../src/compiler/compiler";

describe("Compiler", () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler();
  });

  test("should compile empty source", () => {
    expect(compiler.compile("")).toBe("");
  });

  it("should compile source code", () => {
    const result = compiler.compile("test");
    expect(typeof result).toBe("string");
  });
});
