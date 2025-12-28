/**
 * Transcoder Lambda Handler
 * 
 * This simulates an AWS Lambda function that would be triggered by S3 events.
 * In production, deploy this as a Lambda with FFmpeg layer.
 * 
 * Trigger: S3 PutObject event on uploads/* prefix
 * 
 * Environment Variables:
 * - VIDEO_SERVICE_URL: GraphQL endpoint to notify on completion
 * - S3_BUCKET: Output bucket for HLS files
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface S3Event {
    Records: Array<{
        s3: {
            bucket: { name: string };
            object: { key: string };
        };
    }>;
}

interface TranscodeResult {
    videoId: string;
    hlsKey: string;
    thumbnailKey: string;
}

// In real Lambda, this would use FFmpeg to transcode
async function mockTranscode(inputKey: string): Promise<{ hlsKey: string; thumbnailKey: string }> {
    // Extract video ID from key: uploads/{sellerId}/{videoId}/original.mp4
    const parts = inputKey.split('/');
    const videoId = parts[2];

    // In production: Use FFmpeg to create HLS segments
    // ffmpeg -i input.mp4 -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8

    const hlsKey = `processed/${videoId}/stream.m3u8`;
    const thumbnailKey = `processed/${videoId}/thumbnail.jpg`;

    console.log(`[Transcoder] Processed ${inputKey} -> ${hlsKey}`);

    return { hlsKey, thumbnailKey };
}

async function notifyVideoService(result: TranscodeResult): Promise<void> {
    const endpoint = process.env.VIDEO_SERVICE_URL || 'http://localhost:3006/graphql';

    const mutation = `
    mutation OnTranscodeComplete($videoId: String!, $hlsKey: String!, $thumbnailKey: String!) {
      onTranscodeComplete(videoId: $videoId, hlsKey: $hlsKey, thumbnailKey: $thumbnailKey) {
        id
        status
      }
    }
  `;

    await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: mutation,
            variables: result,
        }),
    });
}

// Lambda handler
export async function handler(event: S3Event): Promise<void> {
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`[Transcoder] Processing: s3://${bucket}/${key}`);

        // Extract videoId from key
        const parts = key.split('/');
        if (parts.length < 3) {
            console.error(`Invalid key format: ${key}`);
            continue;
        }
        const videoId = parts[2];

        // Transcode (mock in dev, real FFmpeg in Lambda)
        const { hlsKey, thumbnailKey } = await mockTranscode(key);

        // Notify Video Service
        await notifyVideoService({ videoId, hlsKey, thumbnailKey });

        console.log(`[Transcoder] Completed: ${videoId}`);
    }
}

// For local testing
if (require.main === module) {
    const testEvent: S3Event = {
        Records: [
            {
                s3: {
                    bucket: { name: 'flashmart-videos' },
                    object: { key: 'uploads/seller-123/video-456/original.mp4' },
                },
            },
        ],
    };
    handler(testEvent).catch(console.error);
}
