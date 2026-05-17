import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readProjectStatus, writeProjectStatus } from './project-status.js';

let originalCwd: string;

describe('project-status', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-project-status-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('readProjectStatus', () => {
    it('returns default when file does not exist', async () => {
      const status = await readProjectStatus('nonexistent');
      expect(status).toEqual({ status: 'IMPLEMENT', currentTask: null });
    });

    it('reads existing project status', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'my-project'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
        JSON.stringify({ status: 'REVIEW' }),
        'utf-8'
      );

      const status = await readProjectStatus('my-project');
      expect(status).toEqual({ status: 'REVIEW', currentTask: null });
    });

    it('throws on invalid status value', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'bad-project'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', 'projects', 'bad-project', '.status.json'),
        JSON.stringify({ status: 'DONE' }),
        'utf-8'
      );

      await expect(readProjectStatus('bad-project')).rejects.toThrow('Invalid project status');
    });

    it('throws on malformed JSON', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'bad-project'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', 'projects', 'bad-project', '.status.json'),
        'not-json',
        'utf-8'
      );

      await expect(readProjectStatus('bad-project')).rejects.toThrow('Malformed project status file');
    });

    it('throws on non-object JSON', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'bad-project'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', 'projects', 'bad-project', '.status.json'),
        JSON.stringify('string'),
        'utf-8'
      );

      await expect(readProjectStatus('bad-project')).rejects.toThrow('must contain a JSON object');
    });
  });

  describe('writeProjectStatus', () => {
    it('writes status to file', async () => {
      await writeProjectStatus('my-project', { status: 'REVIEW', currentTask: null });

      const result = await readProjectStatus('my-project');
      expect(result).toEqual({ status: 'REVIEW', currentTask: null });
    });

    it('rejects invalid status values', async () => {
      await expect(
        writeProjectStatus('my-project', { status: 'DONE' as 'REVIEW', currentTask: null })
      ).rejects.toThrow('Invalid project status');
    });

    it('creates parent directories if needed', async () => {
      await writeProjectStatus('nested/project', { status: 'IMPLEMENT', currentTask: null });

      const result = await readProjectStatus('nested/project');
      expect(result).toEqual({ status: 'IMPLEMENT', currentTask: null });
    });
  });
});
