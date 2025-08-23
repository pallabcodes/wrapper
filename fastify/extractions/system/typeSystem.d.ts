export interface TypeSystem {
  registerType(name: string, type: any): void
  getType(name: string): any
  hasType(name: string): boolean
  removeType(name: string): void
  getAllTypes(): Record<string, any>
  validateType(data: any, typeName: string): boolean
}

export const typeSystem: TypeSystem
