import { createCipher, createDecipher, randomBytes } from 'crypto';

export class CacheEncryption {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(encryptionKey?: string) {
    this.key = Buffer.from(encryptionKey || 'default-key-32-chars-long!', 'utf8');
  }

  async encrypt(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const iv = randomBytes(16);
    const cipher = createCipher(this.algorithm, this.key);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  async decrypt(encryptedData: string): Promise<any> {
    const [ivHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    // IV not used in createDecipher but kept for completeness
    Buffer.from(ivHex, 'hex');
    const decipher = createDecipher(this.algorithm, this.key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  static generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  static isValidKey(key: string): boolean {
    return key.length >= 32;
  }
}

