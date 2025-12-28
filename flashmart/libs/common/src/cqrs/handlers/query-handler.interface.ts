import { Query } from '../query';

export interface IQueryHandler<T extends Query = any, R = any> {
  execute(query: T): Promise<R>;
}
