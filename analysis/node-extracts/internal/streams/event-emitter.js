class EventEmitter {
  constructor() {
    this._events = new Map();
  }
  
  on(event, listener) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(listener);
    return this;
  }
  
  emit(event, ...args) {
    const listeners = this._events.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener.apply(this, args);
      }
    }
    return true;
  }
  
  removeListener(event, listener) {
    const listeners = this._events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
    return this;
  }

  once(event, listener) {
    const wrapped = (...args) => {
      this.removeListener(event, wrapped);
      listener.apply(this, args);
    };
    this.on(event, wrapped);
    return this;
  }
}

module.exports = { EventEmitter };