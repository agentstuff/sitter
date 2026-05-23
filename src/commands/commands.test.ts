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
import { packageVersion } from '../utils/version.js';

const { checkForUpdateMock } = vi.hoisted(() => ({
  checkForUpdateMock: vi.fn<[], Promise<string | null>>(),
}));

vi.mock('../utils/npm-registry.js', () => ({
  checkForUpdate: checkForUpdateMock,
}));

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

describe('commands integration', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-commands-test-'));
    process.chdir(tempDir);
    checkForUpdateMock.mockResolvedValue(null);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('init', () => {
    it('creates directory structure and default files', async () => {
      const result = await captureOutputAsync(() => init());

      expect(result.logs.some(l => l.includes('initialized successfully') || l.includes('folder created'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'projects'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'archive'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', '.status.json'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'TASK.md'))).toBe(true);
      expect(existsSync(join(tempDir, 'sitter', 'settings.yaml'))).toBe(true);

      const statusContent = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(statusContent)).toEqual({ version: packageVersion, activeProject: null });

      const taskContent = readFileSync(join(tempDir, 'sitter', 'TASK.md'), 'utf-8');
      expect(taskContent).toBe('');
    });

    it('errors when already initialized', async () => {
      await init();
      const result = await captureOutputAsync(() => init());

      expect(result.errors.some(e => e.includes('already initialized'))).toBe(true);
    });

    it('shows update warning when newer version is available', async () => {
      checkForUpdateMock.mockResolvedValue('99.0.0');
      const result = await captureOutputAsync(() => init());
      expect(result.logs.some(l => l.includes('A new version of Sitter is available'))).toBe(true);
      expect(result.logs.some(l => l.includes('npm install -g @agentstuff/sitter'))).toBe(true);
      expect(result.logs.some(l => l.includes('sitter install'))).toBe(true);
    });
  });

  describe('vision --create', () => {
    it('creates project with validation and sets active', async () => {
      await init();
      const result = await captureOutputAsync(() => visionCreate('my-project'));

      expect(result.lastJson).toEqual({ success: true, created: true, name: 'my-project' });
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

      expect(result.lastJson).toEqual({ created: false, error: 'already_exists' });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => visionCreate('my-project'));

      expect(result.lastJson).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });

    it('lowercases project names automatically', async () => {
      await init();
      const result = await captureOutputAsync(() => visionCreate('POET'));

      expect(result.lastJson).toEqual({ success: true, created: true, name: 'poet' });
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

      expect(result.lastJson).toEqual({ created: false, error: 'already_exists' });
    });
  });

  describe('projects', () => {
    it('returns active and projects list', async () => {
      await init();
      await visionCreate('alpha');
      await visionCreate('beta');

      const result = await captureOutputAsync(() => projects());

      expect(result.lastJson).toEqual({
        active: 'beta',
        projects: ['alpha', 'beta'],
      });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => projects());

      expect(result.lastJson).toEqual({
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

      expect(result.lastJson).toEqual({ active: 'my-project', status: 'IMPLEMENT' });
    });

    it('returns null when no active project', async () => {
      await init();
      const result = await captureOutputAsync(() => status());

      expect(result.lastJson).toEqual({ active: null, status: null });
    });

    it('returns null when active project was deleted', async () => {
      await init();
      await visionCreate('my-project');
      await projectDrop('my-project');

      const result = await captureOutputAsync(() => status());

      expect(result.lastJson).toEqual({ active: null, status: null });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => status());

      expect(result.lastJson).toEqual({
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

      expect(result.lastJson).toEqual({
        success: true,
        project: 'my-project',
        content: '# VISION\n\n',
      });
    });

    it('errors when not initialized', async () => {
      const result = await captureOutputAsync(() => activeVision());

      expect(result.lastJson).toEqual({
        error: 'NOT_INITIALIZED',
        message: 'Sitter is not initialized. Run `sitter init` first.',
      });
    });

    it('errors when no active project', async () => {
      await init();
      const result = await captureOutputAsync(() => activeVision());

      expect(result.lastJson).toEqual({
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

      expect(result.lastJson).toEqual({ success: true, active: 'alpha' });

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('alpha');
    });

    it('errors when project does not exist', async () => {
      await init();
      const result = await captureOutputAsync(() => projectActive('nonexistent'));

      expect(result.lastJson).toEqual({
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

      expect(result.lastJson).toEqual({ success: true, dropped: true, name: 'my-project' });
      expect(existsSync(join(tempDir, 'sitter', 'projects', 'my-project'))).toBe(false);

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBeNull();
    });

    it('deletes project without clearing active when not active', async () => {
      await init();
      await visionCreate('alpha');
      await visionCreate('beta');

      const result = await captureOutputAsync(() => projectDrop('alpha'));

      expect(result.lastJson).toEqual({ success: true, dropped: true, name: 'alpha' });

      const globalStatus = readFileSync(join(tempDir, 'sitter', '.status.json'), 'utf-8');
      expect(JSON.parse(globalStatus).activeProject).toBe('beta');
    });

    it('errors when project does not exist', async () => {
      await init();
      const result = await captureOutputAsync(() => projectDrop('nonexistent'));

      expect(result.lastJson).toEqual({
        error: 'PROJECT_NOT_FOUND',
        message: 'Project "nonexistent" does not exist.',
      });
    });
  });

  describe('full workflow', () => {
    it('init -> vision -> status -> active-vision -> project --active -> project --drop', async () => {
      // init
      const initResult = await captureOutputAsync(() => init());
      expect(initResult.logs.some(l => l.includes('initialized successfully') || l.includes('folder created'))).toBe(true);

      // vision create
      const visionResult = await captureOutputAsync(() => visionCreate('workflow-proj'));
      expect(visionResult.lastJson).toEqual({ success: true, created: true, name: 'workflow-proj' });

      // status
      const statusResult = await captureOutputAsync(() => status());
      expect(statusResult.lastJson).toEqual({ active: 'workflow-proj', status: 'IMPLEMENT' });

      // active-vision
      const activeVisionResult = await captureOutputAsync(() => activeVision());
      expect(activeVisionResult.lastJson).toEqual({
        success: true,
        project: 'workflow-proj',
        content: '# VISION\n\n',
      });

      // create another project and switch active
      await visionCreate('second-proj');
      const activeResult = await captureOutputAsync(() => projectActive('workflow-proj'));
      expect(activeResult.lastJson).toEqual({ success: true, active: 'workflow-proj' });

      // projects list
      const projectsResult = await captureOutputAsync(() => projects());
      expect(projectsResult.lastJson).toEqual({
        active: 'workflow-proj',
        projects: ['second-proj', 'workflow-proj'],
      });

      // drop second project
      const dropResult = await captureOutputAsync(() => projectDrop('second-proj'));
      expect(dropResult.lastJson).toEqual({ success: true, dropped: true, name: 'second-proj' });

      // projects list after drop
      const projectsAfterDrop = await captureOutputAsync(() => projects());
      expect(projectsAfterDrop.lastJson).toEqual({
        active: 'workflow-proj',
        projects: ['workflow-proj'],
      });
    });
  });
});
