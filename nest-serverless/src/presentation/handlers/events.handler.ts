/**
 * Lambda Handler: Event Handlers
 * 
 * AWS Lambda handlers for SQS event processing
 * Processes domain events asynchronously
 */
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { getApp } from '@infrastructure/lambda/lambda.handler.factory';

/**
 * Lambda Handler: User Registered Event
 * 
 * Processes user.registered events from SQS
 * This is triggered when a user registers (event-driven)
 */
export async function userRegisteredEvent(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    // Get NestJS app instance
    const app = await getApp();

    // Process each SQS record
    for (const record of event.Records) {
      await processUserRegisteredRecord(record);
    }
  } catch (error) {
    console.error('Error processing user registered event:', error);
    // In production, send to DLQ (Dead Letter Queue)
    throw error;
  }
}

/**
 * Process a single SQS record
 */
async function processUserRegisteredRecord(record: SQSRecord): Promise<void> {
  try {
    // Parse message body
    const messageBody = JSON.parse(record.body);
    const eventData = JSON.parse(messageBody.Message || messageBody);

    console.log('Processing user registered event:', eventData);

    // In production, you would:
    // 1. Send welcome email
    // 2. Create user profile
    // 3. Send analytics event
    // 4. Update user count
    // etc.

    // For demo, just log
    console.log(`User ${eventData.userId} (${eventData.email}) registered at ${eventData.timestamp}`);
  } catch (error) {
    console.error('Error processing record:', error);
    throw error; // Will trigger DLQ in production
  }
}

