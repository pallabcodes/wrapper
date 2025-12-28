export interface ICommand {
  correlationId?: string;
  userId?: string;
  timestamp?: Date;
}

export abstract class Command implements ICommand {
  public readonly correlationId: string;
  public readonly userId?: string;
  public readonly timestamp: Date;

  constructor(props?: Partial<ICommand>) {
    this.correlationId = props?.correlationId || `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.userId = props?.userId;
    this.timestamp = props?.timestamp || new Date();
  }
}

// Command Examples
export class CreateUserCommand extends Command {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class UpdateUserCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly email?: string,
    correlationId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class CreateOrderCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly items: Array<{ productId: string; quantity: number; price: number }>,
    public readonly totalAmount: number,
    correlationId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class ProcessPaymentCommand extends Command {
  constructor(
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly currency: string,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}
