import { describe, it, expect } from 'vitest';
import { parseTasks, findNextTask } from './task-parser.js';

describe('parseTasks', () => {
  it('returns empty array for empty content', () => {
    expect(parseTasks('')).toEqual([]);
  });

  it('throws when content exceeds maximum length', () => {
    const hugeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    expect(() => parseTasks(hugeContent)).toThrow('Content too large to parse');
  });

  it('returns empty array when no task headings', () => {
    expect(parseTasks('# Some markdown\n\nNo tasks here.')).toEqual([]);
  });

  it('parses a single task with steps', () => {
    const content = `## Task 1: Create the core poet logic
- [x] Create \`src/core/poet.ts\`.
- [x] Define a constant \`HUNGARIAN_WORDS\`.
- [ ] Implement helper function...`;

    const tasks = parseTasks(content);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual({
      id: 1,
      title: 'Task 1: Create the core poet logic',
      body: '## Task 1: Create the core poet logic\n- [x] Create `src/core/poet.ts`.\n- [x] Define a constant `HUNGARIAN_WORDS`.\n- [ ] Implement helper function...',
      steps: [
        { checked: true, text: 'Create `src/core/poet.ts`.' },
        { checked: true, text: 'Define a constant `HUNGARIAN_WORDS`.' },
        { checked: false, text: 'Implement helper function...' },
      ],
    });
  });

  it('parses multiple tasks', () => {
    const content = `# TASKS: Project Name

## Task 1: First task
- [x] Step 1
- [ ] Step 2

## Task 2: Second task
- [ ] Step A
- [x] Step B`;

    const tasks = parseTasks(content);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toBe(1);
    expect(tasks[0].title).toBe('Task 1: First task');
    expect(tasks[1].id).toBe(2);
    expect(tasks[1].title).toBe('Task 2: Second task');
    expect(tasks[1].steps).toEqual([
      { checked: false, text: 'Step A' },
      { checked: true, text: 'Step B' },
    ]);
  });

  it('handles checked and unchecked steps', () => {
    const content = `## Task 1
- [x] Checked step
- [X] Also checked
- [ ] Unchecked step`;

    const tasks = parseTasks(content);
    expect(tasks[0].steps).toEqual([
      { checked: true, text: 'Checked step' },
      { checked: true, text: 'Also checked' },
      { checked: false, text: 'Unchecked step' },
    ]);
  });

  it('handles title with checkbox', () => {
    const content = `## [ ] Task 1: Unchecked task
- [ ] Step 1

## [X] Task 2: Checked task
- [x] Step 2`;

    const tasks = parseTasks(content);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('Task 1: Unchecked task');
    expect(tasks[1].title).toBe('Task 2: Checked task');
    expect(tasks[0].body).toBe('## [ ] Task 1: Unchecked task\n- [ ] Step 1');
    expect(tasks[1].body).toBe('## [X] Task 2: Checked task\n- [x] Step 2');
  });

  it('handles title without checkbox', () => {
    const content = `## Task 1: No checkbox
- [ ] Step 1`;

    const tasks = parseTasks(content);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task 1: No checkbox');
    expect(tasks[0].body).toBe('## Task 1: No checkbox\n- [ ] Step 1');
  });

  it('handles task with no steps', () => {
    const content = `## Task 1: No steps
Just some notes.`;

    const tasks = parseTasks(content);
    expect(tasks[0].steps).toEqual([]);
    expect(tasks[0].title).toBe('Task 1: No steps');
  });

  it('uses sequential ID when title does not match Task N', () => {
    const content = `## Some other title
- [ ] Step 1

## Another title
- [ ] Step 2`;

    const tasks = parseTasks(content);
    expect(tasks[0].id).toBe(1);
    expect(tasks[1].id).toBe(2);
  });

  it('extracts ID from title when it matches Task N', () => {
    const content = `## Task 5: Out of order
- [ ] Step 1

## Task 3: Also out of order
- [ ] Step 2`;

    const tasks = parseTasks(content);
    expect(tasks[0].id).toBe(5);
    expect(tasks[1].id).toBe(3);
  });

  it('handles mixed case x in checkboxes', () => {
    const content = `## Task 1
- [x] Step 1
- [X] Step 2
- [ ] Step 3`;

    const tasks = parseTasks(content);
    expect(tasks[0].steps).toEqual([
      { checked: true, text: 'Step 1' },
      { checked: true, text: 'Step 2' },
      { checked: false, text: 'Step 3' },
    ]);
  });
});

describe('findNextTask', () => {
  it('finds first task with unchecked title checkbox', () => {
    const tasks = parseTasks(`## [X] Task 1: Done
- [x] Step 1

## [ ] Task 2: Next
- [x] Step 2

## [ ] Task 3: Later
- [ ] Step 3`);

    const next = findNextTask(tasks);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(2);
    expect(next!.title).toBe('Task 2: Next');
  });

  it('finds first task with no title checkbox but unchecked steps', () => {
    const tasks = parseTasks(`## Task 1: Done
- [x] Step 1

## Task 2: Next
- [ ] Step 2

## Task 3: Later
- [x] Step 3`);

    const next = findNextTask(tasks);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(2);
    expect(next!.title).toBe('Task 2: Next');
  });

  it('finds task where title is checked but steps are not', () => {
    const tasks = parseTasks(`## [X] Task 1: Done
- [x] Step 1

## [X] Task 2: Forgot steps
- [ ] Step 2`);

    const next = findNextTask(tasks);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(2);
    expect(next!.title).toBe('Task 2: Forgot steps');
  });

  it('returns null when all tasks are done', () => {
    const tasks = parseTasks(`## [X] Task 1: Done
- [x] Step 1

## [X] Task 2: Also done
- [x] Step 2`);

    expect(findNextTask(tasks)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(findNextTask([])).toBeNull();
  });

  it('returns task when only task has unchecked title checkbox', () => {
    const tasks = parseTasks(`## [ ] Task 1: Only
- [x] Step 1`);

    const next = findNextTask(tasks);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(1);
  });

  it('returns task when no title checkbox and all steps unchecked', () => {
    const tasks = parseTasks(`## Task 1: Only
- [ ] Step 1
- [ ] Step 2`);

    const next = findNextTask(tasks);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(1);
  });

  it('returns null when task has no title checkbox and no steps', () => {
    const tasks = parseTasks(`## Task 1: No steps
Just notes.`);

    expect(findNextTask(tasks)).toBeNull();
  });

  it('returns null when task has checked title and no steps', () => {
    const tasks = parseTasks(`## [X] Task 1: No steps
Just notes.`);

    expect(findNextTask(tasks)).toBeNull();
  });
});
