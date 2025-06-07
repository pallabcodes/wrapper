import { Token, AST } from "./types";

export class Parser {
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST {
    return {
      type: "Program",
      body: [],
    };
  }
}
