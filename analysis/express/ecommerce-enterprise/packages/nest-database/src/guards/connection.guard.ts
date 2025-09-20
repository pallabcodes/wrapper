import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

@Injectable()
export class ConnectionGuard implements CanActivate {
  private readonly logger = new Logger(ConnectionGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const databaseService = request.databaseService;

    if (!databaseService) {
      this.logger.error('Database service not available');
      return false;
    }

    if (!databaseService.isConnected()) {
      this.logger.error('Database not connected');
      return false;
    }

    return true;
  }
}

