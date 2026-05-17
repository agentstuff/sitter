import { readFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { atomicWrite } from '../utils/atomic-write.js';
import { success, error } from '../utils/output.js';
import { resolveFromPackage } from '../utils/package-root.js';

const DEFAULT_SOURCE_DIR = resolveFromPackage('skills', 'common');

export const SKILL_NAMES = [
  'sitter-vision',
  'sitter-brainstorm',
  'sitter-plan',
  'sitter-implement',
  'sitter-apply',
  'sitter-done',
  'sitter-merge-sync',
  'sitter-vibecode',
];

const AGENT_PATHS: Record<string, (home: string) => string> = {
  opencode: (home: string) => join(home, '.config', 'opencode', 'skills'),
  claude: (home: string) => join(home, '.claude', 'skills'),
};

const COMMAND_PATHS: Record<string, (home: string) => string> = {
  opencode: (home: string) => join(home, '.config', 'opencode', 'commands'),
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'sitter-vision': 'Create and manage project visions in Sitter',
  'sitter-brainstorm': 'Brainstorm tasks and ideas within Sitter workflow',
  'sitter-plan': 'Plan tasks and create implementation specifications',
  'sitter-implement': 'Implement tasks using Sitter task definitions',
  'sitter-apply': 'Apply changes and transition between workflow phases',
  'sitter-done': 'Mark tasks as done and finalize implementations',
  'sitter-merge-sync': 'Merge delta specs and synchronize changes',
  'sitter-vibecode': 'Vibe coding with Sitter workflow integration',
};

export function getTargetPath(agent: string): string {
  const home = homedir();
  const pathFn = AGENT_PATHS[agent];
  if (!pathFn) {
    throw new Error(`unsupported_agent`);
  }
  return pathFn(home);
}

export function getCommandTargetPath(agent: string): string | null {
  const home = homedir();
  const pathFn = COMMAND_PATHS[agent];
  return pathFn ? pathFn(home) : null;
}

export function extractBody(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n)?([\s\S]*)$/);
  return match ? match[1] : content;
}

export function generateSkillFrontmatter(agent: string, skillName: string): string {
  const description = SKILL_DESCRIPTIONS[skillName] ?? skillName;
  if (agent === 'opencode') {
    return `---\nname: ${skillName}\ndescription: ${description}\n---\n`;
  }
  if (agent === 'claude') {
    const whenToUse = `Use this skill when working with the Sitter CLI workflow for ${skillName.replace('sitter-', '')}.`;
    return `---\nname: ${skillName}\ndescription: ${description}\nwhen_to_use: ${whenToUse}\nmodel: sonnet\n---\n`;
  }
  return '';
}

export function generateCommandFile(agent: string, skillName: string): string {
  const description = SKILL_DESCRIPTIONS[skillName] ?? skillName;
  if (agent === 'opencode') {
    return `---\ndescription: ${description}\n---\n\nLoad and execute the "${skillName}" skill.\n`;
  }
  return '';
}

export interface InstallOptions {
  agent?: string;
  sourceDir?: string;
}

export async function install(options: InstallOptions = {}): Promise<void> {
  const agent = options.agent;

  if (!agent) {
    error('MISSING_AGENT', 'Please specify --agent <opencode|claude>');
    return;
  }

  if (!AGENT_PATHS[agent]) {
    error('UNSUPPORTED_AGENT', `Agent "${agent}" is not supported. Supported: opencode, claude`);
    return;
  }

  const sourceDir = options.sourceDir ?? DEFAULT_SOURCE_DIR;
  const targetDir = getTargetPath(agent);
  const commandDir = getCommandTargetPath(agent);

  // Check source skills exist
  const missing: string[] = [];
  for (const skill of SKILL_NAMES) {
    const sourcePath = join(sourceDir, skill, 'SKILL.md');
    try {
      await access(sourcePath);
    } catch {
      missing.push(sourcePath);
    }
  }

  if (missing.length > 0) {
    error('MISSING_SKILLS', `Missing source skill files: ${missing.join(', ')}`);
    return;
  }

  // Verify target directory is writable by creating it
  try {
    await mkdir(targetDir, { recursive: true });
  } catch (err) {
    error(
      'PERMISSION_ERROR',
      `Cannot create target directory ${targetDir}: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  // Install each skill
  const installed: string[] = [];
  for (const skill of SKILL_NAMES) {
    const sourcePath = join(sourceDir, skill, 'SKILL.md');
    const content = await readFile(sourcePath, 'utf-8');
    const body = extractBody(content);
    const frontmatter = generateSkillFrontmatter(agent, skill);
    const transformedContent = frontmatter + body;

    const targetPath = join(targetDir, skill, 'SKILL.md');

    try {
      await atomicWrite(targetPath, transformedContent);
      installed.push(skill);
    } catch (err) {
      error(
        'PERMISSION_ERROR',
        `Failed to write to ${targetPath}: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }
  }

  // Install command files (OpenCode only)
  const installedCommands: string[] = [];
  if (commandDir && agent === 'opencode') {
    try {
      await mkdir(commandDir, { recursive: true });
    } catch (err) {
      error(
        'PERMISSION_ERROR',
        `Cannot create command directory ${commandDir}: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    for (const skill of SKILL_NAMES) {
      const commandContent = generateCommandFile(agent, skill);
      const commandPath = join(commandDir, `${skill}.md`);

      try {
        await atomicWrite(commandPath, commandContent);
        installedCommands.push(skill);
      } catch (err) {
        error(
          'PERMISSION_ERROR',
          `Failed to write command file ${commandPath}: ${err instanceof Error ? err.message : String(err)}`
        );
        return;
      }
    }
  }

  success({ 
    installed: true, 
    agent, 
    skills: installed, 
    commands: installedCommands,
    target: targetDir,
    commandTarget: commandDir,
  });
}
