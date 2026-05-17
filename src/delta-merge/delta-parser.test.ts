import { describe, it, expect } from 'vitest';
import { parseDeltaSpec } from './delta-parser.js';

describe('parseDeltaSpec', () => {
  it('parses empty content', () => {
    const plan = parseDeltaSpec('');
    expect(plan.added).toEqual([]);
    expect(plan.modified).toEqual([]);
    expect(plan.removed).toEqual([]);
    expect(plan.renamed).toEqual([]);
  });

  it('parses ADDED requirements', () => {
    const content = `## ADDED Requirements
### Requirement: New Feature
Description of new feature.

#### Scenario: User clicks button
- GIVEN the user is logged in
- WHEN they click the button
- THEN something happens

### Requirement: Another Feature
Simple description.`;

    const plan = parseDeltaSpec(content);
    expect(plan.added).toHaveLength(2);
    expect(plan.added[0].name).toBe('New Feature');
    expect(plan.added[0].content).toContain('Description of new feature.');
    expect(plan.added[0].content).toContain('#### Scenario: User clicks button');
    expect(plan.added[1].name).toBe('Another Feature');
    expect(plan.added[1].content).toContain('Simple description.');
  });

  it('parses MODIFIED requirements', () => {
    const content = `## MODIFIED Requirements
### Requirement: Existing Feature
Updated description.

#### Scenario: New scenario
- GIVEN ...
- WHEN ...
- THEN ...`;

    const plan = parseDeltaSpec(content);
    expect(plan.modified).toHaveLength(1);
    expect(plan.modified[0].name).toBe('Existing Feature');
    expect(plan.modified[0].content).toContain('Updated description.');
    expect(plan.modified[0].content).toContain('#### Scenario: New scenario');
  });

  it('parses REMOVED requirements', () => {
    const content = `## REMOVED Requirements
### Requirement: Old Feature
Some extra text that should be ignored.

### Requirement: Another Old Feature`;

    const plan = parseDeltaSpec(content);
    expect(plan.removed).toHaveLength(2);
    expect(plan.removed[0].name).toBe('Old Feature');
    expect(plan.removed[1].name).toBe('Another Old Feature');
  });

  it('parses RENAMED requirements', () => {
    const content = `## RENAMED Requirements
- FROM: \`### Requirement: Old Name\`
- TO: \`### Requirement: New Name\`
- FROM: \`### Requirement: Another Old\`
- TO: \`### Requirement: Another New\``;

    const plan = parseDeltaSpec(content);
    expect(plan.renamed).toHaveLength(2);
    expect(plan.renamed[0]).toEqual({ from: 'Old Name', to: 'New Name' });
    expect(plan.renamed[1]).toEqual({ from: 'Another Old', to: 'Another New' });
  });

  it('parses RENAMED without backticks', () => {
    const content = `## RENAMED Requirements
- FROM: ### Requirement: Old Name
- TO: ### Requirement: New Name`;

    const plan = parseDeltaSpec(content);
    expect(plan.renamed).toHaveLength(1);
    expect(plan.renamed[0]).toEqual({ from: 'Old Name', to: 'New Name' });
  });

  it('parses mixed sections', () => {
    const content = `## ADDED Requirements
### Requirement: Feature A
Desc A

## MODIFIED Requirements
### Requirement: Feature B
Desc B

## REMOVED Requirements
### Requirement: Feature C

## RENAMED Requirements
- FROM: \`### Requirement: Feature D\`
- TO: \`### Requirement: Feature E\``;

    const plan = parseDeltaSpec(content);
    expect(plan.added).toHaveLength(1);
    expect(plan.modified).toHaveLength(1);
    expect(plan.removed).toHaveLength(1);
    expect(plan.renamed).toHaveLength(1);
  });

  it('stops parsing a section at the next ## header', () => {
    const content = `## ADDED Requirements
### Requirement: Feature A
Desc A

## Some Other Header
### Requirement: Feature B
Desc B`;

    const plan = parseDeltaSpec(content);
    expect(plan.added).toHaveLength(1);
    expect(plan.added[0].name).toBe('Feature A');
  });

  it('handles content with blank lines', () => {
    const content = `## ADDED Requirements
### Requirement: Feature A

Line after blank.

Another blank above.`;

    const plan = parseDeltaSpec(content);
    expect(plan.added).toHaveLength(1);
    expect(plan.added[0].content).toContain('Line after blank.');
    expect(plan.added[0].content).toContain('Another blank above.');
  });

  it('ignores lines outside known sections', () => {
    const content = `Some intro text.

## ADDED Requirements
### Requirement: Feature A
Desc A`;

    const plan = parseDeltaSpec(content);
    expect(plan.added).toHaveLength(1);
    expect(plan.added[0].name).toBe('Feature A');
  });

  it('handles trailing whitespace in requirement names', () => {
    const content = `## ADDED Requirements
### Requirement: Feature A   
Desc A`;

    const plan = parseDeltaSpec(content);
    expect(plan.added[0].name).toBe('Feature A');
  });

  it('handles RENAMED with TO before FROM gracefully', () => {
    const content = `## RENAMED Requirements
- TO: ### Requirement: New Name
- FROM: ### Requirement: Old Name`;

    const plan = parseDeltaSpec(content);
    // TO without a preceding FROM creates an entry with empty 'to'
    // Then FROM creates a new entry
    expect(plan.renamed.length).toBeGreaterThanOrEqual(1);
  });
});
