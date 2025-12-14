/**
 * Cryptographic primitives for link entanglement
 */

/**
 * Generate a random shortcode
 */
export function generateShortcode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(random)
    .map(byte => chars[byte % chars.length])
    .join('');
}

/**
 * Generate master encryption key
 */
export async function generateMasterKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Split master key into two halves (XOR-based)
 * Key A XOR Key B = Master Key
 */
export async function splitKey(masterKey) {
  const exported = await crypto.subtle.exportKey('raw', masterKey);
  const masterBytes = new Uint8Array(exported);
  
  // Generate random Key A
  const keyA = crypto.getRandomValues(new Uint8Array(masterBytes.length));
  
  // Key B is XOR of master and Key A
  const keyB = new Uint8Array(masterBytes.length);
  for (let i = 0; i < masterBytes.length; i++) {
    keyB[i] = masterBytes[i] ^ keyA[i];
  }
  
  return {
    keyA: arrayBufferToBase64(keyA),
    keyB: arrayBufferToBase64(keyB)
  };
}

/**
 * Reconstruct master key from split keys
 */
export async function reconstructKey(keyABase64, keyBBase64) {
  const keyA = base64ToArrayBuffer(keyABase64);
  const keyB = base64ToArrayBuffer(keyBBase64);
  
  // XOR to get master key
  const masterBytes = new Uint8Array(keyA.length);
  for (let i = 0; i < keyA.length; i++) {
    masterBytes[i] = keyA[i] ^ keyB[i];
  }
  
  return await crypto.subtle.importKey(
    'raw',
    masterBytes,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt URL with master key
 */
export async function encryptUrl(url, masterKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    masterKey,
    data
  );
  
  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypt URL with master key
 */
export async function decryptUrl(ciphertext, iv, masterKey) {
  const encrypted = base64ToArrayBuffer(ciphertext);
  const ivArray = base64ToArrayBuffer(iv);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivArray
    },
    masterKey,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Utility: ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
