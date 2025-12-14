/**
 * Vitest setup file
 * Polyfills global crypto object for Node.js test environment
 */

import { webcrypto } from 'node:crypto';

// Polyfill crypto global object for Node.js
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Polyfill randomUUID if not available (Node.js < 19)
if (typeof global.crypto.randomUUID !== 'function') {
  global.crypto.randomUUID = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}
