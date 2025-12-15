import { describe, it, expect } from 'vitest';
import {
  validateBIP39Mnemonic,
  formatStatus,
  formatTime,
  getTimeSinceUpdate,
  truncate,
} from '../src/utils/validators';

describe('Validators', () => {
  describe('validateBIP39Mnemonic', () => {
    it('should validate valid BIP39 mnemonic', () => {
      const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(validateBIP39Mnemonic(validMnemonic)).toBe(true);
    });

    it('should reject invalid BIP39 mnemonic', () => {
      expect(validateBIP39Mnemonic('invalid mnemonic')).toBe(false);
    });

    it('should handle whitespace', () => {
      const validMnemonic = '  abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about  ';
      expect(validateBIP39Mnemonic(validMnemonic)).toBe(true);
    });
  });

  describe('formatStatus', () => {
    it('should format running status with green color', () => {
      expect(formatStatus('running')).toContain('running');
    });

    it('should format stopped status with red color', () => {
      expect(formatStatus('stopped')).toContain('stopped');
    });

    it('should format error status with red color', () => {
      expect(formatStatus('error')).toContain('error');
    });

    it('should return original status if not recognized', () => {
      expect(formatStatus('unknown')).toBe('unknown');
    });
  });

  describe('formatTime', () => {
    it('should format ISO date string correctly', () => {
      const isoDate = '2025-12-15T10:30:45Z';
      const formatted = formatTime(isoDate);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('12');
      expect(formatted).toContain('15');
    });

    it('should handle invalid date gracefully', () => {
      const result = formatTime('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('getTimeSinceUpdate', () => {
    it('should show "now" for less than 2 seconds', () => {
      expect(getTimeSinceUpdate(1)).toBe('now');
    });

    it('should show seconds for less than 60 seconds', () => {
      expect(getTimeSinceUpdate(30)).toBe('30s ago');
    });

    it('should show minutes for less than 3600 seconds', () => {
      expect(getTimeSinceUpdate(300)).toBe('5m ago');
    });

    it('should show hours for more than 3600 seconds', () => {
      expect(getTimeSinceUpdate(7200)).toBe('2h ago');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long strings with ellipsis', () => {
      const result = truncate('this is a very long string', 10);
      expect(result).toBe('this is...');
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle exact length', () => {
      const result = truncate('hello', 5);
      expect(result).toBe('hello');
    });
  });
});
