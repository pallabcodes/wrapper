/**
 * Advanced Pattern: Stream Compression/Decompression
 * 
 * This example demonstrates:
 *  - Compressing and decompressing data using zlib streams
 */

const { Readable } = require('stream');
const zlib = require('zlib');

const data = ['hello', 'world', 'this', 'is', 'compressed', 'stream', 'data'];
const source = Readable.from(data, { objectMode: true });

const gzip = zlib.createGzip();
const gunzip = zlib.createGunzip();

const compressedChunks = [];
source
  .pipe(zlib.createGzip())
  .on('data', chunk => compressedChunks.push(chunk))
  .on('end', () => {
    const compressed = Buffer.concat(compressedChunks);
    const decompressStream = Readable.from([compressed]).pipe(gunzip);
    decompressStream.on('data', chunk => {
      console.log('[decompressed]', chunk.toString());
    });
    decompressStream.on('end', () => {
      console.log('Compression pipeline complete!');
    });
  });