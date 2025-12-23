import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock winston before importing logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    add: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}))

// Mock env before importing logger
jest.mock('../../config/env', () => ({
  env: {
    LOG_LEVEL: 'info',
    NODE_ENV: 'development'
  }
}))

// Import after mocking
import { logger } from '../../utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Logger Instance', () => {
    it('should export a logger instance', () => {
      // Assert
      expect(logger).toBeDefined()
      expect(typeof logger).toBe('object')
    })

    it('should have logging methods', () => {
      // Assert
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('debug')
    })

    it('should have working logging methods', () => {
      // Act & Assert
      expect(() => logger.error('test error')).not.toThrow()
      expect(() => logger.warn('test warning')).not.toThrow()
      expect(() => logger.info('test info')).not.toThrow()
      expect(() => logger.debug('test debug')).not.toThrow()
    })
  })

  describe('Logger Functionality', () => {
    it('should handle error logging', () => {
      // Act
      logger.error('Test error message')

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Test error message')
    })

    it('should handle warning logging', () => {
      // Act
      logger.warn('Test warning message')

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Test warning message')
    })

    it('should handle info logging', () => {
      // Act
      logger.info('Test info message')

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Test info message')
    })

    it('should handle debug logging', () => {
      // Act
      logger.debug('Test debug message')

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('Test debug message')
    })

    it('should handle logging with metadata', () => {
      // Act
      logger.info('Test message', { userId: '123', action: 'login' })

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Test message', { userId: '123', action: 'login' })
    })

    it('should handle multiple log calls', () => {
      // Act
      logger.info('First message')
      logger.error('Second message')
      logger.warn('Third message')

      // Assert
      expect(logger.info).toHaveBeenCalledWith('First message')
      expect(logger.error).toHaveBeenCalledWith('Second message')
      expect(logger.warn).toHaveBeenCalledWith('Third message')
    })

    it('should handle empty messages', () => {
      // Act
      logger.info('')

      // Assert
      expect(logger.info).toHaveBeenCalledWith('')
    })

    it('should handle null messages', () => {
      // Act
      logger.info(null as any)

      // Assert
      expect(logger.info).toHaveBeenCalledWith(null)
    })

    it('should handle undefined messages', () => {
      // Act
      logger.info(undefined as any)

      // Assert
      expect(logger.info).toHaveBeenCalledWith(undefined)
    })
  })

  describe('Logger Configuration', () => {
    it('should be properly configured', () => {
      // Assert
      expect(logger).toBeDefined()
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('should maintain method references', () => {
      // Arrange
      const errorMethod = logger.error
      const warnMethod = logger.warn
      const infoMethod = logger.info
      const debugMethod = logger.debug

      // Assert
      expect(errorMethod).toBe(logger.error)
      expect(warnMethod).toBe(logger.warn)
      expect(infoMethod).toBe(logger.info)
      expect(debugMethod).toBe(logger.debug)
    })
  })
})
