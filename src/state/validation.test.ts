import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateStatusTransition, assertProjectExists, assertActiveProject } from './validation.js';

let originalCwd: string;

describe('state/validation', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-state-validation-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('validateStatusTransition', () => {
    it('allows IMPLEMENT -> REVIEW', () => {
      expect(() => validateStatusTransition('IMPLEMENT', 'REVIEW')).not.toThrow();
    });

    it('allows REVIEW -> IMPLEMENT', () => {
      expect(() => validateStatusTransition('REVIEW', 'IMPLEMENT')).not.toThrow();
    });

    it('throws on same status transition', () => {
      expect(() => validateStatusTransition('IMPLEMENT', 'IMPLEMENT')).toThrow('already');
      expect(() => validateStatusTransition('REVIEW', 'REVIEW')).toThrow('already');
    });

    it('throws on invalid source status', () => {
      expect(() => validateStatusTransition('DONE', 'REVIEW')).toThrow('Invalid source status');
    });

    it('throws on invalid target status', () => {
      expect(() => validateStatusTransition('IMPLEMENT', 'DONE')).toThrow('Invalid target status');
    });
  });

  describe('assertProjectExists', () => {
    it('does not throw when project directory exists', () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'my-project'), { recursive: true });
      expect(() => assertProjectExists('my-project')).not.toThrow();
    });

    it('throws when project directory does not exist', () => {
      expect(() => assertProjectExists('missing-project')).toThrow('does not exist');
    });
  });

  describe('assertActiveProject', () => {
    it('returns active project name when set', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.0', activeProject: 'active-proj' }),
        'utf-8'
      );

      const result = await assertActiveProject();
      expect(result).toBe('active-proj');
    });

    it('throws when no active project is set', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.0', activeProject: null }),
        'utf-8'
      );

      await expect(assertActiveProject()).rejects.toThrow('No active project');
    });

    it('throws when global status file does not exist', async () => {
      await expect(assertActiveProject()).rejects.toThrow('No active project');
    });
  });
});
