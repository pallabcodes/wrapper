/**
 * Advanced TypeScript Utilities and Type System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - Enhanced type providers and schema compilers
 * - Advanced generic type utilities
 * - Runtime type validation and transformation
 * - Type-safe configuration builders
 * - Custom type definitions and factories
 */

'use strict'

/**
 * Advanced Type Provider Interface
 */
class TypeProvider {
  constructor(options = {}) {
    this.options = {
      enableRuntimeValidation: options.enableRuntimeValidation !== false,
      strictMode: options.strictMode || false,
      enableTransforms: options.enableTransforms !== false,
      ...options
    }
    
    this.typeCache = new Map()
    this.validators = new Map()
    this.transformers = new Map()
  }

  /**
   * Register type validator
   */
  registerValidator(typeName, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function')
    }
    this.validators.set(typeName, validator)
  }

  /**
   * Register type transformer
   */
  registerTransformer(typeName, transformer) {
    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function')
    }
    this.transformers.set(typeName, transformer)
  }

  /**
   * Validate value against type
   */
  validate(value, typeName, options = {}) {
    if (!this.options.enableRuntimeValidation && !options.force) {
      return { valid: true, value }
    }
    
    const validator = this.validators.get(typeName)
    if (!validator) {
      if (this.options.strictMode) {
        throw new Error(`Unknown type: ${typeName}`)
      }
      return { valid: true, value }
    }
    
    try {
      const result = validator(value, options)
      return typeof result === 'boolean' 
        ? { valid: result, value }
        : result
    } catch (error) {
      return { valid: false, error: error.message, value }
    }
  }

  /**
   * Transform value to target type
   */
  transform(value, fromType, toType, options = {}) {
    if (!this.options.enableTransforms) {
      return value
    }
    
    const transformerKey = `${fromType}->${toType}`
    const transformer = this.transformers.get(transformerKey)
    
    if (!transformer) {
      return value
    }
    
    try {
      return transformer(value, options)
    } catch (error) {
      if (this.options.strictMode) {
        throw error
      }
      return value
    }
  }

  /**
   * Create type-safe builder
   */
  createBuilder(schema) {
    return new TypeSafeBuilder(schema, this)
  }
}

/**
 * Type-Safe Configuration Builder
 */
class TypeSafeBuilder {
  constructor(schema, typeProvider) {
    this.schema = schema
    this.typeProvider = typeProvider
    this.config = {}
    this.errors = []
  }

