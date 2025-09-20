import { SetMetadata } from '@nestjs/common';

export const TRANSACTION_KEY = 'transaction';

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  timeout?: number;
  retries?: number;
}

export const Transaction = (options?: TransactionOptions) => SetMetadata(TRANSACTION_KEY, options || {});

