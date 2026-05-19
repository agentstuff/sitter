import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { archive } from './archive.js';
import { init } from './init.js';
import { visionCreate } from './vision.js';

let originalCwd: string;

async function captureOutputAsync(fn: () => Promise<unknown>): Promise<Record<string, unknown>> {
  const outputs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
    outputs.push(msg);
  });
  await fn();
  spy.mockRestore();
  if (outputs.length === 0) return {};
  return JSON.parse(outputs[outputs.length - 1]);
}

describe('archive command', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-archive-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('errors when not initialized', async () => {
    const result = await captureOutputAsync(() => archive());

    expect(result).toEqual({
      error: 'NOT_INITIALIZED',
      message: 'Sitter is not initialized. Run `sitter init` first.',
    });
  });

  it('errors when no active project', async () => {
    await init();
    const result = await captureOutputAsync(() => archive());

    expect(result).toEqual({
      error: 'NO_ACTIVE_PROJECT',
      message: 'No active project set.',
    });
  });

  it('errors when project is in REVIEW phase', async () => {
    await init();
    await visionCreate('my-project');

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW' }),
      'utf-8'
    );

    const result = await captureOutputAsync(() => archive());

    expect(result).toEqual({
      error: 'REVIEW_PHASE',
      message: 'Cannot archive during review phase',
    });
  });

  it('creates archive with correct name and copies tasks.md and plan.md', async () => {
    await init();
    await visionCreate('my-project');

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      '# Tasks\n\nSome tasks.',
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'plan.md'),
      '# Plan\n\nSome plan content.',
      'utf-8'
    );

    const result = await captureOutputAsync(() => archive());

    expect(result.success).toBe(true);
    expect(result).toHaveProperty('archive_name');
    const archiveName = result.archive_name as string;
    expect(archiveName).toMatch(/^\d{4}_\d{2}_\d{2}_my-project$/);

    expect(result).toHaveProperty('archived_files');
    const archivedFiles = result.archived_files as string[];
    expect(archivedFiles).toContain('tasks.md');
    expect(archivedFiles).toContain('plan.md');
    expect(archivedFiles).toHaveLength(2);

    const archiveDir = join(tempDir, 'sitter', 'archive', archiveName);
    expect(existsSync(archiveDir)).toBe(true);
    expect(existsSync(join(archiveDir, 'tasks.md'))).toBe(true);
    expect(existsSync(join(archiveDir, 'plan.md'))).toBe(true);
    expect(readFileSync(join(archiveDir, 'tasks.md'), 'utf-8')).toBe('# Tasks\n\nSome tasks.');
    expect(readFileSync(join(archiveDir, 'plan.md'), 'utf-8')).toBe('# Plan\n\nSome plan content.');

    // Original project folder should be deleted
    expect(existsSync(join(tempDir, 'sitter', 'projects', 'my-project'))).toBe(false);

    // Global status activeProject should be null
    const globalStatus = JSON.parse(
      readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8')
    );
    expect(globalStatus.activeProject).toBeNull();
  });

  it('works when tasks.md or plan.md do not exist', async () => {
    await init();
    await visionCreate('my-project');

    // Only create tasks.md, not plan.md
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      '# Tasks\n\nSome tasks.',
      'utf-8'
    );

    const result = await captureOutputAsync(() => archive());

    expect(result.success).toBe(true);
    const archivedFiles = result.archived_files as string[];
    expect(archivedFiles).toContain('tasks.md');
    expect(archivedFiles).not.toContain('plan.md');

    const archiveName = result.archive_name as string;
    const archiveDir = join(tempDir, 'sitter', 'archive', archiveName);
    expect(existsSync(join(archiveDir, 'tasks.md'))).toBe(true);
    expect(existsSync(join(archiveDir, 'plan.md'))).toBe(false);
  });
});
