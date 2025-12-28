/**
 * Notification Lambda Handler
 * 
 * Triggered by SQS/SNS when events occur:
 * - payment.confirmed -> Send order confirmation email
 * - video.ready -> Notify seller video is processed
 * - order.shipped -> Send shipping notification
 * 
 * Environment Variables:
 * - SES_FROM_EMAIL: Sender email address
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN: For SMS (optional)
 */

interface NotificationEvent {
    type: 'EMAIL' | 'SMS' | 'PUSH';
    template: string;
    recipient: string;
    data: Record<string, any>;
}

interface SQSEvent {
    Records: Array<{
        body: string;
        messageId: string;
    }>;
}

// Email templates
const templates: Record<string, (data: any) => { subject: string; body: string }> = {
    'order.confirmed': (data) => ({
        subject: `Order Confirmed - #${data.orderId}`,
        body: `
      Hi ${data.userName},
      
      Your order has been confirmed!
      
      Order ID: ${data.orderId}
      Total: $${data.amount}
      
      You'll receive another notification when it ships.
      
      Thanks for shopping with FlashMart!
    `.trim(),
    }),

    'payment.confirmed': (data) => ({
        subject: `Payment Received - $${data.amount}`,
        body: `
      Hi ${data.userName},
      
      We've received your payment of $${data.amount}.
      
      Transaction ID: ${data.paymentId}
      
      Thanks!
    `.trim(),
    }),

    'video.ready': (data) => ({
        subject: `Your video is ready!`,
        body: `
      Hi ${data.sellerName},
      
      Your video "${data.title}" has been processed and is now live!
      
      View it here: ${data.streamUrl}
      
      AI Tags: ${data.aiTags?.join(', ') || 'None'}
    `.trim(),
    }),
};

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
    // In production: Use AWS SES
    // const ses = new SESClient({ region: 'us-east-1' });
    // await ses.send(new SendEmailCommand({ ... }));

    console.log(`[Email] To: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Body: ${body}`);
}

async function sendSMS(to: string, message: string): Promise<void> {
    // In production: Use Twilio or AWS SNS
    console.log(`[SMS] To: ${to}`);
    console.log(`[SMS] Message: ${message}`);
}

async function sendPush(userId: string, title: string, body: string): Promise<void> {
    // In production: Use Firebase Cloud Messaging or AWS SNS
    console.log(`[Push] To: ${userId}`);
    console.log(`[Push] Title: ${title}`);
    console.log(`[Push] Body: ${body}`);
}

export async function handler(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
        try {
            const notification: NotificationEvent = JSON.parse(record.body);

            console.log(`[Notification] Processing: ${notification.template} -> ${notification.recipient}`);

            const template = templates[notification.template];
            if (!template) {
                console.error(`Unknown template: ${notification.template}`);
                continue;
            }

            const { subject, body } = template(notification.data);

            switch (notification.type) {
                case 'EMAIL':
                    await sendEmail(notification.recipient, subject, body);
                    break;
                case 'SMS':
                    await sendSMS(notification.recipient, body.slice(0, 160));
                    break;
                case 'PUSH':
                    await sendPush(notification.recipient, subject, body);
                    break;
            }

            console.log(`[Notification] Sent: ${record.messageId}`);
        } catch (error) {
            console.error(`[Notification] Failed: ${record.messageId}`, error);
        }
    }
}

// Local testing
if (require.main === module) {
    const testEvent: SQSEvent = {
        Records: [
            {
                messageId: 'test-1',
                body: JSON.stringify({
                    type: 'EMAIL',
                    template: 'order.confirmed',
                    recipient: 'user@example.com',
                    data: {
                        orderId: 'ORD-123',
                        userName: 'John',
                        amount: 99.99,
                    },
                }),
            },
        ],
    };
    handler(testEvent).catch(console.error);
}
