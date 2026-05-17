import { describe, it, expect } from 'vitest';
import { merge } from './merger.js';
import type { DeltaPlan } from './delta-parser.js';
import type { TargetSpec } from './target-parser.js';

function makeTarget(header: string, requirements: Record<string, string>): TargetSpec {
  const map = new Map<string, string>();
  const order: string[] = [];
  for (const [name, content] of Object.entries(requirements)) {
    map.set(name, content);
    order.push(name);
  }
  return { header, requirements: map, order };
}

describe('merge', () => {
  it('returns just header when both plan and target are empty', () => {
    const plan: DeltaPlan = { added: [], modified: [], removed: [], renamed: [] };
    const target = makeTarget('# Domain', {});
    const result = merge(plan, target);
    expect(result).toBe('# Domain\n## Requirements\n');
  });

  it('appends ADDED requirements to the end', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Feature B', content: '### Requirement: Feature B\nDesc B.' }],
      modified: [],
      removed: [],
      renamed: [],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nDesc A.',
    });
    const result = merge(plan, target);
    expect(result).toContain('## Requirements\n');
    expect(result.indexOf('Feature A')).toBeLessThan(result.indexOf('Feature B'));
    expect(result).toContain('### Requirement: Feature B\nDesc B.');
  });

  it('replaces MODIFIED requirement content', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'Feature A', content: '### Requirement: Feature A\nUpdated desc.' }],
      removed: [],
      renamed: [],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nOld desc.',
    });
    const result = merge(plan, target);
    expect(result).toContain('Updated desc.');
    expect(result).not.toContain('Old desc.');
  });

  it('keeps MODIFIED requirement in original position', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'Feature B', content: '### Requirement: Feature B\nUpdated B.' }],
      removed: [],
      renamed: [],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nDesc A.',
      'Feature B': '### Requirement: Feature B\nDesc B.',
      'Feature C': '### Requirement: Feature C\nDesc C.',
    });
    const result = merge(plan, target);
    const lines = result.split('\n');
    const idxA = lines.findIndex((l) => l.includes('Feature A'));
    const idxB = lines.findIndex((l) => l.includes('Feature B'));
    const idxC = lines.findIndex((l) => l.includes('Feature C'));
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('deletes REMOVED requirements', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [{ name: 'Feature B', content: '' }],
      renamed: [],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nDesc A.',
      'Feature B': '### Requirement: Feature B\nDesc B.',
    });
    const result = merge(plan, target);
    expect(result).toContain('Feature A');
    expect(result).not.toContain('Feature B');
  });

  it('renames RENAMED requirements keeping position and content', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [],
      removed: [],
      renamed: [{ from: 'Feature B', to: 'Feature Beta' }],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nDesc A.',
      'Feature B': '### Requirement: Feature B\nDesc B.',
      'Feature C': '### Requirement: Feature C\nDesc C.',
    });
    const result = merge(plan, target);
    expect(result).not.toContain('### Requirement: Feature B\n');
    expect(result).toContain('### Requirement: Feature Beta\n');
    expect(result).toContain('Desc B.');
    const lines = result.split('\n');
    const idxA = lines.findIndex((l) => l.includes('Feature A'));
    const idxBeta = lines.findIndex((l) => l.includes('Feature Beta'));
    const idxC = lines.findIndex((l) => l.includes('Feature C'));
    expect(idxA).toBeLessThan(idxBeta);
    expect(idxBeta).toBeLessThan(idxC);
  });

  it('performs operations in strict order: RENAMED → REMOVED → MODIFIED → ADDED', () => {
    // Rename A→X, Remove X, Add X — should work because rename happens first
    const plan: DeltaPlan = {
      added: [{ name: 'X', content: '### Requirement: X\nNew X.' }],
      modified: [],
      removed: [{ name: 'X', content: '' }],
      renamed: [{ from: 'A', to: 'X' }],
    };
    const target = makeTarget('# Domain', {
      A: '### Requirement: A\nDesc A.',
    });
    // After rename: X exists with Desc A.
    // After remove: X is removed.
    // After add: X exists with New X.
    const result = merge(plan, target);
    expect(result).toContain('### Requirement: X');
    expect(result).toContain('New X.');
    expect(result).not.toContain('Desc A.');
  });

  it('handles rename-then-modify scenario', () => {
    const plan: DeltaPlan = {
      added: [],
      modified: [{ name: 'New Name', content: '### Requirement: New Name\nUpdated.' }],
      removed: [],
      renamed: [{ from: 'Old Name', to: 'New Name' }],
    };
    const target = makeTarget('# Domain', {
      'Old Name': '### Requirement: Old Name\nOriginal.',
    });
    const result = merge(plan, target);
    expect(result).toContain('### Requirement: New Name');
    expect(result).toContain('Updated.');
    expect(result).not.toContain('Old Name');
    expect(result).not.toContain('Original.');
  });

  it('handles remove-then-add scenario', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Feature A', content: '### Requirement: Feature A\nReborn.' }],
      modified: [],
      removed: [{ name: 'Feature A', content: '' }],
      renamed: [],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nOriginal.',
    });
    const result = merge(plan, target);
    expect(result).toContain('Reborn.');
    expect(result).not.toContain('Original.');
  });

  it('preserves header content', () => {
    const plan: DeltaPlan = { added: [], modified: [], removed: [], renamed: [] };
    const target = makeTarget('# Domain Specification\n\n## Purpose\nSome purpose.', {
      'Feature A': '### Requirement: Feature A\nDesc.',
    });
    const result = merge(plan, target);
    expect(result).toContain('# Domain Specification');
    expect(result).toContain('## Purpose');
    expect(result).toContain('Some purpose.');
  });

  it('handles empty header', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Feature A', content: '### Requirement: Feature A\nDesc.' }],
      modified: [],
      removed: [],
      renamed: [],
    };
    const target = makeTarget('', {});
    const result = merge(plan, target);
    expect(result).toBe('## Requirements\n\n### Requirement: Feature A\nDesc.\n');
  });

  it('handles multiple operations at once', () => {
    const plan: DeltaPlan = {
      added: [{ name: 'Feature D', content: '### Requirement: Feature D\nDesc D.' }],
      modified: [{ name: 'Feature B', content: '### Requirement: Feature B\nUpdated B.' }],
      removed: [{ name: 'Feature C', content: '' }],
      renamed: [{ from: 'Feature A', to: 'Feature Alpha' }],
    };
    const target = makeTarget('# Domain', {
      'Feature A': '### Requirement: Feature A\nDesc A.',
      'Feature B': '### Requirement: Feature B\nDesc B.',
      'Feature C': '### Requirement: Feature C\nDesc C.',
    });
    const result = merge(plan, target);
    expect(result).toContain('Feature Alpha');
    expect(result).toContain('Updated B.');
    expect(result).not.toContain('Feature C');
    expect(result).toContain('Feature D');
    // Check order: Alpha, B, D
    const lines = result.split('\n');
    const idxAlpha = lines.findIndex((l) => l.includes('Feature Alpha'));
    const idxB = lines.findIndex((l) => l.includes('Feature B'));
    const idxD = lines.findIndex((l) => l.includes('Feature D'));
    expect(idxAlpha).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxD);
  });
});
