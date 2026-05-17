import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readGlobalStatus, writeGlobalStatus } from './global-status.js';

let originalCwd: string;

describe('global-status', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-global-status-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('readGlobalStatus', () => {
    it('returns default when file does not exist', async () => {
      const status = await readGlobalStatus();
      expect(status).toEqual({ version: '1.0', activeProject: null });
    });

    it('reads existing global status', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.2', activeProject: 'my-project' }),
        'utf-8'
      );

      const status = await readGlobalStatus();
      expect(status).toEqual({ version: '1.2', activeProject: 'my-project' });
    });

    it('throws clear error on malformed JSON', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', '.status.json'), 'not-json', 'utf-8');

      await expect(readGlobalStatus()).rejects.toThrow('Malformed global status file');
    });

    it('uses defaults for missing fields', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', '.status.json'), JSON.stringify({}), 'utf-8');

      const status = await readGlobalStatus();
      expect(status).toEqual({ version: '1.0', activeProject: null });
    });

    it('handles activeProject as string', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ activeProject: 'another-project' }),
        'utf-8'
      );

      const status = await readGlobalStatus();
      expect(status).toEqual({ version: '1.0', activeProject: 'another-project' });
    });
  });

  describe('writeGlobalStatus', () => {
    it('writes status to file', async () => {
      const status = { version: '1.1', activeProject: 'test-proj' };
      await writeGlobalStatus(status);

      const result = await readGlobalStatus();
      expect(result).toEqual(status);
    });

    it('creates parent directories if needed', async () => {
      const status = { version: '1.0', activeProject: null };
      await writeGlobalStatus(status);

      const result = await readGlobalStatus();
      expect(result).toEqual(status);
    });

    it('overwrites existing status', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '0.9', activeProject: 'old' }),
        'utf-8'
      );

      const status = { version: '1.0', activeProject: 'new' };
      await writeGlobalStatus(status);

      const result = await readGlobalStatus();
      expect(result).toEqual(status);
    });
  });
});
