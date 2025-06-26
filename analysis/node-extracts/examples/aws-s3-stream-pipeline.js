/**
 * Real-World Cloud Integration: AWS S3 Streaming
 * 
 * This example demonstrates:
 *  - Uploading a stream to S3
 *  - Downloading a stream from S3
 * 
 * Prerequisites:
 *   npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 *   (Configure AWS credentials in your environment)
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable } = require('stream');

const BUCKET = 'your-bucket-name';
const KEY = 'stream-demo.txt';

const s3 = new S3Client({ region: 'us-east-1' });

// Example: Upload a stream to S3
async function uploadToS3() {
  const data = ['hello', 'from', 'stream', 'to', 's3'].join('\n');
  const stream = Readable.from([data]);
  const upload = new Upload({
    client: s3,
    params: { Bucket: BUCKET, Key: KEY, Body: stream }
  });
  await upload.done();
  console.log('Uploaded to S3!');
}

// Example: Download a stream from S3
async function downloadFromS3() {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: KEY });
  const response = await s3.send(command);
  for await (const chunk of response.Body) {
    process.stdout.write(chunk);
  }
  console.log('\nDownloaded from S3!');
}

(async () => {
  await uploadToS3();
  await downloadFromS3();
})();