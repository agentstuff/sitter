import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, chmodSync, existsSync } from 'fs';
import { join } from 'path';
import { SKILL_NAMES } from './install.js';

// ---- Shared state for mocks ----

let mockHomeDir = '/default-home';

// ---- os mock (same pattern as install.test.ts) ----

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  return {
    ...actual,
    homedir: vi.fn(() => mockHomeDir),
  };
});

// ---- getAgentSelection mock ----

const { getAgentSelectionMock } = vi.hoisted(() => ({
  getAgentSelectionMock: vi.fn<[string | undefined], Promise<string[]>>(),
}));

vi.mock('../utils/prompt.js', () => ({
  getAgentSelection: getAgentSelectionMock,
  promptForAgent: vi.fn(),
}));

// ---- checkForUpdate mock ----

const { checkForUpdateMock } = vi.hoisted(() => ({
  checkForUpdateMock: vi.fn<[], Promise<string | null>>(),
}));

vi.mock('../utils/npm-registry.js', () => ({
  checkForUpdate: checkForUpdateMock,
}));

// ---- Tests ----

describe('install action handler — orchestration', () => {
  let tempHome: string;

  beforeEach(async () => {
    const os = await import('os');
    tempHome = mkdtempSync(join(os.tmpdir(), 'sitter-install-test-'));
    mockHomeDir = tempHome;
    getAgentSelectionMock.mockReset();
    checkForUpdateMock.mockReset();
  });

  afterEach(() => {
    try {
      chmodSync(tempHome, 0o755);
      rmSync(tempHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('calls install for both opencode and claude when both are selected', async () => {
    getAgentSelectionMock.mockResolvedValue(['opencode', 'claude']);

    // Dynamically import handleInstall to pick up the mocked getAgentSelection.
    const { handleInstall } = await import('./install-action.js');

    await handleInstall({});

    // Verify both agents' skill directories were created by the real install().
    const opencodeSkills = join(tempHome, '.config', 'opencode', 'skills');
    const claudeSkills = join(tempHome, '.claude', 'skills');

    expect(existsSync(opencodeSkills)).toBe(true);
    expect(existsSync(claudeSkills)).toBe(true);

    for (const skill of SKILL_NAMES) {
      expect(existsSync(join(opencodeSkills, skill, 'SKILL.md'))).toBe(true);
      expect(existsSync(join(claudeSkills, skill, 'SKILL.md'))).toBe(true);
    }
  });

  it('delegates single-agent selection directly', async () => {
    getAgentSelectionMock.mockResolvedValue(['claude']);

    const { handleInstall } = await import('./install-action.js');

    await handleInstall({});

    // Only claude should be installed, NOT opencode.
    const opencodeSkills = join(tempHome, '.config', 'opencode', 'skills');
    const claudeSkills = join(tempHome, '.claude', 'skills');

    expect(existsSync(opencodeSkills)).toBe(false);
    expect(existsSync(claudeSkills)).toBe(true);

    for (const skill of SKILL_NAMES) {
      expect(existsSync(join(claudeSkills, skill, 'SKILL.md'))).toBe(true);
    }
  });

  it('installs only kilo when selected', async () => {
    getAgentSelectionMock.mockResolvedValue(['kilo']);

    const { handleInstall } = await import('./install-action.js');

    await handleInstall({});

    const opencodeSkills = join(tempHome, '.config', 'opencode', 'skills');
    const claudeSkills = join(tempHome, '.claude', 'skills');
    const kiloSkills = join(tempHome, '.config', 'kilo', 'skills');

    expect(existsSync(opencodeSkills)).toBe(false);
    expect(existsSync(claudeSkills)).toBe(false);
    expect(existsSync(kiloSkills)).toBe(true);

    for (const skill of SKILL_NAMES) {
      expect(existsSync(join(kiloSkills, skill, 'SKILL.md'))).toBe(true);
    }
  });

  it('installs all three when selected', async () => {
    getAgentSelectionMock.mockResolvedValue(['opencode', 'claude', 'kilo']);

    const { handleInstall } = await import('./install-action.js');

    await handleInstall({});

    const opencodeSkills = join(tempHome, '.config', 'opencode', 'skills');
    const claudeSkills = join(tempHome, '.claude', 'skills');
    const kiloSkills = join(tempHome, '.config', 'kilo', 'skills');

    expect(existsSync(opencodeSkills)).toBe(true);
    expect(existsSync(claudeSkills)).toBe(true);
    expect(existsSync(kiloSkills)).toBe(true);

    for (const skill of SKILL_NAMES) {
      expect(existsSync(join(opencodeSkills, skill, 'SKILL.md'))).toBe(true);
      expect(existsSync(join(claudeSkills, skill, 'SKILL.md'))).toBe(true);
      expect(existsSync(join(kiloSkills, skill, 'SKILL.md'))).toBe(true);
    }
  });

  it('prints update warning before install when newer version exists', async () => {
    checkForUpdateMock.mockResolvedValue('99.0.0');
    getAgentSelectionMock.mockResolvedValue(['claude']);

    const { handleInstall } = await import('./install-action.js');
    await handleInstall({});

    // Verify warning was printed
    expect(checkForUpdateMock).toHaveBeenCalled();
    // claude skills should still be installed after the warning
    const claudeSkills = join(tempHome, '.claude', 'skills');
    expect(existsSync(claudeSkills)).toBe(true);
  });

  it('does not print warning when no update available', async () => {
    checkForUpdateMock.mockResolvedValue(null);
    getAgentSelectionMock.mockResolvedValue(['claude']);

    const { handleInstall } = await import('./install-action.js');
    await handleInstall({});

    expect(checkForUpdateMock).toHaveBeenCalled();
    // claude skills should be installed
    const claudeSkills = join(tempHome, '.claude', 'skills');
    expect(existsSync(claudeSkills)).toBe(true);
  });

  it('cancels installation when no agents are selected', async () => {
    getAgentSelectionMock.mockResolvedValue([]);
    checkForUpdateMock.mockResolvedValue(null);

    const { handleInstall } = await import('./install-action.js');
    await handleInstall({});

    // No agent directories should be created
    const claudeSkills = join(tempHome, '.claude', 'skills');
    const opencodeSkills = join(tempHome, '.config', 'opencode', 'skills');
    expect(existsSync(claudeSkills)).toBe(false);
    expect(existsSync(opencodeSkills)).toBe(false);
  });
});
