import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { review } from './review.js';
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

describe('review command', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-review-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('errors when no active project', async () => {
    await init();
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'NO_ACTIVE_PROJECT',
      message: 'No active project set.',
    });
  });

  it('errors when project is already in REVIEW', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'ALREADY_REVIEW',
      message: 'Already in review phase',
    });
  });

  it('errors when no current task is set', async () => {
    await init();
    await visionCreate('my-project');
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'NO_CURRENT_TASK',
      message: 'No active task to review. Run `sitter implement` first.',
    });
  });

  it('errors when tasks.md is missing', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'IMPLEMENT', currentTask: 1 }),
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'NO_TASKS_FILE',
      message: 'No tasks.md found for this project.',
    });
  });

  it('errors when currentTask not found in tasks.md', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'IMPLEMENT', currentTask: 99 }),
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      '## [ ] Task 1\n- [ ] Step 1\n',
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'TASK_NOT_FOUND',
      message: 'Task 99 not found in tasks.md.',
    });
  });

  it('errors when task has incomplete steps in tasks.md', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'IMPLEMENT', currentTask: 1 }),
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      '## [ ] Task 1\n- [X] Step 1\n- [ ] Step 2\n',
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'TASK_NOT_COMPLETE',
      message: 'Task 1 has incomplete steps in tasks.md:\n- Step 2\nMark all steps as [X] before running review.',
    });
  });

  it('successfully transitions IMPLEMENT to REVIEW and marks title [X]', async () => {
    await init();
    await visionCreate('my-project');
    const tasksContent = '## [ ] Task 1\n- [X] Step 1\n- [X] Step 2\n\n## [ ] Task 2\n- [ ] Step A\n';
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'IMPLEMENT', currentTask: 1 }),
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({ success: true, reviewed: true, status: 'REVIEW' });
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'REVIEW', currentTask: null });
    const updatedTasks = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      'utf-8'
    );
    expect(updatedTasks).toContain('## [X] Task 1');
    expect(updatedTasks).toContain('- [X] Step 1');
    expect(updatedTasks).toContain('- [X] Step 2');
    expect(updatedTasks).toContain('## [ ] Task 2');
    expect(updatedTasks).toContain('- [ ] Step A');
  });

  it('is idempotent when title already [X]', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      '## [X] Task 1\n- [X] Step 1\n',
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'IMPLEMENT', currentTask: 1 }),
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({ success: true, reviewed: true, status: 'REVIEW' });
    const updatedTasks = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      'utf-8'
    );
    expect(updatedTasks).toContain('## [X] Task 1');
  });

  it('returns error for invalid status in status file', async () => {
    await init();
    await visionCreate('my-project');
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'UNKNOWN' }),
      'utf-8'
    );
    const result = await captureOutputAsync(() => review());
    expect(result).toEqual({
      error: 'READ_ERROR',
      message: 'Invalid project status: "UNKNOWN". Must be "IMPLEMENT" or "REVIEW".',
    });
  });
});
