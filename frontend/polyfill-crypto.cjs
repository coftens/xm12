
// polyfill-crypto.cjs
const crypto = require('crypto');

// 1. Ensure globalThis.crypto exists
if (!globalThis.crypto) {
  // webcrypto was added in Node 15, but might be experimental or partial
  globalThis.crypto = crypto.webcrypto || {};
}

// 2. Polyfill getRandomValues if missing
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = function(buffer) {
    if (!buffer) return buffer;
    // crypto.randomFillSync works with TypedArrays in Node 16
    return crypto.randomFillSync(buffer);
  };
}

// 3. Polyfill randomUUID if missing
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = function() {
    return crypto.randomUUID();
  };
}
