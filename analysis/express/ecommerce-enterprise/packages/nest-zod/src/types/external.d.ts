/**
 * External type declarations for @nest-zod package
 * These provide type safety for external dependencies without requiring them to be installed
 */

declare module '@nestjs/websockets' {
  export interface WebSocketGateway {
    namespace?: string;
    cors?: boolean | object;
  }
  
  export interface SubscribeMessage {
    (message: string): MethodDecorator;
  }
  
  export interface WebSocketServer {
    (): PropertyDecorator;
  }
  
  export interface MessageBody {
    (): ParameterDecorator;
  }
  
  export interface ConnectedSocket {
    (): ParameterDecorator;
  }
  
  export interface WebSocketServer {
    (): PropertyDecorator;
  }
  
  export class WebSocketGateway {
    constructor();
  }
  
  export class SubscribeMessage {
    constructor();
  }
  
  export class WebSocketServer {
    constructor();
  }
  
  export class MessageBody {
    constructor();
  }
  
  export class ConnectedSocket {
    constructor();
  }
}

declare module 'socket.io' {
  export interface Server {
    emit(event: string, ...args: any[]): void;
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
    to(room: string): Server;
    in(room: string): Server;
  }
  
  export interface Socket {
    id: string;
    emit(event: string, ...args: any[]): void;
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
    join(room: string): void;
    leave(room: string): void;
    disconnect(): void;
  }
  
  export class Server {
    constructor();
  }
  
  export class Socket {
    constructor();
  }
}

// Additional type declarations for better type safety
declare global {
  namespace NodeJS {
    interface Process {
      memoryUsage(): {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
      };
      cpuUsage(previousValue?: NodeJS.CpuUsage): NodeJS.CpuUsage;
      uptime(): number;
    }
  }
}
