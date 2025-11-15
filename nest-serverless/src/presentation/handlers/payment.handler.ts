/**
 * Lambda Handler: Payment Handlers
 * 
 * AWS Lambda handlers for payment endpoints
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getApp } from '@infrastructure/lambda/lambda.handler.factory';
import { PaymentService } from '@application/services/payment.service';
import { CreatePaymentDto } from '@application/dto/create-payment.dto';

/**
 * Lambda Handler: Process Payment
 * 
 * Handles POST /payments requests
 */
export async function processPayment(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    // Get NestJS app instance
    const app = await getApp();
    const paymentService = app.get(PaymentService);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const dto = new CreatePaymentDto();
    Object.assign(dto, body);

    // Call application service
    const payment = await paymentService.createPayment(dto);

    // Return response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment: {
            id: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            createdAt: payment.createdAt,
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

