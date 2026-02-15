
// polyfill-crypto.cjs
const crypto = require('crypto');

if (!global.crypto) {
  global.crypto = crypto.webcrypto;
}
if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}
if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = crypto.randomUUID.bind(crypto);
}