  /**
   * Set configuration value with type checking
   */
  set(key, value, type = null) {
    const schemaEntry = this.schema[key]
    const expectedType = type || (schemaEntry && schemaEntry.type)
    
    if (expectedType && this.typeProvider) {
      const validation = this.typeProvider.validate(value, expectedType)
      if (!validation.valid) {
        this.errors.push({
          key,
          value,
          expectedType,
          error: validation.error || 'Type validation failed'
        })
        return this
      }
      value = validation.value
    }
    
    this.config[key] = value
    return this
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = undefined) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue
  }

  /**
   * Validate entire configuration
   */
  validate() {
    const results = []
    
    for (const [key, schemaEntry] of Object.entries(this.schema)) {
      const value = this.config[key]
      
      // Check required fields
      if (schemaEntry.required && value === undefined) {
        results.push({
          key,
          error: 'Required field is missing',
          severity: 'error'
        })
        continue
      }
      
      // Skip validation if value is undefined and not required
      if (value === undefined) continue
      
      // Type validation
      if (schemaEntry.type && this.typeProvider) {
        const validation = this.typeProvider.validate(value, schemaEntry.type)
        if (!validation.valid) {
          results.push({
            key,
            value,
            expectedType: schemaEntry.type,
            error: validation.error,
            severity: 'error'
          })
        }
      }
      
      // Custom validation
      if (schemaEntry.validator) {
        try {
          const isValid = schemaEntry.validator(value)
          if (!isValid) {
            results.push({
              key,
              value,
              error: 'Custom validation failed',
              severity: 'error'
            })
          }
        } catch (error) {
          results.push({
            key,
            value,
            error: `Custom validation error: ${error.message}`,
            severity: 'error'
          })
        }
      }
    }
    
    return {
      valid: results.every(r => r.severity !== 'error'),
      errors: results,
      warnings: results.filter(r => r.severity === 'warning')
    }
  }

  /**
   * Build final configuration
   */
  build() {
    const validation = this.validate()
    
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `${e.key}: ${e.error}`)
      throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`)
    }
    
    return { ...this.config }
  }

  /**
   * Reset builder
   */
  reset() {
    this.config = {}
    this.errors = []
    return this
  }
}

/**
 * Advanced Schema Compiler for TypeScript
 */
class TypeScriptSchemaCompiler {
  constructor(options = {}) {
    this.options = {
      generateTypes: options.generateTypes !== false,
      outputPath: options.outputPath || './types',
      enableJSDoc: options.enableJSDoc !== false,
      ...options
    }
    
    this.schemas = new Map()
    this.compiledTypes = new Map()
  }

  /**
   * Compile JSON schema to TypeScript types
   */
  compileSchema(name, schema) {
    const typeDefinition = this.generateTypeDefinition(name, schema)
    const validator = this.generateValidator(name, schema)
    
    this.compiledTypes.set(name, {
      typeDefinition,
      validator,
      schema,
      compiledAt: Date.now()
    })
    
    return {
      typeDefinition,
      validator
    }
  }

  /**
   * Generate TypeScript type definition from schema
   */
  generateTypeDefinition(name, schema) {
    const capitalizedName = this.capitalize(name)
    
    switch (schema.type) {
      case 'object':
        return this.generateObjectType(capitalizedName, schema)
      case 'array':
        return this.generateArrayType(capitalizedName, schema)
      case 'string':
        return this.generateStringType(capitalizedName, schema)
      case 'number':
      case 'integer':
        return this.generateNumberType(capitalizedName, schema)
      case 'boolean':
        return `export type ${capitalizedName} = boolean`
      default:
        return `export type ${capitalizedName} = any`
    }
  }

  /**
   * Generate object type definition
   */
  generateObjectType(name, schema) {
    const properties = schema.properties || {}
    const required = schema.required || []
    
    let typeDefinition = `export interface ${name} {\n`
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName)
      const propType = this.getPropertyType(propSchema)
      const optional = isRequired ? '' : '?'
      
      // Add JSDoc if enabled
      if (this.options.enableJSDoc && propSchema.description) {
        typeDefinition += `  /** ${propSchema.description} */\n`
      }
      
      typeDefinition += `  ${propName}${optional}: ${propType}\n`
    }
    
    typeDefinition += '}'
    
    // Add additional types for nested objects
    const nestedTypes = this.generateNestedTypes(name, properties)
    if (nestedTypes) {
      typeDefinition = nestedTypes + '\n\n' + typeDefinition
    }
    
    return typeDefinition
  }

  /**
   * Generate array type definition
   */
  generateArrayType(name, schema) {
    const itemType = schema.items ? this.getPropertyType(schema.items) : 'any'
    return `export type ${name} = ${itemType}[]`
  }

  /**
   * Generate string type definition
   */
  generateStringType(name, schema) {
    if (schema.enum && schema.enum.length > 0) {
      const enumValues = schema.enum.map(v => `'${v}'`).join(' | ')
      return `export type ${name} = ${enumValues}`
    }
    return `export type ${name} = string`
  }

  /**
   * Generate number type definition
   */
  generateNumberType(name, schema) {
    return `export type ${name} = number`
  }

  /**
   * Get property type string
   */
  getPropertyType(propSchema) {
    switch (propSchema.type) {
      case 'string':
        if (propSchema.enum) {
          return propSchema.enum.map(v => `'${v}'`).join(' | ')
        }
        return 'string'
      case 'number':
      case 'integer':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array':
        const itemType = propSchema.items ? this.getPropertyType(propSchema.items) : 'any'
        return `${itemType}[]`
      case 'object':
        return '{ [key: string]: any }' // Simplified for nested objects
      default:
        return 'any'
    }
  }

  /**
   * Generate nested types for complex objects
   */
  generateNestedTypes(parentName, properties) {
    let nestedTypes = ''
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      if (propSchema.type === 'object' && propSchema.properties) {
        const nestedName = `${parentName}${this.capitalize(propName)}`
        nestedTypes += this.generateObjectType(nestedName, propSchema) + '\n\n'
      }
    }
    
    return nestedTypes.trim()
  }

  /**
   * Generate runtime validator
   */
  generateValidator(name, schema) {
    return (value) => {
      try {
        this.validateValue(value, schema)
        return { valid: true, value }
      } catch (error) {
        return { valid: false, error: error.message, value }
      }
    }
  }

  /**
   * Validate value against schema
   */
  validateValue(value, schema) {
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Expected string, got ${typeof value}`)
        }
        if (schema.enum && !schema.enum.includes(value)) {
          throw new Error(`Value must be one of: ${schema.enum.join(', ')}`)
        }
        break
        
      case 'number':
      case 'integer':
        if (typeof value !== 'number') {
          throw new Error(`Expected number, got ${typeof value}`)
        }
        if (schema.type === 'integer' && !Number.isInteger(value)) {
          throw new Error('Expected integer')
        }
        break
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Expected boolean, got ${typeof value}`)
        }
        break
        
      case 'object':
        if (typeof value !== 'object' || value === null) {
          throw new Error(`Expected object, got ${typeof value}`)
        }
        this.validateObject(value, schema)
        break
        
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Expected array, got ${typeof value}`)
        }
        this.validateArray(value, schema)
        break
    }
  }

  /**
   * Validate object properties
   */
  validateObject(value, schema) {
    const required = schema.required || []
    const properties = schema.properties || {}
    
    // Check required properties
    for (const prop of required) {
      if (!(prop in value)) {
        throw new Error(`Missing required property: ${prop}`)
      }
    }
    
    // Validate properties
    for (const [prop, propValue] of Object.entries(value)) {
      const propSchema = properties[prop]
      if (propSchema) {
        try {
          this.validateValue(propValue, propSchema)
        } catch (error) {
          throw new Error(`Property '${prop}': ${error.message}`)
        }
      }
    }
  }

  /**
   * Validate array items
   */
  validateArray(value, schema) {
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        try {
          this.validateValue(value[i], schema.items)
        } catch (error) {
          throw new Error(`Item ${i}: ${error.message}`)
        }
      }
    }
  }

  /**
   * Capitalize string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Get all compiled types
   */
  getCompiledTypes() {
    return Object.fromEntries(this.compiledTypes)
  }

  /**
   * Generate TypeScript declaration file
   */
  generateDeclarationFile() {
    let content = '// Auto-generated TypeScript definitions\n\n'
    
    for (const [name, compiled] of this.compiledTypes.entries()) {
      content += compiled.typeDefinition + '\n\n'
    }
    
    return content
  }
}

