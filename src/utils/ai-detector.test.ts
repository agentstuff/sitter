import { describe, it, expect } from 'vitest';
import { findAiComments } from './ai-detector.js';

describe('findAiComments', () => {
  it('returns empty array for empty content', () => {
    const result = findAiComments('/project/src/index.ts', '');
    expect(result).toEqual([]);
  });

  it('returns empty array when no AI comments exist', () => {
    const content = 'const x = 1;\nconsole.log(x);';
    const result = findAiComments('/project/src/index.ts', content);
    expect(result).toEqual([]);
  });

  it('finds a single AI comment', () => {
    const content = 'const x = 1;\n// @@AI@@: Added for debugging';
    const result = findAiComments('/project/src/index.ts', content);
    expect(result).toEqual([{ file: '/project/src/index.ts', line: 2 }]);
  });

  it('finds multiple AI comments', () => {
    const content = `// @@AI@@: Initialize
const x = 1;
// @@AI@@: Log result
console.log(x);
// @@AI@@: Cleanup`;
    const result = findAiComments('/project/src/index.ts', content);
    expect(result).toEqual([
      { file: '/project/src/index.ts', line: 1 },
      { file: '/project/src/index.ts', line: 3 },
      { file: '/project/src/index.ts', line: 5 },
    ]);
  });

  it('uses 1-indexed line numbers', () => {
    const content = `line 1
line 2
// @@AI@@: comment
line 4`;
    const result = findAiComments('/project/src/index.ts', content);
    expect(result).toEqual([{ file: '/project/src/index.ts', line: 3 }]);
  });

  it('handles AI comment in the middle of a line', () => {
    const content = 'const x = 1; /* @@AI@@: fix bug */';
    const result = findAiComments('/project/src/index.ts', content);
    expect(result).toEqual([{ file: '/project/src/index.ts', line: 1 }]);
  });

  it('handles multiple files', () => {
    const content1 = '// @@AI@@: file1';
    const content2 = '// @@AI@@: file2';
    const result1 = findAiComments('/project/a.ts', content1);
    const result2 = findAiComments('/project/b.ts', content2);
    expect(result1).toEqual([{ file: '/project/a.ts', line: 1 }]);
    expect(result2).toEqual([{ file: '/project/b.ts', line: 1 }]);
  });
});
