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
  getAgentSelectionMock: vi.fn<[string | undefined], Promise<'opencode' | 'claude' | 'both'>>(),
}));

vi.mock('../utils/prompt.js', () => ({
  getAgentSelection: getAgentSelectionMock,
  promptForAgent: vi.fn(),
}));

// ---- Tests ----

describe('install action handler — "both" orchestration', () => {
  let tempHome: string;

  beforeEach(async () => {
    const os = await import('os');
    tempHome = mkdtempSync(join(os.tmpdir(), 'sitter-install-test-'));
    mockHomeDir = tempHome;
    getAgentSelectionMock.mockReset();
  });

  afterEach(() => {
    try {
      chmodSync(tempHome, 0o755);
      rmSync(tempHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('calls install for both opencode and claude when "both" is selected', async () => {
    getAgentSelectionMock.mockResolvedValue('both');

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

  it('delegates single-agent selection directly (not "both")', async () => {
    getAgentSelectionMock.mockResolvedValue('claude');

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
});
