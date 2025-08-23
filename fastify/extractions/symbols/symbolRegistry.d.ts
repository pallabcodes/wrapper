export interface SymbolRegistry {
  register(symbol: symbol, metadata?: any): void
  get(symbol: symbol): any
  has(symbol: symbol): boolean
  delete(symbol: symbol): boolean
  clear(): void
  size(): number
  keys(): symbol[]
  values(): any[]
  entries(): [symbol, any][]
}

export const symbolRegistry: SymbolRegistry
