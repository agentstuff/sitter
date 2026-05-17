export function findAiComments(
  filePath: string,
  content: string
): { file: string; line: number }[] {
  const lines = content.split('\n');
  const results: { file: string; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('@@AI@@:')) {
      results.push({ file: filePath, line: i + 1 });
    }
  }

  return results;
}
