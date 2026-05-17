import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { init } from './init.js';
import { visionCreate } from './vision.js';
import { projects } from './projects.js';
import { projectActive, projectDrop } from './project.js';
import { status } from './status.js';
import { activeVision } from './active-vision.js';

let originalCwd: string;

async function captureOutputAsync(fn: () => Promise<void>): Promise<Record<string, unknown>> {
  const outputs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
    outputs.push(msg);
  });
  await fn();
  spy.mockRestore();
  // Return the last output, or parse all if multiple
  if (outputs.length === 0) return {};
  return JSON.parse(outputs[outputs.length - 1]);
}

describe('commands integration', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-commands-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('init', () => {
    it('creates directory structure and default files', async () => {
      const result = await captureOutputAsync(() => init());

      expect(result).toEqual({ success: true, initialized: true });
      expect(existsSync(join(tempDir, 'sitter'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'projects'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'archive'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', '.status.json'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'TASK.md'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'settings.yaml'))).toBe(true);

      const statusContent = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(statusContent)).toEqual({ version: '1.0', activeProject: null });

      const taskContent = readFileSync(join(tempDir, 'sitter', 'TASK.md'), 'utf-8');
      expect(taskContent).toBe('');
    });

    it('errors when already initialized', async () => {
      await init();
      const result = await captureOutputAsync(() => init());

      expect(result).toEqual({
        error: 'ALREADY_INITIALIZED',
        message: 'Already initialized',
      });
    });
  });

  describe('vision --create', () => {
    it('creates project with validation and sets active', async () => {
      await init();
      const result = await captureOutputAsync(() => visionCreate('my-project'));

      expect(result).toEqual({ success: true, created: true, name: 'my-project' });
      expect(existsSync(join(tempDir, 'sitter', 'projects', 'my-project'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'projects', 'my-project', 'vision.md'))).toBe(true);

      const visionContent = readFileSync(
        join(tempDir, 'sitter', 'projects', 'my-project', 'vision.md'),
        'utf-8'
      );
      expect(visionContent).toBe('# VISION\n\n');

      const projectStatus = readFileSync(
        join(tempDir, 'sitter', 'projects', 'my-project', '.status.json'),
        'utf-8'
      );
      expect(JSON.parse(projectStatus)).toEqual({ status: 'IMPLEMENT', currentTask: null });

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('my-project');
    });

    it('returns already_exists when project exists', async () => {
      await init();
      await visionCreate('my-project');
      const result = await captureOutputAsync(() => visionCreate('my-project'));

      expect(result).toEqual({ created: false, error: 'already_exists' });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => visionCreate('my-project'));

      expect(result).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });

    it('lowercases project names automatically', async () => {
      await init();
      const result = await captureOutputAsync(() => visionCreate('POET'));

      expect(result).toEqual({ success: true, created: true, name: 'poet' });
      const projectsDir = join(tempDir, 'sitter', 'projects');
      expect(readdirSync(projectsDir)).toContain('poet');
      // Note: case-sensitive check skipped because macOS APFS is case-insensitive

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('poet');
    });

    it('returns already_exists for uppercase when lowercase exists', async () => {
      await init();
      await visionCreate('poet');
      const result = await captureOutputAsync(() => visionCreate('POET'));

      expect(result).toEqual({ created: false, error: 'already_exists' });
    });
  });

  describe('projects', () => {
    it('returns active and projects list', async () => {
      await init();
      await visionCreate('alpha');
      await visionCreate('beta');

      const result = await captureOutputAsync(() => projects());

      expect(result).toEqual({
        active: 'beta',
        projects: ['alpha', 'beta'],
      });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => projects());

      expect(result).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });
  });

  describe('status', () => {
    it('returns active project and phase', async () => {
      await init();
      await visionCreate('my-project');

      const result = await captureOutputAsync(() => status());

      expect(result).toEqual({ active: 'my-project', status: 'IMPLEMENT' });
    });

    it('returns null when no active project', async () => {
      await init();
      const result = await captureOutputAsync(() => status());

      expect(result).toEqual({ active: null, status: null });
    });

    it('returns null when active project was deleted', async () => {
      await init();
      await visionCreate('my-project');
      await projectDrop('my-project');

      const result = await captureOutputAsync(() => status());

      expect(result).toEqual({ active: null, status: null });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => status());

      expect(result).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });
  });

  describe('active-vision', () => {
    it('returns vision.md content', async () => {
      await init();
      await visionCreate('my-project');

      const result = await captureOutputAsync(() => activeVision());

      expect(result).toEqual({
        success: true,
        project: 'my-project',
        content: '# VISION\n\n',
      });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => activeVision());

      expect(result).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });

    it('errors when no active project', async () => {
      await init();
      const result = await captureOutputAsync(() => activeVision());

      expect(result).toEqual({
        error: 'NO_ACTIVE_PROJECT',
        message: 'No active project set.',
      });
    });
  });

  describe('project --active', () => {
    it('switches active project', async () => {
      await init();
      await visionCreate('alpha');
      await visionCreate('beta');

      const result = await captureOutputAsync(() => projectActive('alpha'));

      expect(result).toEqual({ success: true, active: 'alpha' });

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('alpha');
    });

    it('errors when project does not exist', async () => {
      await init();
      const result = await captureOutputAsync(() => projectActive('nonexistent'));

      expect(result).toEqual({
        error: 'PROJECT_NOT_FOUND',
        message: 'Project "nonexistent" does not exist.',
      });
    });
  });

  describe('project --drop', () => {
    it('deletes project and clears active', async () => {
      await init();
      await visionCreate('my-project');

      const result = await captureOutputAsync(() => projectDrop('my-project'));

      expect(result).toEqual({ success: true, dropped: true, name: 'my-project' });
      expect(existsSync(join(tempDir, 'sitter', 'projects', 'my-project'))).toBe(false);

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBeNull();
    });

    it('deletes project without clearing active when not active', async () => {
      await init();
      await visionCreate('alpha');
      await visionCreate('beta');

      const result = await captureOutputAsync(() => projectDrop('alpha'));

      expect(result).toEqual({ success: true, dropped: true, name: 'alpha' });

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('beta');
    });

    it('errors when project does not exist', async () => {
      await init();
      const result = await captureOutputAsync(() => projectDrop('nonexistent'));

      expect(result).toEqual({
        error: 'PROJECT_NOT_FOUND',
        message: 'Project "nonexistent" does not exist.',
      });
    });
  });

  describe('full workflow', () => {
    it('init -> vision -> status -> active-vision -> project --active -> project --drop', async () => {
      // init
      const initResult = await captureOutputAsync(() => init());
      expect(initResult).toEqual({ success: true, initialized: true });

      // vision create
      const visionResult = await captureOutputAsync(() => visionCreate('workflow-proj'));
      expect(visionResult).toEqual({ success: true, created: true, name: 'workflow-proj' });

      // status
      const statusResult = await captureOutputAsync(() => status());
      expect(statusResult).toEqual({ active: 'workflow-proj', status: 'IMPLEMENT' });

      // active-vision
      const activeVisionResult = await captureOutputAsync(() => activeVision());
      expect(activeVisionResult).toEqual({
        success: true,
        project: 'workflow-proj',
        content: '# VISION\n\n',
      });

      // create another project and switch active
      await visionCreate('second-proj');
      const activeResult = await captureOutputAsync(() => projectActive('workflow-proj'));
      expect(activeResult).toEqual({ success: true, active: 'workflow-proj' });

      // projects list
      const projectsResult = await captureOutputAsync(() => projects());
      expect(projectsResult).toEqual({
        active: 'workflow-proj',
        projects: ['second-proj', 'workflow-proj'],
      });

      // drop second project
      const dropResult = await captureOutputAsync(() => projectDrop('second-proj'));
      expect(dropResult).toEqual({ success: true, dropped: true, name: 'second-proj' });

      // projects list after drop
      const projectsAfterDrop = await captureOutputAsync(() => projects());
      expect(projectsAfterDrop).toEqual({
        active: 'workflow-proj',
        projects: ['workflow-proj'],
      });
    });
  });
});
