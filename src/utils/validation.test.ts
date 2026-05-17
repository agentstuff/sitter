import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateProjectName, isInitialized, assertInitialized } from './validation.js';

let originalCwd: string;

describe('validation', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-validation-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('validateProjectName', () => {
    it('accepts valid names', () => {
      expect(() => validateProjectName('my-project')).not.toThrow();
      expect(() => validateProjectName('my_project')).not.toThrow();
      expect(() => validateProjectName('MyProject123')).not.toThrow();
      expect(() => validateProjectName('a')).not.toThrow();
    });

    it('rejects empty names', () => {
      expect(() => validateProjectName('')).toThrow('non-empty');
      expect(() => validateProjectName('   ')).toThrow('non-empty');
    });

    it('rejects names over 50 characters', () => {
      expect(() => validateProjectName('a'.repeat(51))).toThrow('50');
    });

    it('rejects names with invalid characters', () => {
      expect(() => validateProjectName('my project')).toThrow('letters, numbers, hyphens, and underscores');
      expect(() => validateProjectName('my.project')).toThrow('letters, numbers, hyphens, and underscores');
      expect(() => validateProjectName('my@project')).toThrow('letters, numbers, hyphens, and underscores');
    });

    it('rejects names starting with a hyphen', () => {
      expect(() => validateProjectName('-my-project')).toThrow('must not start with a hyphen');
      expect(() => validateProjectName('-')).toThrow('must not start with a hyphen');
    });
  });

  describe('isInitialized', () => {
    it('returns false when sitter dir does not exist', () => {
      expect(isInitialized()).toBe(false);
    });

    it('returns false when sitter dir exists but .status.json does not', () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      expect(isInitialized()).toBe(false);
    });

    it('returns false when sitter is a file instead of a directory', () => {
      writeFileSync(join(tempDir, 'sitter'), 'not a directory', 'utf-8');
      expect(isInitialized()).toBe(false);
    });

    it('returns true when sitter dir and .status.json exist', () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', '.status.json'), '{}', 'utf-8');
      expect(isInitialized()).toBe(true);
    });
  });

  describe('assertInitialized', () => {
    it('does not throw when initialized', () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', '.status.json'), '{}', 'utf-8');
      expect(() => assertInitialized()).not.toThrow();
    });

    it('throws when not initialized', () => {
      expect(() => assertInitialized()).toThrow('Run `sitter init` first');
    });
  });
});
