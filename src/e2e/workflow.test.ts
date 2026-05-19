import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { init } from '../commands/init.js';
import { visionCreate } from '../commands/vision.js';
import { status } from '../commands/status.js';
import { implement } from '../commands/implement.js';
import { apply } from '../commands/apply.js';
import { review } from '../commands/review.js';
import { archive } from '../commands/archive.js';

let originalCwd: string;

async function captureOutputAsync(fn: () => Promise<unknown>): Promise<{ logs: string[]; errors: string[]; lastJson: Record<string, unknown> | null }> {
  const logs: string[] = [];
  const errors: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg: string) => errors.push(msg));
  await fn();
  logSpy.mockRestore();
  errSpy.mockRestore();
  let lastJson: Record<string, unknown> | null = null;
  for (let i = logs.length - 1; i >= 0; i--) {
    try { lastJson = JSON.parse(logs[i]); break; } catch { /* ignore */ }
  }
  return { logs, errors, lastJson };
}

describe('e2e workflow', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-e2e-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('full lifecycle: init -> vision -> implement -> apply -> archive -> drop', async () => {
    // 1. init -> creates sitter directory
    const initResult = await captureOutputAsync(() => init());
    expect(initResult.logs.some(l => l.includes('initialized successfully'))).toBe(true);
    expect(existsSync(join(tempDir, 'sitter'))).toBe(true);
    expect(existsSync(join(tempDir, 'sitter', 'projects'))).toBe(true);
    expect(existsSync(join(tempDir, 'sitter', 'archive'))).toBe(true);

    // 2. vision --create test-proj -> creates project, sets active
    const visionResult = await captureOutputAsync(() => visionCreate('test-proj'));
    expect(visionResult.lastJson).toEqual({ success: true, created: true, name: 'test-proj' });
    expect(existsSync(join(tempDir, 'sitter', 'projects', 'test-proj'))).toBe(true);

    // 3. status -> returns IMPLEMENT
    const statusResult = await captureOutputAsync(() => status());
    expect(statusResult.lastJson).toEqual({ active: 'test-proj', status: 'IMPLEMENT' });

    // 4. Create tasks.md with a task, then implement -> returns task content
    const tasksContent = `<task id="1">
## [ ] First task

Implement a greeting function.

[ ] Step 1: Create function
[ ] Step 2: Add tests
</task>`;

    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'test-proj', 'tasks.md'),
      tasksContent,
      'utf-8'
    );

    const implementResult = await captureOutputAsync(() => implement());
    expect(implementResult.lastJson).toHaveProperty('task_id', 1);
    expect(implementResult.lastJson).toHaveProperty('task_content');
    expect(implementResult.lastJson).toHaveProperty('ai_comments');

    const taskContent = implementResult.lastJson!.task_content as string;
    expect(taskContent).toContain('Implement a greeting function.');
    expect(taskContent).toContain('@@AI@@:');

    // Verify task detail file was created
    const detailPath = join(tempDir, 'sitter', 'projects', 'test-proj', 'task1.md');
    expect(existsSync(detailPath)).toBe(true);

    // Status should remain IMPLEMENT after implement returned a task
    const statusAfterImplement = await captureOutputAsync(() => status());
    expect(statusAfterImplement.lastJson).toEqual({ active: 'test-proj', status: 'IMPLEMENT' });

    // 5. Mark task steps complete in tasks.md, then review
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'test-proj', 'tasks.md'),
      '## [ ] First task\n\nImplement a greeting function.\n\n- [X] Step 1: Create function\n- [X] Step 2: Add tests\n',
      'utf-8'
    );

    const reviewResult = await captureOutputAsync(() => review());
    expect(reviewResult.lastJson).toEqual({ success: true, reviewed: true, status: 'REVIEW' });

    const statusAfterReview = await captureOutputAsync(() => status());
    expect(statusAfterReview.lastJson).toEqual({ active: 'test-proj', status: 'REVIEW' });

    // 6. Simulate AI adding @@AI@@: comment to a file
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'greeting.ts'),
      'export function greet(name: string) {\n  // @@AI@@: Added greeting function as per task 1\n  return `Hello, ${name}!`;\n}\n',
      'utf-8'
    );

    // 7. apply -> should find AI comment, return clean: false
    const applyResultWithComment = await captureOutputAsync(() => apply());
    expect(applyResultWithComment.lastJson).toHaveProperty('clean', false);
    expect(applyResultWithComment.lastJson).toHaveProperty('ai_comments');
    const comments = applyResultWithComment.lastJson!.ai_comments as Array<{ file: string; line: number }>;
    expect(comments.length).toBe(1);
    expect(comments[0].file.endsWith('/src/greeting.ts')).toBe(true);
    expect(comments[0].line).toBe(2);

    // Status should still be REVIEW
    const statusAfterApplyWithComment = await captureOutputAsync(() => status());
    expect(statusAfterApplyWithComment.lastJson).toEqual({ active: 'test-proj', status: 'REVIEW' });

    // 8. Remove AI comment, apply -> transitions to IMPLEMENT
    writeFileSync(
      join(tempDir, 'src', 'greeting.ts'),
      'export function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n',
      'utf-8'
    );

    const applyResultClean = await captureOutputAsync(() => apply());
    expect(applyResultClean.lastJson).toEqual({
      success: true,
      clean: true,
      status: 'IMPLEMENT',
    });

    // Status should now be IMPLEMENT
    const statusAfterApplyClean = await captureOutputAsync(() => status());
    expect(statusAfterApplyClean.lastJson).toEqual({ active: 'test-proj', status: 'IMPLEMENT' });

    // 9. archive -> creates archive, returns archive_name and archived_files
    const archiveResult = await captureOutputAsync(() => archive());
    expect(archiveResult.lastJson!.success).toBe(true);
    expect(archiveResult.lastJson).toHaveProperty('archive_name');
    expect(archiveResult.lastJson).toHaveProperty('archived_files');

    const archiveName = (archiveResult.lastJson!.archive_name as string);
    expect(archiveName.endsWith('_test-proj')).toBe(true);
    expect(existsSync(join(tempDir, 'sitter', 'archive', archiveName))).toBe(true);

    const archivedFiles = archiveResult.lastJson!.archived_files as string[];
    expect(archivedFiles).toContain('tasks.md');

    // Original project folder should be deleted
    expect(existsSync(join(tempDir, 'sitter', 'projects', 'test-proj'))).toBe(false);

    // Global status should be cleared by archive
    const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
    expect(JSON.parse(globalStatus).activeProject).toBeNull();
  });

  it('apply errors when project is not in review phase', async () => {
    await init();
    await visionCreate('test-proj');

    // Status is IMPLEMENT after vision create
    const applyResult = await captureOutputAsync(() => apply());
    expect(applyResult.lastJson).toEqual({
      error: 'NOT_REVIEW_PHASE',
      message: 'Project is not in review phase',
    });
  });

  it('archive errors when project is in review phase', async () => {
    await init();
    await visionCreate('test-proj');

    // Manually set status to REVIEW
    writeFileSync(
      join(tempDir, 'sitter', 'projects', 'test-proj', '.status.json'),
      JSON.stringify({ status: 'REVIEW', currentTask: null }),
      'utf-8'
    );

    const archiveResult = await captureOutputAsync(() => archive());
    expect(archiveResult.lastJson).toEqual({
      error: 'REVIEW_PHASE',
      message: 'Cannot archive during review phase',
    });
  });
});
