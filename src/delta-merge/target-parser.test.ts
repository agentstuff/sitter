import { describe, it, expect } from 'vitest';
import { parseTargetSpec } from './target-parser.js';

describe('parseTargetSpec', () => {
  it('parses empty content', () => {
    const spec = parseTargetSpec('');
    expect(spec.header).toBe('');
    expect(spec.requirements.size).toBe(0);
    expect(spec.order).toEqual([]);
  });

  it('parses header only (no requirements)', () => {
    const content = `# Domain Specification

## Purpose
Some purpose text.`;

    const spec = parseTargetSpec(content);
    expect(spec.header).toBe('# Domain Specification\n\n## Purpose\nSome purpose text.');
    expect(spec.requirements.size).toBe(0);
    expect(spec.order).toEqual([]);
  });

  it('parses a spec with requirements', () => {
    const content = `# Domain Specification

## Purpose
Some purpose.

## Requirements

### Requirement: Feature A
Description A.

#### Scenario: Scenario 1
- GIVEN x
- WHEN y
- THEN z

### Requirement: Feature B
Description B.`;

    const spec = parseTargetSpec(content);
    expect(spec.header).toBe('# Domain Specification\n\n## Purpose\nSome purpose.');
    expect(spec.requirements.size).toBe(2);
    expect(spec.order).toEqual(['Feature A', 'Feature B']);

    const reqA = spec.requirements.get('Feature A');
    expect(reqA).toContain('### Requirement: Feature A');
    expect(reqA).toContain('Description A.');
    expect(reqA).toContain('#### Scenario: Scenario 1');

    const reqB = spec.requirements.get('Feature B');
    expect(reqB).toContain('### Requirement: Feature B');
    expect(reqB).toContain('Description B.');
  });

  it('preserves requirement order', () => {
    const content = `## Requirements
### Requirement: Z
Desc.
### Requirement: A
Desc.
### Requirement: M
Desc.`;

    const spec = parseTargetSpec(content);
    expect(spec.order).toEqual(['Z', 'A', 'M']);
  });

  it('handles content without ## Requirements header', () => {
    const content = `# Just a header
Some text without requirements section.`;

    const spec = parseTargetSpec(content);
    expect(spec.header).toBe(content);
    expect(spec.requirements.size).toBe(0);
  });

  it('ignores lines before the first requirement', () => {
    const content = `## Requirements
Some intro text before requirements.

### Requirement: Feature A
Desc A.`;

    const spec = parseTargetSpec(content);
    expect(spec.order).toEqual(['Feature A']);
    const reqA = spec.requirements.get('Feature A');
    expect(reqA).toBe('### Requirement: Feature A\nDesc A.');
  });

  it('handles multiple blank lines between requirements', () => {
    const content = `## Requirements
### Requirement: Feature A
Desc A.


### Requirement: Feature B
Desc B.`;

    const spec = parseTargetSpec(content);
    expect(spec.order).toEqual(['Feature A', 'Feature B']);
  });

  it('handles trailing content after last requirement', () => {
    const content = `## Requirements
### Requirement: Feature A
Desc A.

Some trailing text.`;

    const spec = parseTargetSpec(content);
    const reqA = spec.requirements.get('Feature A');
    expect(reqA).toContain('Desc A.');
    expect(reqA).toContain('Some trailing text.');
  });
});
