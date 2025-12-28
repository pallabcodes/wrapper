import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';

export interface DetectedLabel {
    name: string;
    confidence: number;
}

@Injectable()
export class RekognitionService {
    private client: RekognitionClient;
    private bucket: string;

    constructor(private readonly config: ConfigService) {
        this.bucket = config.get('S3_BUCKET', 'flashmart-videos');

        this.client = new RekognitionClient({
            region: config.get('AWS_REGION', 'us-east-1'),
            credentials: {
                accessKeyId: config.get('AWS_ACCESS_KEY_ID', 'minioadmin'),
                secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', 'minioadmin'),
            },
        });
    }

    async detectLabels(imageKey: string): Promise<DetectedLabel[]> {
        try {
            const command = new DetectLabelsCommand({
                Image: {
                    S3Object: {
                        Bucket: this.bucket,
                        Name: imageKey,
                    },
                },
                MaxLabels: 20,
                MinConfidence: 70,
            });

            const response = await this.client.send(command);

            return (response.Labels || []).map(label => ({
                name: label.Name || 'Unknown',
                confidence: label.Confidence || 0,
            }));
        } catch (error) {
            // In development (MinIO), Rekognition won't work - return mock data
            console.warn('Rekognition unavailable, using mock labels:', error.message);
            return [
                { name: 'Product', confidence: 95 },
                { name: 'Electronics', confidence: 88 },
                { name: 'Device', confidence: 82 },
            ];
        }
    }

    async detectLabelsFromBytes(imageBytes: Buffer): Promise<DetectedLabel[]> {
        try {
            const command = new DetectLabelsCommand({
                Image: {
                    Bytes: imageBytes,
                },
                MaxLabels: 20,
                MinConfidence: 70,
            });

            const response = await this.client.send(command);

            return (response.Labels || []).map(label => ({
                name: label.Name || 'Unknown',
                confidence: label.Confidence || 0,
            }));
        } catch (error) {
            console.warn('Rekognition unavailable:', error.message);
            return [];
        }
    }
}
