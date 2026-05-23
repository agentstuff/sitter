import { readFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { atomicWrite } from '../utils/atomic-write.js';
import { resolveFromPackage } from '../utils/package-root.js';


const DEFAULT_SOURCE_DIR = resolveFromPackage('skills', 'common');

export const SKILL_NAMES = [
  'sitter-vision',
  'sitter-brainstorm',
  'sitter-plan',
  'sitter-implement',
  'sitter-apply',
  'sitter-done',
  'sitter-yolo',
];

const AGENT_PATHS: Record<string, (home: string) => string> = {
  opencode: (home: string) => join(home, '.config', 'opencode', 'skills'),
  claude: (home: string) => join(home, '.claude', 'skills'),
  kilo: (home: string) => join(home, '.config', 'kilo', 'skills'),
};

const COMMAND_PATHS: Record<string, (home: string) => string> = {
  opencode: (home: string) => join(home, '.config', 'opencode', 'commands'),
  kilo: (home: string) => join(home, '.config', 'kilo', 'commands'),
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'sitter-vision': 'Create and manage project visions in Sitter',
  'sitter-brainstorm': 'Brainstorm tasks and ideas within Sitter workflow',
  'sitter-plan': 'Plan tasks and create implementation specifications',
  'sitter-implement': 'Implement tasks using Sitter task definitions',
  'sitter-apply': 'Apply changes and transition between workflow phases',
  'sitter-done': 'Mark tasks as done and finalize implementations',
  'sitter-yolo': 'Implement all tasks continuously without per-task review',
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
  if (agent === 'opencode' || agent === 'kilo') {
    return `---\nname: ${skillName}\ndescription: ${description}\n---\n`;
  }
  if (agent === 'claude') {
    const whenToUse = `Use this skill when working with the Sitter CLI workflow for ${skillName.replace('sitter-', '')}.`;
    return `---\nname: ${skillName}\ndescription: ${description}\nwhen_to_use: ${whenToUse}\n---\n`;
  }
  return '';
}

export function generateCommandFile(agent: string, skillName: string): string {
  const description = SKILL_DESCRIPTIONS[skillName] ?? skillName;
  if (agent === 'opencode' || agent === 'kilo') {
    return `---\ndescription: ${description}\n---\n\nLoad and execute the "${skillName}" skill.\n`;
  }
  return '';
}

export interface InstallOptions {
  agent?: string;
  sourceDir?: string;
}

export async function install(options: InstallOptions = {}): Promise<boolean> {
  const agent = options.agent;

  if (!agent) {
    console.error(chalk.red('Error: Please specify --agent <claude|kilo|opencode>'));
    return false;
  }

  if (!AGENT_PATHS[agent]) {
    console.error(chalk.red(`Error: Agent "${agent}" is not supported. Supported: Claude Code, Kilo CLI, OpenCode`));
    return false;
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
    console.error(chalk.red(`Error: Missing source skill files: ${missing.join(', ')}`));
    return false;
  }

  // Verify target directory is writable by creating it
  try {
    await mkdir(targetDir, { recursive: true });
  } catch (err) {
    console.error(
      chalk.red(
        `Error: Cannot create target directory ${targetDir}: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    return false;
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
      console.error(
        chalk.red(
          `Error: Failed to write to ${targetPath}: ${err instanceof Error ? err.message : String(err)}`
        )
      );
      return false;
    }
  }

  // Install command files (OpenCode and Kilo CLI)
  const installedCommands: string[] = [];
  if (commandDir && (agent === 'opencode' || agent === 'kilo')) {
    try {
      await mkdir(commandDir, { recursive: true });
    } catch (err) {
      console.error(
        chalk.red(
          `Error: Cannot create command directory ${commandDir}: ${err instanceof Error ? err.message : String(err)}`
        )
      );
      return false;
    }

    for (const skill of SKILL_NAMES) {
      const commandContent = generateCommandFile(agent, skill);
      const commandPath = join(commandDir, `${skill}.md`);

      try {
        await atomicWrite(commandPath, commandContent);
        installedCommands.push(skill);
      } catch (err) {
        console.error(
          chalk.red(
            `Error: Failed to write command file ${commandPath}: ${err instanceof Error ? err.message : String(err)}`
          )
        );
        return false;
      }
    }
  }

  console.log('Installed files:');
  for (const skill of installed) {
    console.log('  ' + join(targetDir, skill, 'SKILL.md'));
  }
  if (commandDir) {
    for (const skill of installedCommands) {
      console.log('  ' + join(commandDir, skill + '.md'));
    }
  }
  console.log('');
  console.log(chalk.green('✓ Sitter skills installed successfully!'));
  console.log('');
  console.log('To start using Sitter, navigate to your project and run `sitter init`.');
  return true;
}
