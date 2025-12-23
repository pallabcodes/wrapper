/**
 * Event Emitter
 */

export const createEventEmitter = <T extends Record<string, any>>() => {
  const listeners = new Map<keyof T, Array<(data: T[keyof T]) => void>>()
  
  return {
    on: <K extends keyof T>(event: K, listener: (data: T[K]) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event)!.push(listener as any)
    },
    
    emit: <K extends keyof T>(event: K, data: T[K]) => {
      const eventListeners = listeners.get(event)
      if (eventListeners) {
        eventListeners.forEach(listener => listener(data))
      }
    },
    
    off: <K extends keyof T>(event: K, listener: (data: T[K]) => void) => {
      const eventListeners = listeners.get(event)
      if (eventListeners) {
        const index = eventListeners.indexOf(listener as any)
        if (index > -1) {
          eventListeners.splice(index, 1)
        }
      }
    }
  }
}
