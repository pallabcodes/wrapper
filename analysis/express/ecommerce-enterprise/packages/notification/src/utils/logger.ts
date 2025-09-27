/**
 * Logger Utility - Winston-based logging for the notification microservice
 */

import winston from 'winston'

const logLevel = process.env['LOG_LEVEL'] || 'info'
const isDevelopment = process.env['NODE_ENV'] === 'development'

// Create custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    return log
  })
)

// Create custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: { service: 'notification-microservice' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: logLevel,
      format: isDevelopment ? devFormat : prodFormat
    }),
    
    // File transport for production logs
    ...(isDevelopment ? [] : [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ])
  ]
})

// Add stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim())
  }
}

// Export logger methods for convenience
export const logInfo = (message: string, meta?: any) => logger.info(message, meta)
export const logError = (message: string, meta?: any) => logger.error(message, meta)
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta)
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta)
