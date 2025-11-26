import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UserAlreadyExistsException } from '@domain/exceptions/user-already-exists.exception';
import { InvalidCredentialsException } from '@domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '@domain/exceptions/user-not-found.exception';

@Catch(UserAlreadyExistsException, InvalidCredentialsException, UserNotFoundException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception: UserAlreadyExistsException | InvalidCredentialsException | UserNotFoundException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof UserAlreadyExistsException) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    } else if (exception instanceof InvalidCredentialsException) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
    } else if (exception instanceof UserNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}
