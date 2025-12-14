/**
 * Tests for entanglement state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EntanglementState,
  createEntangledPair,
  getKeyForLink,
  canDecrypt
} from './state.js';

describe('Entanglement State Management', () => {
  describe('EntanglementState enum', () => {
    it('should have all required states', () => {
      expect(EntanglementState.SUPERPOSITION).toBe('SUPERPOSITION');
      expect(EntanglementState.COLLAPSED_A).toBe('COLLAPSED_A');
      expect(EntanglementState.COLLAPSED_B).toBe('COLLAPSED_B');
      expect(EntanglementState.OBSERVED).toBe('OBSERVED');
    });
  });

  describe('createEntangledPair', () => {
    it('should create valid pair data', () => {
      const shortcodeA = 'abc123';
      const shortcodeB = 'xyz789';
      const encryptedData = {
        ciphertext: 'encrypted',
        iv: 'iv123'
      };
      const keyA = 'keyA';
      const keyB = 'keyB';

      const pair = createEntangledPair(shortcodeA, shortcodeB, encryptedData, keyA, keyB);

      expect(pair.pairId).toBeDefined();
      expect(pair.linkA).toBe(shortcodeA);
      expect(pair.linkB).toBe(shortcodeB);
      expect(pair.state).toBe(EntanglementState.SUPERPOSITION);
      expect(pair.encryptedUrl).toBe('encrypted');
      expect(pair.iv).toBe('iv123');
      expect(pair.keyA).toBe(keyA);
      expect(pair.keyB).toBe(keyB);
      expect(pair.accessLog).toEqual([]);
      expect(pair.createdAt).toBeDefined();
      expect(pair.expiresAt).toBeDefined();
      expect(pair.expiresAt).toBeGreaterThan(pair.createdAt);
    });

    it('should set expiration to 7 days', () => {
      const pair = createEntangledPair('a', 'b', { ciphertext: 'c', iv: 'i' }, 'k1', 'k2');
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const expectedExpiry = pair.createdAt + sevenDays;

      expect(pair.expiresAt).toBe(expectedExpiry);
    });
  });

  describe('getKeyForLink', () => {
    it('should return keyA for linkA', () => {
      const pairData = {
        linkA: 'shortcodeA',
        linkB: 'shortcodeB',
        keyA: 'keyA123',
        keyB: 'keyB456'
      };

      const key = getKeyForLink(pairData, 'shortcodeA');
      expect(key).toBe('keyA123');
    });

    it('should return keyB for linkB', () => {
      const pairData = {
        linkA: 'shortcodeA',
        linkB: 'shortcodeB',
        keyA: 'keyA123',
        keyB: 'keyB456'
      };

      const key = getKeyForLink(pairData, 'shortcodeB');
      expect(key).toBe('keyB456');
    });
  });

  describe('canDecrypt', () => {
    it('should return false for SUPERPOSITION state', () => {
      const pairData = { state: EntanglementState.SUPERPOSITION };
      expect(canDecrypt(pairData)).toBe(false);
    });

    it('should return false for COLLAPSED_A state', () => {
      const pairData = { state: EntanglementState.COLLAPSED_A };
      expect(canDecrypt(pairData)).toBe(false);
    });

    it('should return false for COLLAPSED_B state', () => {
      const pairData = { state: EntanglementState.COLLAPSED_B };
      expect(canDecrypt(pairData)).toBe(false);
    });

    it('should return true for OBSERVED state', () => {
      const pairData = { state: EntanglementState.OBSERVED };
      expect(canDecrypt(pairData)).toBe(true);
    });
  });
});
