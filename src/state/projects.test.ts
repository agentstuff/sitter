import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listProjects, projectExists, isProjectActive } from './projects.js';

let originalCwd: string;

describe('projects', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-projects-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('listProjects', () => {
    it('returns empty array when projects dir does not exist', async () => {
      const projects = await listProjects();
      expect(projects).toEqual([]);
    });

    it('returns only directory names', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'alpha'), { recursive: true });
      mkdirSync(join(tempDir, 'sitter', 'projects', 'beta'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', 'projects', 'not-a-project.txt'), '', 'utf-8');

      const projects = await listProjects();
      expect(projects).toEqual(['alpha', 'beta']);
    });

    it('returns sorted names', async () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'zebra'), { recursive: true });
      mkdirSync(join(tempDir, 'sitter', 'projects', 'alpha'), { recursive: true });
      mkdirSync(join(tempDir, 'sitter', 'projects', 'beta'), { recursive: true });

      const projects = await listProjects();
      expect(projects).toEqual(['alpha', 'beta', 'zebra']);
    });
  });

  describe('projectExists', () => {
    it('returns true when project directory exists', () => {
      mkdirSync(join(tempDir, 'sitter', 'projects', 'my-project'), { recursive: true });
      expect(projectExists('my-project')).toBe(true);
    });

    it('returns false when project directory does not exist', () => {
      expect(projectExists('missing-project')).toBe(false);
    });

    it('returns false for a file instead of directory', () => {
      mkdirSync(join(tempDir, 'sitter', 'projects'), { recursive: true });
      writeFileSync(join(tempDir, 'sitter', 'projects', 'not-a-dir'), '', 'utf-8');
      expect(projectExists('not-a-dir')).toBe(false);
    });
  });

  describe('isProjectActive', () => {
    it('returns true when project is active', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.0', activeProject: 'my-project' }),
        'utf-8'
      );

      expect(await isProjectActive('my-project')).toBe(true);
    });

    it('returns false when project is not active', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.0', activeProject: 'other-project' }),
        'utf-8'
      );

      expect(await isProjectActive('my-project')).toBe(false);
    });

    it('returns false when no active project', async () => {
      mkdirSync(join(tempDir, 'sitter'), { recursive: true });
      writeFileSync(
        join(tempDir, 'sitter', '.status.json'),
        JSON.stringify({ version: '1.0', activeProject: null }),
        'utf-8'
      );

      expect(await isProjectActive('my-project')).toBe(false);
    });
  });
});
