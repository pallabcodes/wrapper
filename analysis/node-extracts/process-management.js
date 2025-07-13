// Node.js Process Management Patterns - Repurposable Extraction
// These patterns are universal and can be adapted to other languages (Go, Python, Rust, etc.)

const { spawn, exec, fork } = require('child_process');

// Spawn a child process (non-blocking, stream-based)
function spawnProcess(command, args = [], options = {}) {
  const child = spawn(command, args, options);
  child.stdout.on('data', data => {
    console.log(`[stdout] ${data}`);
  });
  child.stderr.on('data', data => {
    console.error(`[stderr] ${data}`);
  });
  child.on('close', code => {
    console.log(`child process exited with code ${code}`);
  });
  return child;
}

// Exec a command (buffered output, callback-based)
function execCommand(command, options = {}, callback) {
  exec(command, options, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      if (callback) callback(error, null, null);
      return;
    }
    if (callback) callback(null, stdout, stderr);
  });
}

// Fork a Node.js module as a child process (IPC enabled)
function forkModule(modulePath, args = [], options = {}) {
  const child = fork(modulePath, args, options);
  child.on('message', msg => {
    console.log('Message from child:', msg);
  });
  return child;
}

// Signal handling (cross-platform)
process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting...');
  process.exit(0);
});

// Accessing process arguments
function getArgs() {
  return process.argv.slice(2);
}

module.exports = {
  spawnProcess,
  execCommand,
  forkModule,
  getArgs
};

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch child_process.spawn to intercept all child process creation
function patchSpawn(interceptor) {
  const origSpawn = spawn;
  require('child_process').spawn = function(command, args, options) {
    interceptor(command, args, options);
    return origSpawn.apply(this, arguments);
  };
  return () => { require('child_process').spawn = origSpawn; } // restore
}

// Hijack file descriptors (dangerous, for advanced debugging)
function hijackStdout(fd = 1, newStream) {
  const fs = require('fs');
  const orig = process.stdout;
  process.stdout = newStream || fs.createWriteStream(null, { fd });
  return () => { process.stdout = orig; } // restore
}

// Access internal process methods (undocumented, for introspection)
function getActiveResources() {
  return process._getActiveResources ? process._getActiveResources() : [];
}

// Forcefully kill all child processes (dangerous, for god-mode debugging)
function killAllChildren() {
  const children = getActiveResources().filter(r => r.constructor && r.constructor.name === 'ChildProcess');
  for (const c of children) {
    try { c.kill(); } catch (e) { /* ignore */ }
  }
}

// Example usage:
// const unpatch = patchSpawn((cmd, args, opts) => { console.log('[SPAWN]', cmd, args); });
// spawnProcess('ls');
// unpatch();

module.exports.patchSpawn = patchSpawn;
module.exports.hijackStdout = hijackStdout;
module.exports.getActiveResources = getActiveResources;
module.exports.killAllChildren = killAllChildren;

// Monkey-patch child_process.exec and fork to intercept all exec/fork calls
function patchExecFork(execInterceptor, forkInterceptor) {
  const origExec = exec;
  const origFork = fork;
  require('child_process').exec = function(command, options, callback) {
    execInterceptor(command, options, callback);
    return origExec.apply(this, arguments);
  };
  require('child_process').fork = function(modulePath, args, options) {
    forkInterceptor(modulePath, args, options);
    return origFork.apply(this, arguments);
  };
  return () => {
    require('child_process').exec = origExec;
    require('child_process').fork = origFork;
  };
}

// Reassign process.env at runtime (dangerous, for hotpatching env)
function patchProcessEnv(newEnv) {
  const orig = { ...process.env };
  process.env = { ...process.env, ...newEnv };
  return () => { process.env = orig; };
}

// Runtime mutation of process properties (dangerous, for deep debugging)
function mutateProcessProperty(prop, value) {
  const orig = process[prop];
  process[prop] = value;
  return () => { process[prop] = orig; };
}

// Example usage:
// const unpatch = patchExecFork((cmd, opts, cb) => { console.log('[EXEC]', cmd); }, (mod, args, opts) => { console.log('[FORK]', mod); });
// execCommand('ls');
// unpatch();

module.exports.patchExecFork = patchExecFork;
module.exports.patchProcessEnv = patchProcessEnv;
module.exports.mutateProcessProperty = mutateProcessProperty;
