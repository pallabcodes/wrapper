// Node.js Argument Parsing Patterns - Repurposable Extraction
// These patterns are universal and can be adapted to other languages (Go, Python, Rust, etc.)

// Basic argument parsing
function getArgs() {
  return process.argv.slice(2);
}

// Parse arguments into key-value pairs (e.g., --foo=bar)
function parseArgs() {
  const args = getArgs();
  const result = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value === undefined ? true : value;
    }
  });
  return result;
}

// Example: node script.js --foo=bar --baz
// parseArgs() => { foo: 'bar', baz: true }

module.exports = {
  getArgs,
  parseArgs
};

// --- GOD-MODE / HACKY / PATCHY PATTERNS ---

// Monkey-patch process.argv to inject or modify arguments at runtime
function patchArgv(newArgs) {
  const orig = process.argv.slice();
  process.argv = process.argv.slice(0, 2).concat(newArgs);
  return () => { process.argv = orig; } // restore
}

// Inject arguments for child processes (dangerous, for testing or hotfixes)
function injectArgsForChild(childProcess, newArgs) {
  if (childProcess.spawnargs) {
    childProcess.spawnargs = childProcess.spawnargs.slice(0, 2).concat(newArgs);
  }
}

// Access internal process properties (undocumented, for introspection)
function getArgv0() {
  return process.argv0 || process.argv[0];
}

// Example usage:
// const unpatch = patchArgv(['--foo=bar', '--baz']);
// console.log(parseArgs());
// unpatch();

module.exports.patchArgv = patchArgv;
module.exports.injectArgsForChild = injectArgsForChild;
module.exports.getArgv0 = getArgv0;
