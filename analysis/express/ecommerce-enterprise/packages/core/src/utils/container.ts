/**
 * Dependency Injection Container
 */

export const createContainer = () => {
  const services = new Map<string, any>()
  const factories = new Map<string, () => any>()
  
  return {
    register: <T>(name: string, service: T): void => {
      services.set(name, service)
    },
    
    registerFactory: <T>(name: string, factory: () => T): void => {
      factories.set(name, factory)
    },
    
    resolve: <T>(name: string): T => {
      if (services.has(name)) {
        return services.get(name)
      }
      
      if (factories.has(name)) {
        const factory = factories.get(name)!
        const service = factory()
        services.set(name, service)
        return service
      }
      
      throw new Error(`Service '${name}' not found`)
    }
  }
}
