/**
 * JWT Authentication Example
 * Requires: npm install jsonwebtoken
 */
import jwt from 'jsonwebtoken';
import { Readable, Transform } from 'stream';

const SECRET = 'supersecret';

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      const token = jwt.sign({ user: 'user' + i }, SECRET);
      setTimeout(() => this.push({ ts: Date.now(), value: i++, token }), 100);
    }
  });
}

function jwtAuth() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      try {
        jwt.verify(chunk.token, SECRET);
        this.push(chunk);
      } catch {
        // Drop unauthorized
      }
      cb();
    }
  });
}

(async () => {
  const src = eventStream().pipe(jwtAuth());
  for await (const event of src) {
    console.log('[jwt-auth] Event:', event.value);
  }
})();