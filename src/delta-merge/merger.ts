/**
 * Merge Algorithm
 *
 * Applies a validated delta plan to a target spec and returns the merged text.
 */

import type { DeltaPlan } from './delta-parser.js';
import type { TargetSpec } from './target-parser.js';

/**
 * Merge a delta plan into a target spec.
 * Operation order (strict): RENAMED → REMOVED → MODIFIED → ADDED
 */
export function merge(plan: DeltaPlan, target: TargetSpec): string {
  // Work on copies
  const requirements = new Map(target.requirements);
  const order = [...target.order];

  // 1. RENAMED: Change header, keep content and position
  for (const rename of plan.renamed) {
    const content = requirements.get(rename.from);
    if (content === undefined) {
      throw new Error(`RENAMED requirement "${rename.from}" not found in target.`);
    }

    // Replace the header line
    const lines = content.split('\n');
    lines[0] = `### Requirement: ${rename.to}`;
    const newContent = lines.join('\n');

    // Update map and order
    requirements.delete(rename.from);
    requirements.set(rename.to, newContent);

    const index = order.indexOf(rename.from);
    if (index !== -1) {
      order[index] = rename.to;
    }
  }

  // 2. REMOVED: Delete from target
  for (const removed of plan.removed) {
    requirements.delete(removed.name);
    const index = order.indexOf(removed.name);
    if (index !== -1) {
      order.splice(index, 1);
    }
  }

  // 3. MODIFIED: Replace entire requirement content, keep position
  for (const modified of plan.modified) {
    requirements.set(modified.name, modified.content);
  }

  // 4. ADDED: Append to end
  for (const added of plan.added) {
    requirements.set(added.name, added.content);
    order.push(added.name);
  }

  // Assemble output
  let result = '';

  if (target.header) {
    result += target.header.trimEnd() + '\n';
  }

  result += '## Requirements\n';

  const reqBlocks: string[] = [];
  for (const name of order) {
    const content = requirements.get(name);
    if (content !== undefined) {
      reqBlocks.push(content.trimEnd());
    }
  }

  if (reqBlocks.length > 0) {
    result += '\n' + reqBlocks.join('\n\n') + '\n';
  }

  return result;
}
