export interface Token {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface AST {
  type: string;
  body: any[];
}
