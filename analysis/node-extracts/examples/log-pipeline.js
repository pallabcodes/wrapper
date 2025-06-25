const { from } = require('../internal/streams/from');
const { map, filter } = require('../internal/streams/operators');

async function* logLineGen() {
  const levels = ['info', 'warn', 'error'];
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 30));
    const level = levels[Math.floor(Math.random() * levels.length)];
    yield JSON.stringify({ level, msg: `message ${i}` });
  }
}

const logStream = from(logLineGen());

const errorLogs = logStream
  .pipe(map(line => JSON.parse(line)))
  .pipe(filter(entry => entry.level === 'error'))
  .pipe(map(entry => `[ERROR] ${entry.msg}`));

(async () => {
  console.log('Error log pipeline started');
  for await (const line of errorLogs) {
    console.log(line);
  }
  console.log('Error log pipeline complete!');
})();