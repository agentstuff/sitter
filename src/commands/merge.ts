import { assertActiveProject } from '../state/validation.js';
import { sitterSpecsDir, projectDir } from '../utils/paths.js';
import { success, error } from '../utils/output.js';
import { executeMerge } from '../delta-merge/transaction.js';
import { existsSync } from 'fs';
import { join } from 'path';

export async function merge(): Promise<void> {
  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  const projectSpecsDir = join(projectDir(projectName), 'specs');

  if (!existsSync(projectSpecsDir)) {
    error('NO_DELTA_SPECS', 'Project has no delta specs directory.');
    return;
  }

  const result = await executeMerge(projectSpecsDir, sitterSpecsDir());

  if (result.success) {
    success({ merged_specs: result.merged });
  } else {
    error('MERGE_FAILED', result.error ?? 'Merge failed for an unknown reason.');
  }
}
