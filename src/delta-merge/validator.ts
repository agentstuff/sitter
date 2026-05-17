/**
 * Delta Plan Validator
 *
 * Validates a delta plan against a target spec before merging.
 */

import type { DeltaPlan } from './delta-parser.js';
import type { TargetSpec } from './target-parser.js';

/**
 * Validate a delta plan against the target spec.
 * Throws an Error with a descriptive message on any validation failure.
 */
export function validateDeltaPlan(plan: DeltaPlan, target: TargetSpec): void {
  // a) No duplicate requirement names within the same section
  const addedNames = plan.added.map((r) => r.name);
  const modifiedNames = plan.modified.map((r) => r.name);
  const removedNames = plan.removed.map((r) => r.name);
  const renamedFrom = plan.renamed.map((r) => r.from);
  const renamedTo = plan.renamed.map((r) => r.to);

  checkDuplicates(addedNames, 'ADDED');
  checkDuplicates(modifiedNames, 'MODIFIED');
  checkDuplicates(removedNames, 'REMOVED');
  checkDuplicates(renamedFrom, 'RENAMED FROM');
  checkDuplicates(renamedTo, 'RENAMED TO');

  // i) If RENAMED exists, MODIFIED should use the NEW name (TO), not old (FROM)
  const renamedFromSet = new Set(renamedFrom);
  for (const name of modifiedNames) {
    if (renamedFromSet.has(name)) {
      throw new Error(
        `MODIFIED requirement "${name}" uses the old name of a RENAMED requirement. Use the new name instead.`
      );
    }
  }

  // h) RENAMED TO must not conflict with ADDED names
  for (const rename of plan.renamed) {
    if (addedNames.includes(rename.to)) {
      throw new Error(`RENAMED TO "${rename.to}" conflicts with an ADDED requirement.`);
    }
  }

  // b) No requirement name appears in multiple sections
  // Exception: RENAMED TO + MODIFIED is allowed (you can modify a renamed requirement)
  const allSectionNames = new Set<string>();
  for (const name of addedNames) {
    if (allSectionNames.has(name)) {
      throw new Error(`Requirement "${name}" appears in multiple sections.`);
    }
    allSectionNames.add(name);
  }
  for (const name of modifiedNames) {
    if (allSectionNames.has(name)) {
      throw new Error(`Requirement "${name}" appears in multiple sections.`);
    }
    allSectionNames.add(name);
  }
  for (const name of removedNames) {
    if (allSectionNames.has(name)) {
      throw new Error(`Requirement "${name}" appears in multiple sections.`);
    }
    allSectionNames.add(name);
  }
  for (const name of renamedFrom) {
    if (allSectionNames.has(name)) {
      throw new Error(`Requirement "${name}" appears in multiple sections.`);
    }
    allSectionNames.add(name);
  }
  for (const name of renamedTo) {
    // MODIFIED + RENAMED TO is an allowed combination
    if (modifiedNames.includes(name)) {
      continue;
    }
    if (allSectionNames.has(name)) {
      throw new Error(`Requirement "${name}" appears in multiple sections.`);
    }
    allSectionNames.add(name);
  }

  // c) Target spec must NOT contain delta headers
  const targetText = target.header + '\n' + Array.from(target.requirements.values()).join('\n');
  const forbiddenHeaders = [
    '## ADDED Requirements',
    '## MODIFIED Requirements',
    '## REMOVED Requirements',
    '## RENAMED Requirements',
  ];
  for (const header of forbiddenHeaders) {
    if (targetText.includes(header)) {
      throw new Error(`Target spec contains forbidden delta header: ${header}`);
    }
  }

  const targetIsNew = target.requirements.size === 0 && target.order.length === 0;

  // d) If target spec doesn't exist (empty/new), only ADDED is allowed
  if (targetIsNew) {
    if (plan.modified.length > 0) {
      throw new Error('Target spec is empty. MODIFIED is not allowed on a new target.');
    }
    if (plan.removed.length > 0) {
      throw new Error('Target spec is empty. REMOVED is not allowed on a new target.');
    }
    if (plan.renamed.length > 0) {
      throw new Error('Target spec is empty. RENAMED is not allowed on a new target.');
    }
  }

  // e) MODIFIED/REMOVED requirements MUST exist in target
  // For MODIFIED, also consider names that will exist after RENAMED operations
  const renamedToSet = new Set(renamedTo);
  for (const name of modifiedNames) {
    if (!target.requirements.has(name) && !renamedToSet.has(name)) {
      throw new Error(`MODIFIED requirement "${name}" does not exist in target spec.`);
    }
  }
  for (const name of removedNames) {
    if (!target.requirements.has(name)) {
      throw new Error(`REMOVED requirement "${name}" does not exist in target spec.`);
    }
  }

  // f) ADDED requirements MUST NOT exist in target
  for (const name of addedNames) {
    if (target.requirements.has(name)) {
      throw new Error(`ADDED requirement "${name}" already exists in target spec.`);
    }
  }

  // g) RENAMED FROM must exist in target, RENAMED TO must NOT exist in target
  for (const rename of plan.renamed) {
    if (!target.requirements.has(rename.from)) {
      throw new Error(`RENAMED FROM requirement "${rename.from}" does not exist in target spec.`);
    }
    if (target.requirements.has(rename.to)) {
      throw new Error(`RENAMED TO requirement "${rename.to}" already exists in target spec.`);
    }
  }

}

function checkDuplicates(names: string[], section: string): void {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) {
      throw new Error(`Duplicate requirement name "${name}" in ${section} section.`);
    }
    seen.add(name);
  }
}
