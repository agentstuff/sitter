import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  sitterDir,
  sitterProjectsDir,
  sitterArchiveDir,
  sitterSpecsDir,
  projectDir,
  globalStatusPath,
  projectStatusPath,
  settingsPath,
  taskTemplatePath,
  tasksPath,
  visionPath,
  planPath,
  taskDetailPath,
} from './paths.js';

let originalCwd: string;

describe('paths', () => {
  let tempDir: string;
  let resolvedTempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-paths-test-'));
    resolvedTempDir = realpathSync(tempDir);
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('sitterDir returns absolute path to sitter directory', () => {
    const dir = sitterDir();
    expect(dir).toBe(join(resolvedTempDir, 'sitter'));
    expect(dir.startsWith('/')).toBe(true);
  });

  it('sitterProjectsDir returns correct path', () => {
    expect(sitterProjectsDir()).toBe(join(resolvedTempDir, 'sitter', 'projects'));
  });

  it('sitterArchiveDir returns correct path', () => {
    expect(sitterArchiveDir()).toBe(join(resolvedTempDir, 'sitter', 'archive'));
  });

  it('sitterSpecsDir returns correct path', () => {
    expect(sitterSpecsDir()).toBe(join(resolvedTempDir, 'sitter', 'specs'));
  });

  it('projectDir returns correct path for a project name', () => {
    expect(projectDir('my-project')).toBe(join(resolvedTempDir, 'sitter', 'projects', 'my-project'));
  });

  it('globalStatusPath returns correct path', () => {
    expect(globalStatusPath()).toBe(join(resolvedTempDir, 'sitter', '.status.json'));
  });

  it('projectStatusPath returns correct path', () => {
    expect(projectStatusPath('my-project')).toBe(
      join(resolvedTempDir, 'sitter', 'projects', 'my-project', '.status.json')
    );
  });

  it('settingsPath returns correct path', () => {
    expect(settingsPath()).toBe(join(resolvedTempDir, 'sitter', 'settings.yaml'));
  });

  it('taskTemplatePath returns correct path', () => {
    expect(taskTemplatePath()).toBe(join(resolvedTempDir, 'sitter', 'TASK.md'));
  });

  it('tasksPath returns correct path', () => {
    expect(tasksPath('my-project')).toBe(
      join(resolvedTempDir, 'sitter', 'projects', 'my-project', 'tasks.md')
    );
  });

  it('visionPath returns correct path', () => {
    expect(visionPath('my-project')).toBe(
      join(resolvedTempDir, 'sitter', 'projects', 'my-project', 'vision.md')
    );
  });

  it('planPath returns correct path', () => {
    expect(planPath('my-project')).toBe(
      join(resolvedTempDir, 'sitter', 'projects', 'my-project', 'plan.md')
    );
  });

  it('taskDetailPath returns correct path', () => {
    expect(taskDetailPath('my-project', '42')).toBe(
      join(resolvedTempDir, 'sitter', 'projects', 'my-project', 'task42.md')
    );
  });
});
