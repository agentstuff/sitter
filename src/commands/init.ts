import { mkdir, writeFile } from 'fs/promises';
import yaml from 'js-yaml';
import chalk from 'chalk';
import {
  sitterDir,
  sitterProjectsDir,
  sitterArchiveDir,
  globalStatusPath,
  taskTemplatePath,
  settingsPath,
} from '../utils/paths.js';
import { isInitialized } from '../utils/validation.js';
import { packageVersion } from '../utils/version.js';
import { checkForUpdate } from '../utils/npm-registry.js';

export async function init(): Promise<void> {
  if (isInitialized()) {
    console.error(chalk.red('Error: Sitter is already initialized in this directory.'));
    return;
  }

  await mkdir(sitterDir(), { recursive: true });
  await mkdir(sitterProjectsDir(), { recursive: true });
  await mkdir(sitterArchiveDir(), { recursive: true });

  const globalStatus = { version: packageVersion, activeProject: null };
  await writeFile(globalStatusPath(), JSON.stringify(globalStatus, null, 2), 'utf-8');

  await writeFile(taskTemplatePath(), '', 'utf-8');

  const defaultConfig = { review: { ai_comments: true } };
  await writeFile(settingsPath(), yaml.dump(defaultConfig), 'utf-8');

  console.log(chalk.green('✓ Sitter initialized successfully!'));

  const newerVersion = await checkForUpdate();
  if (newerVersion) {
    console.log(chalk.yellow(`\nA new version of Sitter is available: ${newerVersion} (you have ${packageVersion}).`));
    console.log(chalk.yellow('Run: npm install -g @agentstuff/sitter'));
    console.log(chalk.yellow('Note: After updating, run `sitter install` again to refresh your skills.'));
  }
}
