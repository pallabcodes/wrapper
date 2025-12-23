import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import type { QueryRunner } from 'typeorm';
import { TRANSACTION_KEY, TransactionOptions } from '../decorators/transaction.decorator';

interface DatabaseService {
  beginTransaction(options?: TransactionOptions): Promise<QueryRunner>;
}

interface TransactionRequest {
  databaseService?: DatabaseService;
  transaction?: QueryRunner;
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept<T = unknown>(context: ExecutionContext, next: CallHandler): Observable<T> {
    const transactionOptions = this.reflector.get<TransactionOptions>(
      TRANSACTION_KEY,
      context.getHandler(),
    );

    if (!transactionOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<TransactionRequest>();
    const databaseService = request.databaseService;

    if (!databaseService) {
      this.logger.warn('Database service not available for transaction');
      return next.handle();
    }

    return new Observable<T>(subscriber => {
      databaseService.beginTransaction(transactionOptions)
        .then((transaction: QueryRunner) => {
          request.transaction = transaction;
          
          next.handle()
            .pipe(
              tap((result: T) => {
                transaction.commitTransaction()
                  .then(() => {
                    subscriber.next(result);
                    subscriber.complete();
                  })
                  .catch((error: Error) => {
                    this.logger.error('Transaction commit failed', error);
                    subscriber.error(error);
                  });
              }),
              catchError((error: Error) => {
                transaction.rollbackTransaction()
                  .then(() => {
                    subscriber.error(error);
                  })
                  .catch((rollbackError: Error) => {
                    this.logger.error('Transaction rollback failed', rollbackError);
                    subscriber.error(error);
                  });
                return throwError(() => error);
              })
            )
            .subscribe();
        })
        .catch((error: Error) => {
          this.logger.error('Failed to begin transaction', error);
          subscriber.error(error);
        });
    });
  }
}

