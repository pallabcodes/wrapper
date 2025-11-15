/**
 * Lambda Handler: Auth Handlers
 * 
 * AWS Lambda handlers for authentication endpoints
 * Uses NestJS application context via handler factory
 * 
 * This is the "Presentation" layer in Hexagonal Architecture
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getApp } from '@infrastructure/lambda/lambda.handler.factory';
import { AuthService } from '@application/services/auth.service';
import { RegisterDto } from '@application/dto/register.dto';
import { LoginDto } from '@application/dto/login.dto';

/**
 * Lambda Handler: Register User
 * 
 * Handles POST /auth/register requests
 */
export async function registerUser(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    // Get NestJS app instance (cached for cold start optimization)
    const app = await getApp();
    const authService = app.get(AuthService);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const dto = new RegisterDto();
    Object.assign(dto, body);

    // Call application service
    const result = await authService.register(dto);

    // Return response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isEmailVerified: result.user.isEmailVerified,
          },
          accessToken: result.accessToken,
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: error.status || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error',
      }),
    };
  }
}

/**
 * Lambda Handler: Login User
 * 
 * Handles POST /auth/login requests
 */
export async function loginUser(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    // Get NestJS app instance
    const app = await getApp();
    const authService = app.get(AuthService);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const dto = new LoginDto();
    Object.assign(dto, body);

    // Call application service
    const result = await authService.login(dto);

    // Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isEmailVerified: result.user.isEmailVerified,
          },
          accessToken: result.accessToken,
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: error.status || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error',
      }),
    };
  }
}

