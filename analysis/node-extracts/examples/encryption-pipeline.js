/**
 * Advanced Pattern: Stream Encryption/Decryption
 * 
 * This example demonstrates:
 *  - Encrypting and decrypting data using crypto streams
 */

const { Readable } = require('stream');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const data = ['secret', 'data', 'in', 'stream'];
const source = Readable.from(data, { objectMode: true });

const encrypt = crypto.createCipheriv(algorithm, key, iv);
const decrypt = crypto.createDecipheriv(algorithm, key, iv);

const encryptedChunks = [];
source
  .pipe(encrypt)
  .on('data', chunk => encryptedChunks.push(chunk))
  .on('end', () => {
    const encrypted = Buffer.concat(encryptedChunks);
    const decryptStream = Readable.from([encrypted]).pipe(decrypt);
    decryptStream.on('data', chunk => {
      console.log('[decrypted]', chunk.toString());
    });
    decryptStream.on('end', () => {
      console.log('Encryption pipeline complete!');
    });
  });