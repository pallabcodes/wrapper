import { Command } from '../command';

export interface ICommandHandler<T extends Command = any, R = any> {
  execute(command: T): Promise<R>;
}
