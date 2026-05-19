import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { implement } from './implement.js';
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

describe('implement command', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-implement-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('errors when no active project', async () => {
    await init();
    const result = await captureOutputAsync(() => implement());

    expect(result).toEqual({
      error: 'NO_ACTIVE_PROJECT',
      message: 'No active project set.',
    });
  });

  it('errors when project is in REVIEW phase', async () => {
    await init();
    await visionCreate('my-project');

    // Set project status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      JSON.stringify({ status: 'REVIEW' }),
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toEqual({
      error: 'REVIEW_PHASE',
      message: 'Project is in REVIEW status. Use `sitter apply` to continue, or finish review first.',
    });
  });

  it('returns completed when tasks.md is missing', async () => {
    await init();
    await visionCreate('my-project');

    const result = await captureOutputAsync(() => implement());

    expect(result).toEqual({ success: true, completed: true });
  });

  it('returns completed when all tasks are checked', async () => {
    await init();
    await visionCreate('my-project');

    const tasksContent = `## [X] Task 1: Completed task
- [X] Step 1`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toEqual({ success: true, completed: true });
  });

  it('returns next task with content and creates task detail file', async () => {
    await init();
    await visionCreate('my-project');

    const tasksContent = `## [X] Task 1: First task
- [X] Step 1

## [ ] Task 2: Second task
Notes for second task.

- [ ] Step A
- [X] Step B`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('task_id', 2);
    expect(result).toHaveProperty('task_content');
    expect(result).toHaveProperty('ai_comments');
    expect(result.ai_comments).toBe(true);

    const taskContent = result.task_content as string;
    expect(taskContent).toContain('Notes for second task.');
    expect(taskContent).toContain('[ ] Step A');
    expect(taskContent).toContain('[X] Step B');

    // Check task detail file was created
    const detailPath = join(tempDir, 'sitter', 'projects', 'my-project', 'task2.md');
    expect(existsSync(detailPath)).toBe(true);

    const detailContent = readFileSync(detailPath, 'utf-8');
    expect(detailContent).toContain('# TASK 2');
    expect(detailContent).toContain('## OG Description');
    expect(detailContent).toContain('Notes for second task.');
    expect(detailContent).toContain('## Discovery');
    expect(detailContent).toContain('## Decisions');
    expect(detailContent).toContain('## User Changes');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 2 });
  });

  it('prepends TASK.md template to task content', async () => {
    await init();
    await visionCreate('my-project');

    writeFileSync(
      join(tempDir, 'sitter', 'TASK.md'),
      '# Global Template\n\nSome instructions.',
      'utf-8'
    );

    const tasksContent = `## [ ] Task 1: Task with template
- [ ] Step 1`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('task_id', 1);
    const taskContent = result.task_content as string;
    expect(taskContent.startsWith('# Global Template\n\nSome instructions.')).toBe(true);
    expect(taskContent).toContain('\n\n---\n\n');
    expect(taskContent).toContain('## [ ] Task 1: Task with template');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 1 });
  });

  it('works when TASK.md is missing', async () => {
    await init();
    await visionCreate('my-project');

    // Remove default TASK.md created by init
    rmSync(join(tempDir, 'sitter', 'TASK.md'));

    const tasksContent = `## [ ] Task 1: Task without template
- [ ] Step 1`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('task_id', 1);
    const taskContent = result.task_content as string;
    expect(taskContent.startsWith('## [ ] Task 1: Task without template\n- [ ] Step 1')).toBe(true);
    expect(taskContent).toContain('@@AI@@');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 1 });
  });

  it('disables ai_comments when config.review.ai_comments is false', async () => {
    await init();
    await visionCreate('my-project');

    // Override settings.yaml
    writeFileSync(
      join(tempDir, 'sitter', 'settings.yaml'),
      'review:\n  ai_comments: false\n',
      'utf-8'
    );

    const tasksContent = `## [ ] Task 1: Task without AI comments
- [ ] Step 1`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('ai_comments', false);
    const taskContent = result.task_content as string;
    expect(taskContent).not.toContain('@@AI@@');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 1 });
  });

  it('enables ai_comments by default when settings.yaml is missing', async () => {
    await init();
    await visionCreate('my-project');

    // Remove default settings.yaml
    rmSync(join(tempDir, 'sitter', 'settings.yaml'));

    const tasksContent = `## [ ] Task 1: Task with default AI comments
- [ ] Step 1`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('ai_comments', true);
    const taskContent = result.task_content as string;
    expect(taskContent).toContain('@@AI@@');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 1 });
  });

  it('returns the first unchecked task when multiple exist', async () => {
    await init();
    await visionCreate('my-project');

    const tasksContent = `## [ ] Task 1: First unchecked
- [ ] Step 1

## [ ] Task 2: Second unchecked
- [ ] Step 2`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const result = await captureOutputAsync(() => implement());

    expect(result).toHaveProperty('task_id', 1);
    expect(result).toHaveProperty('task_content');

    // Status should remain IMPLEMENT
    const statusContent = readFileSync(
      join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
      'utf-8'
    );
    expect(JSON.parse(statusContent)).toEqual({ status: 'IMPLEMENT', currentTask: 1 });
  });
});
