export interface ServerManager {
  createServer(options?: any): any
  startServer(server: any, port?: number, host?: string): Promise<void>
  stopServer(server: any): Promise<void>
  getServer(serverId: string): any
  getAllServers(): any[]
  removeServer(serverId: string): void
}

export const serverManager: ServerManager
