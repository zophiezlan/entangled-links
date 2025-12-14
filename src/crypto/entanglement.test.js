/**
 * Tests for cryptographic entanglement functions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateShortcode,
  generateMasterKey,
  splitKey,
  reconstructKey,
  encryptUrl,
  decryptUrl
} from './entanglement.js';

describe('Cryptographic Entanglement', () => {
  describe('generateShortcode', () => {
    it('should generate shortcode of default length', () => {
      const code = generateShortcode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate shortcode of custom length', () => {
      const code = generateShortcode(12);
      expect(code).toHaveLength(12);
    });

    it('should generate unique shortcodes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateShortcode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('Key Generation and Splitting', () => {
    let masterKey;

    beforeAll(async () => {
      masterKey = await generateMasterKey();
    });

    it('should generate a master key', async () => {
      const key = await generateMasterKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should split key into two halves', async () => {
      const { keyA, keyB } = await splitKey(masterKey);
      expect(keyA).toBeDefined();
      expect(keyB).toBeDefined();
      expect(typeof keyA).toBe('string');
      expect(typeof keyB).toBe('string');
      expect(keyA).not.toBe(keyB);
    });

    it('should reconstruct master key from split keys', async () => {
      const { keyA, keyB } = await splitKey(masterKey);
      const reconstructed = await reconstructKey(keyA, keyB);

      expect(reconstructed).toBeDefined();
      expect(reconstructed.type).toBe('secret');
      expect(reconstructed.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('URL Encryption and Decryption', () => {
    const testUrl = 'https://example.com/test?param=value';
    let masterKey;

    beforeAll(async () => {
      masterKey = await generateMasterKey();
    });

    it('should encrypt URL', async () => {
      const encrypted = await encryptUrl(testUrl, masterKey);
      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
    });

    it('should decrypt URL correctly', async () => {
      const encrypted = await encryptUrl(testUrl, masterKey);
      const decrypted = await decryptUrl(encrypted.ciphertext, encrypted.iv, masterKey);
      expect(decrypted).toBe(testUrl);
    });

    it('should fail to decrypt with wrong key', async () => {
      const encrypted = await encryptUrl(testUrl, masterKey);
      const wrongKey = await generateMasterKey();

      await expect(
        decryptUrl(encrypted.ciphertext, encrypted.iv, wrongKey)
      ).rejects.toThrow();
    });
  });

  describe('End-to-End Key Splitting', () => {
    const testUrl = 'https://example.com/secure-data';

    it('should encrypt with master key and decrypt with reconstructed key', async () => {
      // Generate master key
      const masterKey = await generateMasterKey();

      // Encrypt URL
      const encrypted = await encryptUrl(testUrl, masterKey);

      // Split key
      const { keyA, keyB } = await splitKey(masterKey);

      // Reconstruct key
      const reconstructed = await reconstructKey(keyA, keyB);

      // Decrypt with reconstructed key
      const decrypted = await decryptUrl(encrypted.ciphertext, encrypted.iv, reconstructed);

      expect(decrypted).toBe(testUrl);
    });

    it('should not decrypt with only one half of split key', async () => {
      const masterKey = await generateMasterKey();
      const encrypted = await encryptUrl(testUrl, masterKey);
      const { keyA, keyB } = await splitKey(masterKey);

      // Create a dummy key B (all zeros)
      const dummyKeyB = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

      const wrongKey = await reconstructKey(keyA, dummyKeyB);

      await expect(
        decryptUrl(encrypted.ciphertext, encrypted.iv, wrongKey)
      ).rejects.toThrow();
    });
  });
});
