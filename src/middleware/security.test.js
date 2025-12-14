/**
 * Tests for security middleware
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeUrl,
  validateShortcode
} from './security.js';

describe('Security Middleware', () => {
  describe('sanitizeUrl', () => {
    it('should accept valid https URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should accept valid http URLs', () => {
      const url = 'http://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should reject javascript: protocol', () => {
      expect(() => sanitizeUrl('javascript:alert(1)')).toThrow();
    });

    it('should reject data: protocol', () => {
      expect(() => sanitizeUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    });

    it('should reject localhost URLs', () => {
      expect(() => sanitizeUrl('http://localhost/path')).toThrow('Private/local URLs not allowed');
    });

    it('should reject 127.0.0.1 URLs', () => {
      expect(() => sanitizeUrl('http://127.0.0.1/path')).toThrow('Private/local URLs not allowed');
    });

    it('should reject 10.x.x.x private IPs', () => {
      expect(() => sanitizeUrl('http://10.0.0.1/path')).toThrow('Private/local URLs not allowed');
    });

    it('should reject 192.168.x.x private IPs', () => {
      expect(() => sanitizeUrl('http://192.168.1.1/path')).toThrow('Private/local URLs not allowed');
    });

    it('should reject 172.16-31.x.x private IPs', () => {
      expect(() => sanitizeUrl('http://172.16.0.1/path')).toThrow('Private/local URLs not allowed');
    });

    it('should reject invalid URLs', () => {
      expect(() => sanitizeUrl('not a url')).toThrow('Invalid URL');
    });

    it('should normalize URLs', () => {
      const url = 'https://example.com:443/path/../other';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('https://example.com/other');
    });
  });

  describe('validateShortcode', () => {
    it('should accept valid alphanumeric shortcodes', () => {
      expect(validateShortcode('abc123')).toBe('abc123');
      expect(validateShortcode('XYZ789')).toBe('XYZ789');
      expect(validateShortcode('aBc123XyZ')).toBe('aBc123XyZ');
    });

    it('should reject shortcodes with special characters', () => {
      expect(() => validateShortcode('abc-123')).toThrow('Invalid shortcode format');
      expect(() => validateShortcode('abc_123')).toThrow('Invalid shortcode format');
      expect(() => validateShortcode('abc.123')).toThrow('Invalid shortcode format');
    });

    it('should reject shortcodes that are too short', () => {
      expect(() => validateShortcode('abc')).toThrow('Invalid shortcode format');
      expect(() => validateShortcode('12345')).toThrow('Invalid shortcode format');
    });

    it('should reject shortcodes that are too long', () => {
      expect(() => validateShortcode('a'.repeat(13))).toThrow('Invalid shortcode format');
    });

    it('should accept shortcodes at min length (6)', () => {
      expect(validateShortcode('abc123')).toBe('abc123');
    });

    it('should accept shortcodes at max length (12)', () => {
      expect(validateShortcode('a'.repeat(12))).toBe('a'.repeat(12));
    });
  });
});
