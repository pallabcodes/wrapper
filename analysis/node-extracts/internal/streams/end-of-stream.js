/**
 * Node.js end-of-stream Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's end-of-stream utility.
 * It detects when a stream (or any async resource) has finished or errored, and invokes a callback.
 *
 * You can repurpose this pattern for any async resource or pipeline that needs to know when all work is done.
 */

// Listen for end/error/close on a stream and call cb once
function endOfStream(stream, cb) {
  let called = false;
  function once(err) {
    if (called) return;
    called = true;
    cb(err);
  }

  stream.on('end', () => once());
  stream.on('finish', () => once());
  stream.on('close', () => once());
  stream.on('error', err => once(err));
}

// Repurposing: Use endOfStream to know when any async resource is done
// Example: Wait for a file write or network socket to finish
/*
endOfStream(myStream, (err) => {
  if (err) console.error('Stream failed:', err);
  else console.log('Stream finished successfully');
});
*/

module.exports = { endOfStream };

/*
Key takeaways for repurposing:
- endOfStream lets you reliably detect when a resource is finished or errored.
- Works for any evented async resource, not just streams.
- This pattern is the backbone for robust pipeline and resource management.
*/