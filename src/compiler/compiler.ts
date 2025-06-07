import { Parser } from "../core/parser";
import { Token } from "../core/types";

export class Compiler {
  compile(source: string): string {
    const tokens: Token[] = [];
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return "";
  }
}
