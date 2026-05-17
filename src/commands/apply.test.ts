import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { apply } from './apply.js';
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

describe('apply command', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-apply-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('errors when no active project', async () => {
    await init();
    const result = await captureOutputAsync(() => apply());

    expect(result).toEqual({
      error: 'NO_ACTIVE_PROJECT',
      message: 'No active project set.',
    });
  });

  it('errors when project is not in review phase', async () => {
    await init();
    await visionCreate('my-project');

    const result = await captureOutputAsync(() => apply());

    expect(result).toEqual({
      error: 'NOT_REVIEW_PHASE',
      message: 'Project is not in review phase',
    });
  });

  it('returns clean:false with AI comments when found', async () => {
    await init();
    await visionCreate('my-project');

    // Set project status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );

    // Create a source file with an AI comment
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\n// @@AI@@: Added for debugging\nconsole.log(x);',
      'utf-8'
    );

    const result = await captureOutputAsync(() => apply());

    expect(result).toHaveProperty('clean', false);
    expect(result).toHaveProperty('ai_comments');
    const comments = result.ai_comments as Array<{ file: string; line: number }>;
    expect(comments.length).toBe(1);
    expect(comments[0].file.endsWith('/src/index.ts')).toBe(true);
    expect(comments[0].line).toBe(2);

    // Status should still be REVIEW
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'REVIEW', currentTask: null });
  });

  it('transitions to IMPLEMENT when no AI comments found', async () => {
    await init();
    await visionCreate('my-project');

    // Set project status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );

    // Create a clean source file
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\nconsole.log(x);',
      'utf-8'
    );

    const result = await captureOutputAsync(() => apply());

    expect(result).toEqual({
      success: true,
      clean: true,
      status: 'IMPLEMENT',
    });

    // Status should be updated to IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: null });
  });

  it('respects .gitignore exclusions during scan', async () => {
    await init();
    await visionCreate('my-project');

    // Set project status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );

    // Create .gitignore excluding build/
    writeFileSync(join(tempDir, '.gitignore'), 'build/\n', 'utf-8');

    // Create a file in build/ with AI comment — should be ignored
    mkdirSync(join(tempDir, 'build'), { recursive: true });
    writeFileSync(
      join(tempDir, 'build', 'output.js'),
      '// @@AI@@: Should be ignored\n',
      'utf-8'
    );

    // Create a clean source file
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\nconsole.log(x);',
      'utf-8'
    );

    const result = await captureOutputAsync(() => apply());

    expect(result).toEqual({
      success: true,
      clean: true,
      status: 'IMPLEMENT',
    });
  });

  it('respects hardcoded defaults like node_modules', async () => {
    await init();
    await visionCreate('my-project');

    // Set project status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );

    // Create a file in node_modules/ with AI comment — should be ignored
    mkdirSync(join(tempDir, 'node_modules', 'some-pkg'), { recursive: true });
    writeFileSync(
      join(tempDir, 'node_modules', 'some-pkg', 'index.js'),
      '// @@AI@@: Should be ignored\n',
      'utf-8'
    );

    // Create a clean source file
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\nconsole.log(x);',
      'utf-8'
    );

    const result = await captureOutputAsync(() => apply());

    expect(result).toEqual({
      success: true,
      clean: true,
      status: 'IMPLEMENT',
    });
  });
});
