export interface ValidationSystem {
  addSchema(schema: any): void
  validate(data: any, schema: any): { valid: boolean; errors?: any[] }
  compile(schema: any): (data: any) => { valid: boolean; errors?: any[] }
  hasSchema(schemaId: string): boolean
  getSchema(schemaId: string): any
  removeSchema(schemaId: string): void
}

export const validationSystem: ValidationSystem
