
// polyfill-crypto.js
import crypto from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}
if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}
if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = crypto.randomUUID.bind(crypto);
}
