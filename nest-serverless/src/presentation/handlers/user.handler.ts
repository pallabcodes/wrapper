/**
 * Lambda Handler: User Handlers
 * 
 * AWS Lambda handlers for user endpoints
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getApp } from '@infrastructure/lambda/lambda.handler.factory';
import { UserService } from '@application/services/user.service';

/**
 * Lambda Handler: Get User
 * 
 * Handles GET /users/{id} requests
 */
export async function getUser(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    // Get NestJS app instance
    const app = await getApp();
    const userService = app.get(UserService);

    // Extract user ID from path parameters
    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'User ID is required',
        }),
      };
    }

    // Call application service
    const user = await userService.getUserById(userId);

    // Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
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

