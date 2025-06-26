/**
 * Unit Test Example (using Jest)
 * Requires: npm install jest @types/jest ts-jest
 */
import { Transform } from 'stream';

function doubleStream() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      this.push(chunk * 2);
      cb();
    }
  });
}

test('doubleStream doubles numbers', done => {
  const stream = doubleStream();
  const results: number[] = [];
  stream.on('data', d => results.push(d));
  stream.on('end', () => {
    expect(results).toEqual([2, 4, 6]);
    done();
  });
  stream.write(1);
  stream.write(2);
  stream.write(3);
  stream.end();
});