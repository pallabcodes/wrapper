/**
 * Structured Logger Configuration
 * 
 * Fastify-compatible logger with structured output and proper error handling.
 * Supports different log levels for development and production environments.
 */

export const createLogger = (): any => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    level: isDevelopment ? 'debug' : 'info',
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.ip,
        remotePort: req.socket?.remotePort
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: res.headers
      }),
      err: (err: any) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack
      })
    },
    transport: isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard'
      }
    } : undefined
  }
}
