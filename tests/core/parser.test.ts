import { Parser, Token } from "../../src/core";

describe("Parser", () => {
  it("should create AST from tokens", () => {
    const tokens: Token[] = [
      {
        type: "identifier",
        value: "test",
        start: 0,
        end: 4,
      },
    ];

    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe("Program");
    expect(Array.isArray(ast.body)).toBe(true);
  });
});
