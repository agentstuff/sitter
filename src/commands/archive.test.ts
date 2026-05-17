import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { archive } from './archive.js';
import { init } from './init.js';
import { visionCreate } from './vision.js';

let originalCwd: string;

async function captureOutputAsync(fn: () => Promise<void>): Promise<Record<string, unknown>> {
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

  it('creates archive with correct name, files, wall_of_text, and copies plan.md', async () => {
    await init();
    await visionCreate('my-project');

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'plan.md'),
      '# Plan\n\nSome plan content.',
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'notes.md'),
      '# Notes\n\nSome notes.',
      'utf-8'
    );
    mkdirSync(join(tempDir, 'sitter', 'projects', 'my-project', 'subdir'));
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'subdir', 'extra.md'),
      'Extra content.',
      'utf-8'
    );

    const result = await captureOutputAsync(() => archive());

    expect(result).toHaveProperty('archive_name');
    const archiveName = result.archive_name as string;
    expect(archiveName).toMatch(/^\d{4}_\d{2}_\d{2}_my-project$/);

    expect(result).toHaveProperty('files');
    const files = result.files as string[];
    expect(files).toContain('vision.md');
    expect(files).toContain('.status.json');
    expect(files).toContain('plan.md');
    expect(files).toContain('notes.md');
    expect(files).toContain(join('subdir', 'extra.md'));

    expect(result).toHaveProperty('wall_of_text');
    const wallOfText = result.wall_of_text as string;
    expect(wallOfText).toContain('--- FILE: vision.md ---');
    expect(wallOfText).toContain('# VISION');
    expect(wallOfText).toContain('--- FILE: plan.md ---');
    expect(wallOfText).toContain('Some plan content.');
    expect(wallOfText).toContain('--- FILE: notes.md ---');
    expect(wallOfText).toContain('Some notes.');
    expect(wallOfText).toContain(`--- FILE: ${join('subdir', 'extra.md')} ---`);
    expect(wallOfText).toContain('Extra content.');

    const archiveDir = join(tempDir, 'sitter', 'archive', archiveName);
    expect(existsSync(archiveDir)).toBe(true);

    const archivedPlanPath = join(archiveDir, 'plan.md');
    expect(existsSync(archivedPlanPath)).toBe(true);
    expect(readFileSync(archivedPlanPath, 'utf-8')).toBe('# Plan\n\nSome plan content.');

    const archivedWallPath = join(archiveDir, 'wall-of-text.txt');
    expect(existsSync(archivedWallPath)).toBe(true);
    expect(readFileSync(archivedWallPath, 'utf-8')).toContain('--- FILE: vision.md ---');
  });
});
