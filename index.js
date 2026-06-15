'use strict';

// Root entry point referenced by package.json "main". Kept intentionally thin:
// it only re-exports the public API so the implementation can live under src/
// without consumers needing to know the internal file layout.
//
// Usage: const { validate } = require('lab-3-1-patterns');
const { validate } = require('./src/emailValidator');

module.exports = { validate };
