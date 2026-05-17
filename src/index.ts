#!/usr/bin/env node
import { program, CommanderError } from 'commander';
import { readFileSync } from 'fs';
import { error } from './utils/output.js';
import { init } from './commands/init.js';
import { visionCreate } from './commands/vision.js';
import { projects } from './commands/projects.js';
import { projectActive, projectDrop } from './commands/project.js';
import { status } from './commands/status.js';
import { activeVision } from './commands/active-vision.js';
import { implement } from './commands/implement.js';
import { apply } from './commands/apply.js';
import { merge } from './commands/merge.js';
import { archive } from './commands/archive.js';
import { review } from './commands/review.js';
import { install } from './commands/install.js';

import { resolveFromPackage } from './utils/package-root.js';

const packageJsonPath = resolveFromPackage('package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

program
  .name('sitter')
  .description('A TypeScript CLI tool for AI agent workflow management')
  .version(version);

program
  .command('init')
  .description('Initialize a new Sitter workspace')
  .action(async () => {
    await init();
  });

program
  .command('vision')
  .description('Create a new vision/project')
  .requiredOption('--create <name>', 'Name of the new vision')
  .action(async (options) => {
    await visionCreate(options.create);
  });

program
  .command('projects')
  .description('List all projects and the active project')
  .action(async () => {
    await projects();
  });

program
  .command('project')
  .description('Manage projects')
  .option('--active <name>', 'Set the active project')
  .option('--drop <name>', 'Drop a project')
  .action(async (options) => {
    if (options.active) {
      await projectActive(options.active);
    } else if (options.drop) {
      await projectDrop(options.drop);
    } else {
      error('MISSING_OPTION', 'Provide either --active or --drop');
    }
  });

program
  .command('status')
  .description('Show current Sitter status')
  .action(async () => {
    await status();
  });

program
  .command('active-vision')
  .description('Show the vision of the active project')
  .action(async () => {
    await activeVision();
  });

program
  .command('implement')
  .description('Return the next task to implement with template prepended')
  .action(async () => {
    await implement();
  });

program
  .command('apply')
  .description('Scan for AI comments and transition to implement if clean')
  .action(async () => {
    await apply();
  });

program
  .command('merge')
  .description('Merge delta specs into target specs')
  .action(async () => {
    await merge();
  });

program
  .command('review')
  .description('Mark the current task as complete and transition to review')
  .action(async () => {
    await review();
  });

program
  .command('archive')
  .description('Archive the active project')
  .action(async () => {
    await archive();
  });

program
  .command('install')
  .description('Install Sitter skills for an AI agent')
  .option('--agent <agent>', 'Target agent (opencode, claude)')
  .action(async (options) => {
    await install({ agent: options.agent });
  });

// Global error handling safety net
process.on('uncaughtException', (err) => {
  error('UNEXPECTED_ERROR', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  error('UNEXPECTED_ERROR', message);
  process.exit(1);
});

program.exitOverride();

(async () => {
  try {
    await program.parseAsync();
  } catch (err) {
    if (err instanceof CommanderError) {
      // Help and version output are already printed to stdout by Commander
      if (err.code === 'commander.help' || err.code === 'commander.version') {
        process.exit(err.exitCode);
      }
      error('CLI_ERROR', err.message);
      process.exit(err.exitCode);
    }
    error(
      'COMMAND_ERROR',
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
})();
