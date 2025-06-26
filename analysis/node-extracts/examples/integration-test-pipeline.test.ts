/**
 * Integration Test Example (using Jest)
 * Requires: npm install jest @types/jest ts-jest
 */
import { Readable, Transform } from 'stream';

function addOneStream() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      this.push(chunk + 1);
      cb();
    }
  });
}

test('addOneStream integrates with Readable', done => {
  const src = new Readable({
    objectMode: true,
    read() {
      this.push(1);
      this.push(2);
      this.push(3);
      this.push(null);
    }
  });
  const results: number[] = [];
  src.pipe(addOneStream()).on('data', d => results.push(d)).on('end', () => {
    expect(results).toEqual([2, 3, 4]);
    done();
  });
});