import { describe, it, expect } from 'vitest';
import { validateDeltaPlan } from './validator.js';
import type { DeltaPlan } from './delta-parser.js';
import type { TargetSpec } from './target-parser.js';

function makeTarget(requirements: Record<string, string> = {}): TargetSpec {
  const map = new Map<string, string>();
  const order: string[] = [];
  for (const [name, content] of Object.entries(requirements)) {
    map.set(name, content || `### Requirement: ${name}\nDesc.`);
    order.push(name);
  }
  return { header: '# Domain\n\n## Purpose\nTest.', requirements: map, order };
}

describe('validateDeltaPlan', () => {
  it('passes for valid empty plan on empty target', () => {
    const plan: DeltaPlan = { added: [], modified: [], removed: [], renamed: [] };
    const target = makeTarget();
    expect(() => validateDeltaPlan(plan, target)).not.toThrow();
  });

  it('passes for valid ADDED on empty target', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'New Feature', content: 'Desc.' }],
      modified: [],
      removed: [],
      renamed: [],
    };
    const target = makeTarget();
    expect(() => validateDeltaPlan(plan, target)).not.toThrow();
  });

  // a) No duplicate requirement names within the same section
  it('fails on duplicate names in ADDED', () => {
    const plan: DeltaPlan = {
      added: [
        { name: 'Dup', content: 'A' },
        { name: 'Dup', content: 'B' },
      ],
      modified: [],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Duplicate requirement name "Dup" in ADDED section.'
    );
  });

  it('fails on duplicate names in MODIFIED', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [
        { name: 'Dup', content: 'A' },
        { name: 'Dup', content: 'B' },
      ],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Dup: '' }))).toThrow(
      'Duplicate requirement name "Dup" in MODIFIED section.'
    );
  });

  it('fails on duplicate names in REMOVED', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [{ name: 'Dup', content: '' }, { name: 'Dup', content: '' }],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Dup: '' }))).toThrow(
      'Duplicate requirement name "Dup" in REMOVED section.'
    );
  });

  it('fails on duplicate FROM in RENAMED', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
      ],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ A: '' }))).toThrow(
      'Duplicate requirement name "A" in RENAMED FROM section.'
    );
  });

  it('fails on duplicate TO in RENAMED', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [
        { from: 'A', to: 'X' },
        { from: 'B', to: 'X' },
      ],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ A: '', B: '' }))).toThrow(
      'Duplicate requirement name "X" in RENAMED TO section.'
    );
  });

  // b) No requirement name appears in multiple sections
  it('fails when name appears in ADDED and MODIFIED', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Dup', content: 'A' }],
      modified: [{ name: 'Dup', content: 'B' }],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Requirement "Dup" appears in multiple sections.'
    );
  });

  it('fails when name appears in ADDED and REMOVED', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Dup', content: 'A' }],
      modified: [],
      removed: [{ name: 'Dup', content: '' }],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Requirement "Dup" appears in multiple sections.'
    );
  });

  it('fails when name appears in ADDED and RENAMED FROM', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Dup', content: 'A' }],
      modified: [],
      removed: [],
      renamed: [{ from: 'Dup', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Requirement "Dup" appears in multiple sections.'
    );
  });

  it('fails when name appears in ADDED and RENAMED TO', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'New', content: 'A' }],
      modified: [],
      removed: [],
      renamed: [{ from: 'Old', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'RENAMED TO "New" conflicts with an ADDED requirement.'
    );
  });

  // c) Target spec must NOT contain delta headers
  it('fails when target contains ## ADDED Requirements', () => {
    const plan: DeltaPlan = { added: [], modified: [], removed: [], renamed: [] };
    const target: TargetSpec = {
      header: '# Domain\n\n## ADDED Requirements',
      requirements: new Map(),
      order: [],
    };
    expect(() => validateDeltaPlan(plan, target)).toThrow(
      'Target spec contains forbidden delta header: ## ADDED Requirements'
    );
  });

  it('fails when target contains ## MODIFIED Requirements', () => {
    const plan: DeltaPlan = { added: [], modified: [], removed: [], renamed: [] };
    const target: TargetSpec = {
      header: '# Domain',
      requirements: new Map([['X', '## MODIFIED Requirements']]),
      order: ['X'],
    };
    expect(() => validateDeltaPlan(plan, target)).toThrow(
      'Target spec contains forbidden delta header: ## MODIFIED Requirements'
    );
  });

  // d) If target spec is empty, only ADDED is allowed
  it('fails on MODIFIED when target is empty', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'X', content: 'Desc.' }],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Target spec is empty. MODIFIED is not allowed on a new target.'
    );
  });

  it('fails on REMOVED when target is empty', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [{ name: 'X', content: '' }],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Target spec is empty. REMOVED is not allowed on a new target.'
    );
  });

  it('fails on RENAMED when target is empty', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [{ from: 'X', to: 'Y' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget())).toThrow(
      'Target spec is empty. RENAMED is not allowed on a new target.'
    );
  });

  // e) MODIFIED/REMOVED requirements MUST exist in target
  it('fails when MODIFIED requirement does not exist in target', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'Missing', content: 'Desc.' }],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Existing: '' }))).toThrow(
      'MODIFIED requirement "Missing" does not exist in target spec.'
    );
  });

  it('fails when REMOVED requirement does not exist in target', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [{ name: 'Missing', content: '' }],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Existing: '' }))).toThrow(
      'REMOVED requirement "Missing" does not exist in target spec.'
    );
  });

  // f) ADDED requirements MUST NOT exist in target
  it('fails when ADDED requirement already exists in target', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Existing', content: 'Desc.' }],
      modified: [],
      removed: [],
      renamed: [],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Existing: '' }))).toThrow(
      'ADDED requirement "Existing" already exists in target spec.'
    );
  });

  // g) RENAMED FROM must exist, RENAMED TO must NOT exist
  it('fails when RENAMED FROM does not exist in target', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [{ from: 'Missing', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Existing: '' }))).toThrow(
      'RENAMED FROM requirement "Missing" does not exist in target spec.'
    );
  });

  it('fails when RENAMED TO already exists in target', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [{ from: 'Old', to: 'Existing' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Old: '', Existing: '' }))).toThrow(
      'RENAMED TO requirement "Existing" already exists in target spec.'
    );
  });

  // h) RENAMED TO must not conflict with ADDED names
  it('fails when RENAMED TO conflicts with ADDED', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'New', content: 'Desc.' }],
      modified: [],
      removed: [],
      renamed: [{ from: 'Old', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Old: '' }))).toThrow(
      'RENAMED TO "New" conflicts with an ADDED requirement.'
    );
  });

  // i) MODIFIED should use the NEW name, not old (FROM)
  it('fails when MODIFIED uses old name of a RENAMED requirement', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'Old', content: 'Desc.' }],
      removed: [],
      renamed: [{ from: 'Old', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Old: '' }))).toThrow(
      'MODIFIED requirement "Old" uses the old name of a RENAMED requirement. Use the new name instead.'
    );
  });

  it('passes when MODIFIED uses new name of a RENAMED requirement', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'New', content: 'Desc.' }],
      removed: [],
      renamed: [{ from: 'Old', to: 'New' }],
    };
    expect(() => validateDeltaPlan(plan, makeTarget({ Old: '' }))).not.toThrow();
  });

  // Comprehensive valid case
  it('passes for a complex valid plan', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Feature C', content: 'Desc C.' }],
      modified: [{ name: 'Feature B', content: 'Updated B.' }],
      removed: [{ name: 'Feature D', content: '' }],
      renamed: [{ from: 'Feature A', to: 'Feature Alpha' }],
    };
    const target = makeTarget({
      'Feature A': '',
      'Feature B': '',
      'Feature D': '',
    });
    expect(() => validateDeltaPlan(plan, target)).not.toThrow();
  });
});
