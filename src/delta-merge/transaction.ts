/**
 * Transactional Merge
 *
 * Executes delta merges transactionally across all delta spec files.
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { existsSync } from 'fs';
import { atomicWrite } from '../utils/atomic-write.js';
import { parseDeltaSpec } from './delta-parser.js';
import { parseTargetSpec } from './target-parser.js';
import { validateDeltaPlan } from './validator.js';
import { merge } from './merger.js';

export interface MergeResult {
  success: boolean;
  merged: string[];
  error?: string;
}

/**
 * Execute merge transactionally across all delta specs.
 * All validations must pass before any files are written.
 */
export async function executeMerge(
  projectSpecsDir: string,
  targetSpecsDir: string
): Promise<MergeResult> {
  try {
    // 1. Find all delta spec files recursively
    const deltaFiles = await findSpecFiles(projectSpecsDir);

    if (deltaFiles.length === 0) {
      return { success: true, merged: [] };
    }

    // 2. Parse and validate all deltas first
    const mergeOps: { targetPath: string; content: string; relPath: string }[] = [];

    for (const deltaPath of deltaFiles) {
      const relPath = relative(projectSpecsDir, deltaPath);
      const targetPath = join(targetSpecsDir, relPath);

      const deltaContent = await readFile(deltaPath, 'utf-8');
      const deltaPlan = parseDeltaSpec(deltaContent);

      let targetContent = '';
      if (existsSync(targetPath)) {
        targetContent = await readFile(targetPath, 'utf-8');
      }
      const targetSpec = parseTargetSpec(targetContent);

      // Validate
      validateDeltaPlan(deltaPlan, targetSpec);

      // Build merged content
      const mergedContent = merge(deltaPlan, targetSpec);
      mergeOps.push({ targetPath, content: mergedContent, relPath });
    }

    // 3. All validations passed — write all files
    for (const op of mergeOps) {
      await atomicWrite(op.targetPath, op.content);
    }

    return {
      success: true,
      merged: mergeOps.map((op) => op.relPath),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, merged: [], error: message };
  }
}

/**
 * Recursively find all files named `spec.md` under the given directory.
 */
async function findSpecFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name === 'spec.md') {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}