/**
 * Runtime Type Guards and Utilities
 */
class TypeGuards {
  /**
   * Check if value is of specific type
   */
  static is(value, type) {
    switch (type) {
      case 'string': return typeof value === 'string'
      case 'number': return typeof value === 'number'
      case 'boolean': return typeof value === 'boolean'
      case 'object': return typeof value === 'object' && value !== null
      case 'array': return Array.isArray(value)
      case 'function': return typeof value === 'function'
      case 'undefined': return value === undefined
      case 'null': return value === null
      default: return false
    }
  }

  /**
   * Assert value is of specific type
   */
  static assert(value, type, message) {
    if (!this.is(value, type)) {
      throw new Error(message || `Expected ${type}, got ${typeof value}`)
    }
    return value
  }

  /**
   * Safe type conversion
   */
  static convert(value, targetType) {
    switch (targetType) {
      case 'string':
        return String(value)
      case 'number':
        const num = Number(value)
        return isNaN(num) ? 0 : num
      case 'boolean':
        return Boolean(value)
      case 'array':
        return Array.isArray(value) ? value : [value]
      default:
        return value
    }
  }

  /**
   * Deep type checking for objects
   */
  static deepIs(value, schema) {
    if (!schema || typeof schema !== 'object') {
      return this.is(value, schema)
    }

    if (schema.type) {
      if (!this.is(value, schema.type)) {
        return false
      }

      if (schema.type === 'object' && schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (!this.deepIs(value[key], propSchema)) {
            return false
          }
        }
      }

      if (schema.type === 'array' && schema.items) {
        if (!Array.isArray(value)) return false
        return value.every(item => this.deepIs(item, schema.items))
      }
    }

    return true
  }
}

/**
 * Factory functions
 */
function createTypeProvider(options = {}) {
  const provider = new TypeProvider(options)
  
  // Register common validators
  provider.registerValidator('string', (value) => typeof value === 'string')
  provider.registerValidator('number', (value) => typeof value === 'number')
  provider.registerValidator('boolean', (value) => typeof value === 'boolean')
  provider.registerValidator('object', (value) => typeof value === 'object' && value !== null)
  provider.registerValidator('array', (value) => Array.isArray(value))
  
  return provider
}

function createSchemaCompiler(options = {}) {
  return new TypeScriptSchemaCompiler(options)
}

module.exports = {
  TypeProvider,
  TypeSafeBuilder,
  TypeScriptSchemaCompiler,
  TypeGuards,
  createTypeProvider,
  createSchemaCompiler
}
