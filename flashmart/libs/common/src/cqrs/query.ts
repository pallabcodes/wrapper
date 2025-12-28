export interface IQuery {
  correlationId?: string;
  userId?: string;
  timestamp?: Date;
}

export abstract class Query implements IQuery {
  public readonly correlationId: string;
  public readonly userId?: string;
  public readonly timestamp: Date;

  constructor(props?: Partial<IQuery>) {
    this.correlationId = props?.correlationId || `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.userId = props?.userId;
    this.timestamp = props?.timestamp || new Date();
  }
}

// Query Examples
export class GetUserQuery extends Query {
  constructor(
    public readonly userId: string,
    correlationId?: string,
    userId_param?: string,
  ) {
    super({ correlationId, userId: userId_param });
  }
}

export class GetUsersQuery extends Query {
  constructor(
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly search?: string,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class GetOrderQuery extends Query {
  constructor(
    public readonly orderId: string,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class GetUserOrdersQuery extends Query {
  constructor(
    public readonly userId: string,
    public readonly limit?: number,
    public readonly offset?: number,
    correlationId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class GetProductQuery extends Query {
  constructor(
    public readonly productId: string,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}

export class SearchProductsQuery extends Query {
  constructor(
    public readonly searchTerm?: string,
    public readonly category?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly limit?: number,
    public readonly offset?: number,
    correlationId?: string,
    userId?: string,
  ) {
    super({ correlationId, userId });
  }
}
