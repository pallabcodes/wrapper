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
import { TRANSACTION_KEY, TransactionOptions } from '../decorators/transaction.decorator';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const transactionOptions = this.reflector.get<TransactionOptions>(
      TRANSACTION_KEY,
      context.getHandler(),
    );

    if (!transactionOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const databaseService = request.databaseService; // Assuming this is injected

    if (!databaseService) {
      this.logger.warn('Database service not available for transaction');
      return next.handle();
    }

    return new Observable(subscriber => {
      databaseService.beginTransaction(transactionOptions)
        .then(transaction => {
          request.transaction = transaction;
          
          next.handle()
            .pipe(
              tap(result => {
                transaction.commit()
                  .then(() => {
                    subscriber.next(result);
                    subscriber.complete();
                  })
                  .catch(error => {
                    this.logger.error('Transaction commit failed', error);
                    subscriber.error(error);
                  });
              }),
              catchError(error => {
                transaction.rollback()
                  .then(() => {
                    subscriber.error(error);
                  })
                  .catch(rollbackError => {
                    this.logger.error('Transaction rollback failed', rollbackError);
                    subscriber.error(error);
                  });
                return throwError(() => error);
              })
            )
            .subscribe();
        })
        .catch(error => {
          this.logger.error('Failed to begin transaction', error);
          subscriber.error(error);
        });
    });
  }
}

