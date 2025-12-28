import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
    private s3: S3Client;
    private bucket: string;
    private endpoint: string;

    constructor(private readonly config: ConfigService) {
        this.bucket = config.get('S3_BUCKET', 'flashmart-videos');
        this.endpoint = config.get('S3_ENDPOINT', 'http://localhost:9000');

        this.s3 = new S3Client({
            endpoint: this.endpoint,
            region: config.get('AWS_REGION', 'us-east-1'),
            credentials: {
                accessKeyId: config.get('AWS_ACCESS_KEY_ID', 'minioadmin'),
                secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', 'minioadmin'),
            },
            forcePathStyle: true, // Required for MinIO
        });
    }

    async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        return getSignedUrl(this.s3, command, { expiresIn });
    }

    async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.s3, command, { expiresIn });
    }

    getPublicUrl(key: string): string {
        return `${this.endpoint}/${this.bucket}/${key}`;
    }
}
