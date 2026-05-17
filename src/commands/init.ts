import { mkdir, writeFile } from 'fs/promises';
import yaml from 'js-yaml';
import {
  sitterDir,
  sitterProjectsDir,
  sitterArchiveDir,
  sitterSpecsDir,
  globalStatusPath,
  taskTemplatePath,
  settingsPath,
} from '../utils/paths.js';
import { isInitialized } from '../utils/validation.js';
import { success, error } from '../utils/output.js';

export async function init(): Promise<void> {
  if (isInitialized()) {
    error('ALREADY_INITIALIZED', 'Already initialized');
    return;
  }

  await mkdir(sitterDir(), { recursive: true });
  await mkdir(sitterProjectsDir(), { recursive: true });
  await mkdir(sitterArchiveDir(), { recursive: true });
  await mkdir(sitterSpecsDir(), { recursive: true });

  const globalStatus = { version: '1.0', activeProject: null };
  await writeFile(globalStatusPath(), JSON.stringify(globalStatus, null, 2), 'utf-8');

  await writeFile(taskTemplatePath(), '', 'utf-8');

  const defaultConfig = { review: { ai_comments: true } };
  await writeFile(settingsPath(), yaml.dump(defaultConfig), 'utf-8');

  success({ initialized: true });
}
