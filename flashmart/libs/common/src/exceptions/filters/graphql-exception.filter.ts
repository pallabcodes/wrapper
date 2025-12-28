import { Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter, GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger('GraphQLExceptionFilter');

  catch(exception: any, host: any): any {
    const gqlHost = host.switchToGraphQL();
    const context = gqlHost.getContext();
    const info = gqlHost.getInfo();

    // Log GraphQL errors
    this.logger.error({
      message: 'GraphQL Error',
      operation: info?.operation?.operation,
      fieldName: info?.fieldName,
      path: info?.path,
      variables: context?.req?.body?.variables,
      error: exception.message,
      stack: exception.stack,
      correlationId: context?.req?.headers?.['x-correlation-id'] || context?.req?.headers?.['x-request-id'],
    });

    // Return sanitized error for client
    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Handle validation errors
    if (exception?.response?.message && Array.isArray(exception.response.message)) {
      return new GraphQLError('Validation failed', {
        extensions: {
          code: 'VALIDATION_ERROR',
          errors: exception.response.message,
        },
      });
    }

    // Handle database constraint errors
    if (exception?.code === '23505') { // PostgreSQL unique constraint violation
      return new GraphQLError('Resource already exists', {
        extensions: {
          code: 'CONFLICT',
          originalError: exception,
        },
      });
    }

    // Handle foreign key constraint errors
    if (exception?.code === '23503') { // PostgreSQL foreign key violation
      return new GraphQLError('Referenced resource does not exist', {
        extensions: {
          code: 'NOT_FOUND',
          originalError: exception,
        },
      });
    }

    // Generic error handling
    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { originalError: exception }),
      },
    });
  }
}
