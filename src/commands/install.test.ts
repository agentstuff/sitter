import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, chmodSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { install, extractBody, generateSkillFrontmatter, generateCommandFile, getTargetPath, getCommandTargetPath, SKILL_NAMES } from './install.js';

let mockHomeDir = '/default-home';

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  return {
    ...actual,
    homedir: vi.fn(() => mockHomeDir),
  };
});

async function captureOutputAsync(fn: () => Promise<unknown>): Promise<{ logs: string[]; errors: string[] }> {
  const logs: string[] = [];
  const errors: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg: string) => errors.push(msg));
  await fn();
  logSpy.mockRestore();
  errSpy.mockRestore();
  return { logs, errors };
}

describe('install command', () => {
  let tempHome: string;

  beforeEach(async () => {
    const os = await import('os');
    tempHome = mkdtempSync(join(os.tmpdir(), 'sitter-install-test-'));
    mockHomeDir = tempHome;
  });

  afterEach(() => {
    try {
      chmodSync(tempHome, 0o755);
      rmSync(tempHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('errors when agent is missing', async () => {
    const result = await captureOutputAsync(() => install({}));

    expect(result.errors.some(e => e.includes('MISSING_AGENT') || e.includes('specify --agent'))).toBe(true);
  });

  it('errors when agent is unsupported', async () => {
    const result = await captureOutputAsync(() => install({ agent: 'unknown' }));

    expect(result.errors.some(e => e.includes('UNSUPPORTED_AGENT') || e.includes('not supported'))).toBe(true);
  });

  it('errors when source skill files are missing', async () => {
    const fakeSourceDir = join(tempHome, 'missing-skills');
    const result = await captureOutputAsync(() =>
      install({ agent: 'opencode', sourceDir: fakeSourceDir })
    );

    expect(result.errors.some(e => e.includes('MISSING_SKILLS') || e.includes('Missing source'))).toBe(true);
  });

  it('installs skills and commands for opencode', async () => {
    const result = await captureOutputAsync(() => install({ agent: 'opencode' }));

    expect(result.logs.some(l => l.includes('installed successfully'))).toBe(true);

    for (const skill of SKILL_NAMES) {
      // Check skill file
      const skillPath = join(tempHome, '.config', 'opencode', 'skills', skill, 'SKILL.md');
      expect(existsSync(skillPath)).toBe(true);

      const skillContent = readFileSync(skillPath, 'utf-8');
      expect(skillContent).toMatch(/^---\n/);
      expect(skillContent).toContain(`name: ${skill}`);
      expect(skillContent).toContain('description:');
      expect(skillContent).not.toContain('when_to_use:');
      expect(skillContent).toContain(`# /${skill}`);

      // Check command file
      const commandPath = join(tempHome, '.config', 'opencode', 'commands', `${skill}.md`);
      expect(existsSync(commandPath)).toBe(true);

      const commandContent = readFileSync(commandPath, 'utf-8');
      expect(commandContent).toMatch(/^---\n/);
      expect(commandContent).toContain('description:');
      expect(commandContent).toContain(`Load and execute the "${skill}" skill.`);
    }
  });

  it('installs skills for claude with correct frontmatter', async () => {
    const result = await captureOutputAsync(() => install({ agent: 'claude' }));

    expect(result.logs.some(l => l.includes('installed successfully'))).toBe(true);

    for (const skill of SKILL_NAMES) {
      const skillPath = join(tempHome, '.claude', 'skills', skill, 'SKILL.md');
      expect(existsSync(skillPath)).toBe(true);

      const content = readFileSync(skillPath, 'utf-8');
      expect(content).toMatch(/^---\n/);
      expect(content).toContain(`name: ${skill}`);
      expect(content).toContain('description:');
      expect(content).toContain('when_to_use:');
      expect(content).not.toContain('model:');
      expect(content).toContain(`# /${skill}`);
    }
  });

  it('returns permission error when target directory is not writable', async () => {
    const configDir = join(tempHome, '.config');
    mkdirSync(configDir);
    chmodSync(configDir, 0o555);

    const result = await captureOutputAsync(() => install({ agent: 'opencode' }));

    expect(result.errors.some(e => e.includes('PERMISSION_ERROR') || e.includes('Cannot create'))).toBe(true);

    chmodSync(configDir, 0o755);
  });
});

describe('extractBody', () => {
  it('extracts body from frontmatter', () => {
    const content = '---\nname: foo\n---\n# Body\n';
    expect(extractBody(content)).toBe('# Body\n');
  });

  it('returns content as-is when no frontmatter', () => {
    const content = '# No frontmatter\n';
    expect(extractBody(content)).toBe('# No frontmatter\n');
  });

  it('handles CRLF line endings', () => {
    const content = '---\r\nname: foo\r\n---\r\n# Body\r\n';
    expect(extractBody(content)).toBe('# Body\r\n');
  });
});

describe('generateSkillFrontmatter', () => {
  it('generates opencode frontmatter', () => {
    const fm = generateSkillFrontmatter('opencode', 'sitter-vision');
    expect(fm).toContain('name: sitter-vision');
    expect(fm).toContain('description:');
    expect(fm).not.toContain('when_to_use');
    expect(fm).not.toContain('trigger');
  });

  it('generates claude frontmatter', () => {
    const fm = generateSkillFrontmatter('claude', 'sitter-vision');
    expect(fm).toContain('name: sitter-vision');
    expect(fm).toContain('description:');
    expect(fm).toContain('when_to_use:');
    expect(fm).not.toContain('model:');
  });
});

describe('generateCommandFile', () => {
  it('generates opencode command file', () => {
    const cmd = generateCommandFile('opencode', 'sitter-vision');
    expect(cmd).toContain('description:');
    expect(cmd).toContain('Load and execute the "sitter-vision" skill.');
  });

  it('returns empty for claude', () => {
    const cmd = generateCommandFile('claude', 'sitter-vision');
    expect(cmd).toBe('');
  });
});

describe('getTargetPath', () => {
  it('returns opencode path', () => {
    expect(getTargetPath('opencode')).toMatch(/\.config[/\\]opencode[/\\]skills$/);
  });

  it('returns claude path', () => {
    expect(getTargetPath('claude')).toMatch(/\.claude[/\\]skills$/);
  });

  it('throws for unsupported agent', () => {
    expect(() => getTargetPath('unknown')).toThrow('unsupported_agent');
  });
});

describe('getCommandTargetPath', () => {
  it('returns opencode command path', () => {
    expect(getCommandTargetPath('opencode')).toMatch(/\.config[/\\]opencode[/\\]commands$/);
  });

  it('returns null for claude', () => {
    expect(getCommandTargetPath('claude')).toBeNull();
  });
});
