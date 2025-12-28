import { Injectable, Logger, Type } from '@nestjs/common';
import { Query } from './query';
import { IQueryHandler } from './handlers/query-handler.interface';

@Injectable()
export class QueryBus {
  private readonly logger = new Logger('QueryBus');
  private handlers = new Map<string, IQueryHandler<Query, any>>();

  async execute<T extends Query, R = any>(query: T): Promise<R> {
    const handler = this.handlers.get(query.constructor.name);

    if (!handler) {
      throw new Error(`No handler found for query: ${query.constructor.name}`);
    }

    this.logger.debug(`Executing query: ${query.constructor.name}`, {
      correlationId: query.correlationId,
      userId: query.userId,
    });

    try {
      const result = await handler.execute(query);
      this.logger.debug(`Query executed successfully: ${query.constructor.name}`);
      return result;
    } catch (error) {
      this.logger.error(`Query execution failed: ${query.constructor.name}`, {
        error: error.message,
        correlationId: query.correlationId,
        userId: query.userId,
      });
      throw error;
    }
  }

  registerHandler<T extends Query, R = any>(
    queryType: Type<T>,
    handler: IQueryHandler<T, R>,
  ): void {
    this.handlers.set(queryType.name, handler as IQueryHandler<Query, any>);
    this.logger.log(`Registered query handler: ${queryType.name}`);
  }

  getHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}
