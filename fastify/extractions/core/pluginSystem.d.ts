export interface PluginSystem {
  register(plugin: any, options?: any): Promise<void>
  unregister(pluginName: string): Promise<void>
  hasPlugin(pluginName: string): boolean
  getPlugin(pluginName: string): any
  getPlugins(): any[]
  clearPlugins(): void
}

export const pluginSystem: PluginSystem
