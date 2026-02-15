
// polyfill-crypto.cjs
const crypto = require('crypto');

// 1. Ensure globalThis.crypto exists
if (!globalThis.crypto) {
  // webcrypto was added in Node 15, but might be experimental or partial
  globalThis.crypto = crypto.webcrypto || {};
}

// 2. Polyfill getRandomValues if missing
if (!global.crypto.getRandomValues) {
  // Use a proper implementation that matches the signature
  global.crypto.getRandomValues = (buffer) => {
    return  crypto.randomFillSync(buffer);
  }
}
// Force overwrite just in case if it exists but is broken or null
else {
  try {
      global.crypto.getRandomValues(new Uint8Array(1));
  } catch (e) {
      // It exists but failed (likely "not a function" on webcrypto object)
      global.crypto.getRandomValues = (buffer) => {
        return  crypto.randomFillSync(buffer);
      }
  }
}

// 3. Polyfill randomUUID if missing
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = function() {
    return crypto.randomUUID();
  };
}
