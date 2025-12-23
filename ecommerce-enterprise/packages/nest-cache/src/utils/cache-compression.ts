import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class CacheCompression {
  static async compress(data: any): Promise<Buffer> {
    const jsonString = JSON.stringify(data);
    return gzipAsync(Buffer.from(jsonString));
  }

  static async decompress(compressed: Buffer): Promise<any> {
    const decompressed = await gunzipAsync(compressed);
    return JSON.parse(decompressed.toString());
  }

  static shouldCompress(data: any, threshold: number = 1024): boolean {
    const jsonString = JSON.stringify(data);
    return jsonString.length > threshold;
  }

  static getCompressionRatio(original: number, compressed: number): number {
    return ((original - compressed) / original) * 100;
  }
}

