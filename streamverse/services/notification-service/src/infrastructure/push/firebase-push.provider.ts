import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  IPushProvider,
  PushContent,
  NotificationResult,
  PUSH_PROVIDER
} from '../../domain/ports/notification-providers.port';

/**
 * Infrastructure: Firebase Push Provider
 *
 * Implements IPushProvider using Firebase Cloud Messaging for push notifications
 */
@Injectable()
export class FirebasePushProvider implements IPushProvider {
  constructor(private configService: ConfigService) {
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length) {
      const serviceAccountConfig = this.configService.get<string | admin.ServiceAccount>('FIREBASE_SERVICE_ACCOUNT');

      if (serviceAccountConfig) {
        let serviceAccount: admin.ServiceAccount;

        if (typeof serviceAccountConfig === 'string' && serviceAccountConfig.trim().startsWith('{')) {
          try {
            serviceAccount = JSON.parse(serviceAccountConfig);
          } catch (error) {
            console.error('Failed to parse Firebase service account JSON:', error);
            return;
          }
        } else {
          serviceAccount = serviceAccountConfig as admin.ServiceAccount;
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // For development, you might use default credentials or environment variables
        console.warn('Firebase service account not configured, push notifications will fail');
      }
    }
  }

  async sendPush(content: PushContent): Promise<NotificationResult> {
    try {
      if (!admin.apps.length) {
        throw new Error('Firebase not initialized');
      }

      const message = {
        token: content.to,
        notification: {
          title: content.title,
          body: content.body,
        },
        data: content.data || {},
        // Additional FCM options can be added here
        // android: { ... },
        // apns: { ... },
        // webpush: { ... },
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        providerId: response
      };
    } catch (error: unknown) {
      console.error('Firebase push notification failed:', error);

      // Handle specific Firebase errors
      let errorMessage = 'Unknown Firebase error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if ('code' in error) {
          const firebaseError = error as { code?: string; message: string };
          if (firebaseError.code === 'messaging/invalid-registration-token') {
            errorMessage = 'Invalid device token';
          } else if (firebaseError.code === 'messaging/registration-token-not-registered') {
            errorMessage = 'Device token not registered';
          }
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
