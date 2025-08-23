export interface ErrorSystem {
  createError(message: string, statusCode?: number, code?: string): Error
  isFastifyError(error: any): boolean
  getStatusCode(error: any): number
  getErrorCode(error: any): string
  serializeError(error: any): any
  deserializeError(serialized: any): Error
}

export const errorSystem: ErrorSystem
